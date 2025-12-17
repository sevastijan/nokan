import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSupabase } from '@/app/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Get all boards for the authenticated user
 */
export async function GET(request: NextRequest) {
     try {
          const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

          if (!token?.email) {
               return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          }

          const supabase = getSupabase();

          const { data, error } = await supabase.from('boards').select('*').eq('owner', token.email).order('created_at', { ascending: false });

          if (error) {
               return NextResponse.json({ error: 'Database error' }, { status: 500 });
          }

          return NextResponse.json(data || []);
     } catch {
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
     }
}

/**
 * Create a new board for the authenticated user
 */
export async function POST(request: NextRequest) {
     try {
          const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

          if (!token?.email) {
               return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          }

          const body = await request.json();
          const { title } = body;

          if (!title || typeof title !== 'string') {
               return NextResponse.json({ error: 'Title is required' }, { status: 400 });
          }

          const supabase = getSupabase(); // <-- Znowu singleton

          const { data: boardData, error: boardError } = await supabase
               .from('boards')
               .insert({
                    title: title.trim(),
                    owner: token.email,
               })
               .select()
               .single();

          if (boardError) {
               return NextResponse.json({ error: 'Failed to create board' }, { status: 500 });
          }

          // Create default columns
          const defaultColumns = [
               { title: 'To Do', order: 0, board_id: boardData.id },
               { title: 'In Progress', order: 1, board_id: boardData.id },
               { title: 'Done', order: 2, board_id: boardData.id },
          ];

          const { error: columnsError } = await supabase.from('columns').insert(defaultColumns);

          if (columnsError) {
               console.error('Failed to create default columns:', columnsError);
          }

          return NextResponse.json(boardData);
     } catch (err) {
          console.error('POST /api/boards error:', err);
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
     }
}
