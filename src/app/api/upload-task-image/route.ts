import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { getSupabaseAdmin } from '@/app/lib/supabase';
import { authOptions } from '@/app/lib/auth';

/**
 * POST: Upload image to task description.
 * Stores image in 'task-images' bucket and creates record in task_images table.
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

          if (file.size > 10 * 1024 * 1024) {
               return Response.json({ error: 'Plik za duży (max 10MB)' }, { status: 400 });
          }

          if (!file.type.startsWith('image/')) {
               return Response.json({ error: 'Plik musi być obrazem' }, { status: 400 });
          }

          const supabaseAdmin = getSupabaseAdmin();

          // Get user
          const { data: user, error: userError } = await supabaseAdmin.from('users').select('id').eq('email', session.user.email).single();

          if (userError || !user) {
               console.error('User lookup error:', userError);
               return Response.json({ error: 'User not found' }, { status: 404 });
          }

          // Generate unique filename
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(2, 15);
          const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';

          if (taskId) {
               // Existing task: verify access, store under taskId path, create DB record
               const { data: task, error: taskError } = await supabaseAdmin.from('tasks').select('id, board_id').eq('id', taskId).single();

               if (taskError || !task) {
                    console.error('Task lookup error:', taskError);
                    return Response.json({ error: 'Nie znaleziono zadania' }, { status: 404 });
               }

               const fileName = `${taskId}/${timestamp}-${randomString}.${fileExt}`;
               const arrayBuffer = await file.arrayBuffer();
               const buffer = new Uint8Array(arrayBuffer);

               const { data: uploadData, error: uploadError } = await supabaseAdmin.storage.from('task-images').upload(fileName, buffer, {
                    contentType: file.type || `image/${fileExt}`,
                    cacheControl: '3600',
                    upsert: false,
               });

               if (uploadError) {
                    console.error('Upload error:', uploadError);
                    return Response.json({ error: `Błąd uploadu: ${uploadError.message}` }, { status: 500 });
               }

               const { data: imageData, error: dbError } = await supabaseAdmin
                    .from('task_images')
                    .insert({
                         task_id: taskId,
                         file_name: file.name,
                         file_path: uploadData.path,
                         file_size: file.size,
                         mime_type: file.type,
                         uploaded_by: user.id,
                    })
                    .select('*')
                    .single();

               if (dbError) {
                    console.error('Database error:', dbError);
                    try {
                         await supabaseAdmin.storage.from('task-images').remove([uploadData.path]);
                    } catch (cleanupError) {
                         console.error('Cleanup error:', cleanupError);
                    }
                    return Response.json({ error: `Błąd zapisu: ${dbError.message}` }, { status: 500 });
               }

               const publicUrl = supabaseAdmin.storage.from('task-images').getPublicUrl(uploadData.path).data.publicUrl;

               return Response.json({
                    success: true,
                    image: {
                         ...imageData,
                         signed_url: publicUrl,
                    },
               });
          } else {
               // Draft image (new task): store under draft-images/{userId}/, skip DB record
               const fileName = `draft-images/${user.id}/${timestamp}-${randomString}.${fileExt}`;
               const arrayBuffer = await file.arrayBuffer();
               const buffer = new Uint8Array(arrayBuffer);

               const { data: uploadData, error: uploadError } = await supabaseAdmin.storage.from('task-images').upload(fileName, buffer, {
                    contentType: file.type || `image/${fileExt}`,
                    cacheControl: '3600',
                    upsert: false,
               });

               if (uploadError) {
                    console.error('Upload error:', uploadError);
                    return Response.json({ error: `Błąd uploadu: ${uploadError.message}` }, { status: 500 });
               }

               const publicUrl = supabaseAdmin.storage.from('task-images').getPublicUrl(uploadData.path).data.publicUrl;

               return Response.json({
                    success: true,
                    image: {
                         signed_url: publicUrl,
                    },
               });
          }
     } catch (error) {
          console.error('Task image upload route error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Internal server error';
          return Response.json({ error: errorMessage }, { status: 500 });
     }
}
