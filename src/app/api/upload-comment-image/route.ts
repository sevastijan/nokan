import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { getSupabaseAdmin } from '@/app/lib/supabase';
import { authOptions } from '@/app/lib/auth';

/**
 * POST: Upload an image attachment for a comment.
 * Stores the image in Supabase Storage and records metadata in the database.
 * Returns a long-lived signed URL (1 year).
 */
export async function POST(request: NextRequest) {
     try {
          const session = await getServerSession(authOptions);

          if (!session?.user?.email) {
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

          if (!file.type.startsWith('image/')) {
               return Response.json({ error: 'Only images are allowed' }, { status: 400 });
          }

          const fileName = `${Date.now()}-${file.name}`;
          const filePath = `comments/${taskId}/${fileName}`;

          const supabaseAdmin = getSupabaseAdmin();

          const { error: uploadError } = await supabaseAdmin.storage.from('comments_images').upload(filePath, file, {
               contentType: file.type,
               upsert: false,
          });

          if (uploadError) {
               console.error('Storage upload error:', uploadError);
               return Response.json({ error: uploadError.message }, { status: 500 });
          }

          const { data: userData } = await supabaseAdmin.from('users').select('id').eq('email', session.user.email).single();

          if (!userData) {
               await supabaseAdmin.storage.from('comments_images').remove([filePath]);
               return Response.json({ error: 'User not found in database' }, { status: 404 });
          }

          const { data: imageRecord, error: dbError } = await supabaseAdmin
               .from('comment_images')
               .insert({
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
               await supabaseAdmin.storage.from('comments_images').remove([filePath]);
               return Response.json({ error: dbError.message }, { status: 500 });
          }

          const { data: signedData, error: signedError } = await supabaseAdmin.storage.from('comments_images').createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

          if (signedError || !signedData?.signedUrl) {
               console.error('Signed URL error:', signedError);
               return Response.json({ error: 'Failed to generate signed URL' }, { status: 500 });
          }

          return Response.json({
               success: true,
               image: {
                    ...imageRecord,
                    signedUrl: signedData.signedUrl,
               },
               message: 'Image uploaded successfully',
          });
     } catch (error) {
          console.error('Upload error:', error);
          return Response.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
     }
}

/**
 * DELETE: Remove a comment image and its file from storage.
 */
export async function DELETE(request: NextRequest) {
     try {
          const session = await getServerSession(authOptions);

          if (!session?.user?.id) {
               return Response.json({ error: 'Unauthorized' }, { status: 401 });
          }

          const body = await request.json();
          const { imageId, filePath } = body;

          if (!imageId || !filePath) {
               return Response.json({ error: 'Image ID and file path are required' }, { status: 400 });
          }

          const supabaseAdmin = getSupabaseAdmin();

          const { error: storageError } = await supabaseAdmin.storage.from('comments_images').remove([filePath]);

          if (storageError) {
               console.error('Storage delete error:', storageError);
          }

          const { error: dbError } = await supabaseAdmin.from('comment_images').delete().eq('id', imageId);

          if (dbError) {
               console.error('DB delete error:', dbError);
               return Response.json({ error: dbError.message }, { status: 500 });
          }

          return Response.json({
               success: true,
               message: 'Image deleted successfully',
          });
     } catch (error) {
          console.error('Delete error:', error);
          return Response.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
     }
}
