import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { getSupabaseAdmin } from '@/app/lib/supabase';
import { authOptions } from '@/app/lib/auth';

/**
 * POST: Upload a file attachment for a specific task.
 * Stores the file in Supabase Storage and saves metadata in the database.
 */
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

          const supabaseAdmin = getSupabaseAdmin();

          // Upload file to storage
          const { error: uploadError } = await supabaseAdmin.storage.from('attachments').upload(filePath, file, {
               contentType: file.type,
               upsert: false,
          });

          if (uploadError) {
               console.error('Storage upload error:', uploadError);
               return Response.json({ error: uploadError.message }, { status: 500 });
          }

          // Resolve internal user ID from google_id
          const { data: userData } = await supabaseAdmin.from('users').select('id').eq('google_id', session.user.id).single();

          if (!userData) {
               await supabaseAdmin.storage.from('attachments').remove([filePath]);
               return Response.json({ error: 'User not found in database' }, { status: 404 });
          }

          // Save attachment metadata
          const { data: attachment, error: dbError } = await supabaseAdmin
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
               await supabaseAdmin.storage.from('attachments').remove([filePath]);
               return Response.json({ error: dbError.message }, { status: 500 });
          }

          return Response.json({
               success: true,
               attachment,
               message: 'File uploaded successfully',
          });
     } catch (error) {
          console.error('Upload error:', error);
          return Response.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
     }
}

/**
 * DELETE: Remove an attachment and its file from storage.
 */
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

          const supabaseAdmin = getSupabaseAdmin();

          // Remove file from storage (ignore error if already gone)
          const { error: storageError } = await supabaseAdmin.storage.from('attachments').remove([filePath]);

          if (storageError) {
               console.error('Storage delete error:', storageError);
          }

          // Remove database record
          const { error: dbError } = await supabaseAdmin.from('task_attachments').delete().eq('id', attachmentId);

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
          return Response.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
     }
}

/**
 * GET: Download a file attachment.
 * Supports inline viewing or forced download via 'action' query param.
 */
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

          const supabaseAdmin = getSupabaseAdmin();

          // Download file from storage
          const { data, error } = await supabaseAdmin.storage.from('attachments').download(filePath);

          if (error || !data) {
               console.error('Storage download error:', error);
               return Response.json({ error: error?.message || 'File not found' }, { status: 404 });
          }

          // Fetch metadata for correct filename and MIME type
          const { data: attachmentInfo } = await supabaseAdmin.from('task_attachments').select('file_name, mime_type').eq('file_path', filePath).single();

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
          return Response.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
     }
}
