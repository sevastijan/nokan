import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabase';

export async function POST(req: NextRequest) {
     const { boardIds } = await req.json();
     if (!Array.isArray(boardIds)) {
          return NextResponse.json({ avatars: {} });
     }

     const supabase = getSupabaseAdmin();
     const avatars: Record<string, string> = {};
     const ts = Date.now();

     await Promise.all(
          boardIds.map(async (boardId: string) => {
               const { data } = await supabase.storage.from('avatars').list(`board-${boardId}`, { limit: 1 });
               if (data && data.length > 0 && data[0].name.startsWith('avatar')) {
                    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(`board-${boardId}/${data[0].name}`);
                    avatars[boardId] = urlData.publicUrl + '?t=' + ts;
               }
          }),
     );

     return NextResponse.json({ avatars });
}
