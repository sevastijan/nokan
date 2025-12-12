import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextRequest } from 'next/server';

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SERVICE_ROLE_KEY!);

export async function POST(request: NextRequest) {
     const session = await getServerSession(authOptions);

     if (!session?.user?.email) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 });
     }

     try {
          const formData = await request.formData();
          const file = formData.get('file') as File;

          if (!file) {
               return Response.json({ error: 'No file provided' }, { status: 400 });
          }

          if (file.size > 5 * 1024 * 1024) {
               return Response.json({ error: 'File too large (max 5MB)' }, { status: 400 });
          }

          const { data: user, error: userError } = await supabaseAdmin.from('users').select('id').eq('email', session.user.email).single();

          if (userError || !user) {
               return Response.json({ error: 'User not found' }, { status: 404 });
          }

          const fileExt = file.name.split('.').pop() || 'jpg';
          const filePath = `${user.id}/avatar.${fileExt}`;

          const { error: uploadError } = await supabaseAdmin.storage.from('avatars').upload(filePath, file, {
               upsert: true,
               contentType: file.type,
          });

          if (uploadError) {
               console.error('Upload error:', uploadError);
               return Response.json({ error: uploadError.message }, { status: 500 });
          }

          const { data: urlData } = supabaseAdmin.storage.from('avatars').getPublicUrl(filePath);

          return Response.json({
               success: true,
               publicUrl: urlData.publicUrl,
          });
     } catch (error) {
          console.error('Upload route error:', error);
          return Response.json({ error: 'Internal server error' }, { status: 500 });
     }
}
