import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { getSupabaseAdmin } from '@/app/lib/supabase';
import { authOptions } from '@/app/lib/auth';

/**
 * POST: Upload or update user avatar.
 * Replaces existing avatar if one exists (upsert: true).
 */
export async function POST(request: NextRequest) {
     try {
          const session = await getServerSession(authOptions);

          if (!session?.user?.email) {
               return Response.json({ error: 'Unauthorized' }, { status: 401 });
          }

          const formData = await request.formData();
          const file = formData.get('file') as File;

          if (!file) {
               return Response.json({ error: 'No file provided' }, { status: 400 });
          }

          if (file.size > 5 * 1024 * 1024) {
               return Response.json({ error: 'File too large (max 5MB)' }, { status: 400 });
          }

          const supabaseAdmin = getSupabaseAdmin();

          // Resolve internal user ID from email
          const { data: user, error: userError } = await supabaseAdmin.from('users').select('id').eq('email', session.user.email).single();

          if (userError || !user) {
               return Response.json({ error: 'User not found' }, { status: 404 });
          }

          const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
          const filePath = `${user.id}/avatar.${fileExt}`;

          // Upload (or replace) avatar in storage
          const { error: uploadError } = await supabaseAdmin.storage.from('avatars').upload(filePath, file, {
               upsert: true,
               contentType: file.type || `image/${fileExt}`,
          });

          if (uploadError) {
               console.error('Upload error:', uploadError);
               return Response.json({ error: uploadError.message }, { status: 500 });
          }

          // Generate public URL
          const { data: urlData } = supabaseAdmin.storage.from('avatars').getPublicUrl(filePath);

          return Response.json({
               success: true,
               publicUrl: urlData.publicUrl,
          });
     } catch (error) {
          console.error('Avatar upload route error:', error);
          return Response.json({ error: 'Internal server error' }, { status: 500 });
     }
}
