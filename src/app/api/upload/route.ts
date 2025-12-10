import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { NextRequest } from 'next/server';

function getSupabaseAdmin() {
     return createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
          process.env.SERVICE_ROLE_KEY || 'placeholder-key',
          {
               auth: {
                    autoRefreshToken: false,
                    persistSession: false,
               },
          }
     );
}

export async function POST(request: NextRequest) {
     try {
          const session = await getServerSession(authOptions);


          if (!session?.user?.id) {
               return Response.json({ error: 'Unauthorized' }, { status: 401 });
          }

          const formData = await request.formData();
          const file = formData.get('file') as File;
          const taskId = formData.get('taskId') as string;

          if (!file) {
               return Response.json({ error: 'No file provided' }, { status: 400 });
          }

          if (!taskId) {
               return Response.json({ error: 'Task ID is required' }, { status: 400 });
          }

          if (file.size > 10 * 1024 * 1024) {
               return Response.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
          }

          const fileName = `${Date.now()}-${file.name}`;
          const filePath = `task-attachments/${taskId}/${fileName}`;

          const { error: uploadError } = await getSupabaseAdmin().storage.from('attachments').upload(filePath, file, {
               contentType: file.type,
               upsert: false,
          });

          if (uploadError) {
               console.error('Storage upload error:', uploadError);
               return Response.json({ error: uploadError.message }, { status: 500 });
          }

          const { data: userData } = await getSupabaseAdmin().from('users').select('id').eq('google_id', session.user.id).single();

          if (!userData) {
               await getSupabaseAdmin().storage.from('attachments').remove([filePath]);
               
               return Response.json({ error: 'User not found in database' }, { status: 404 });
          }

          const { data: attachment, error: dbError } = await getSupabaseAdmin()
               .from('task_attachments')
               .insert({
                    task_id: taskId,
                    file_name: file.name,
                    file_path: filePath,
                    file_size: file.size,
                    mime_type: file.type,
                    uploaded_by: userData.id,
               })
               .select()
               .single();

          if (dbError) {
               console.error('DB insert error:', dbError);
               await getSupabaseAdmin().storage.from('attachments').remove([filePath]);
               return Response.json({ error: dbError.message }, { status: 500 });
          }

          return Response.json({
               success: true,
               attachment,
               message: 'File uploaded successfully',
          });
     } catch (error) {
          console.error('Upload error:', error);
          return Response.json(
               {
                    error: error instanceof Error ? error.message : 'Internal server error',
               },
               { status: 500 },
          );
     }
}

export async function DELETE(request: NextRequest) {
     try {
          const session = await getServerSession(authOptions);

          if (!session?.user?.id) {
               return Response.json({ error: 'Unauthorized' }, { status: 401 });
          }

          const body = await request.json();
          const { attachmentId, filePath } = body;

          if (!attachmentId || !filePath) {
               return Response.json({ error: 'Attachment ID and file path are required' }, { status: 400 });
          }

          const { error: storageError } = await getSupabaseAdmin().storage.from('attachments').remove([filePath]);

          if (storageError) {
               console.error('Storage delete error:', storageError);
          }

          const { error: dbError } = await getSupabaseAdmin().from('task_attachments').delete().eq('id', attachmentId);

          if (dbError) {
               console.error('DB delete error:', dbError);
               return Response.json({ error: dbError.message }, { status: 500 });
          }

          return Response.json({
               success: true,
               message: 'Attachment deleted successfully',
          });
     } catch (error) {
          console.error('Delete error:', error);
          return Response.json(
               {
                    error: error instanceof Error ? error.message : 'Internal server error',
               },
               { status: 500 },
          );
     }
}

export async function GET(request: NextRequest) {
     try {
          const session = await getServerSession(authOptions);

          if (!session?.user?.id) {
               return Response.json({ error: 'Unauthorized' }, { status: 401 });
          }

          const { searchParams } = new URL(request.url);
          const filePath = searchParams.get('filePath');
          const action = searchParams.get('action');

          if (!filePath) {
               return Response.json({ error: 'File path is required' }, { status: 400 });
          }

          const { data, error } = await getSupabaseAdmin().storage.from('attachments').download(filePath);

          if (error || !data) {
               console.error('Storage download error:', error);
               return Response.json({ error: error?.message || 'File not found' }, { status: 404 });
          }

          const { data: attachmentInfo } = await getSupabaseAdmin().from('task_attachments').select('file_name, mime_type').eq('file_path', filePath).single();

          const fileName = attachmentInfo?.file_name || 'download';
          const mimeType = attachmentInfo?.mime_type || 'application/octet-stream';

          const headers = new Headers();
          headers.set('Content-Type', mimeType);

          if (action === 'download') {
               headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
          } else {
               headers.set('Content-Disposition', `inline; filename="${fileName}"`);
          }

          return new Response(data, {
               status: 200,
               headers,
          });
     } catch (error) {
          console.error('Download error:', error);
          return Response.json(
               {
                    error: error instanceof Error ? error.message : 'Internal server error',
               },
               { status: 500 },
          );
     }
}
