import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { getSupabaseAdmin } from '@/app/lib/supabase';

export async function POST(req: NextRequest) {
     const session = await getServerSession(authOptions);
     if (!session?.user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }

     const formData = await req.formData();
     const file = formData.get('file') as File | null;
     const boardId = formData.get('boardId') as string | null;

     if (!file || !boardId) {
          return NextResponse.json({ error: 'File and boardId required' }, { status: 400 });
     }

     if (file.size > 5 * 1024 * 1024) {
          return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
     }

     const supabase = getSupabaseAdmin();
     const filePath = `board-${boardId}/avatar.png`;

     const buffer = Buffer.from(await file.arrayBuffer());

     const { error } = await supabase.storage
          .from('avatars')
          .upload(filePath, buffer, {
               contentType: file.type,
               upsert: true,
          });

     if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
     }

     const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);

     return NextResponse.json({ url: urlData.publicUrl });
}
