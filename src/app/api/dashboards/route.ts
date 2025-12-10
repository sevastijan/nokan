import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

/**
 * Get all boards for the authenticated user
 * @returns Promise<NextResponse> - Array of boards or error response
 */
export async function GET(request: NextRequest) {
     try {
          const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

          if (!token?.email) {
               return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          }

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
 * @param request - Next.js request object
 * @returns Promise<NextResponse> - Created board data or error response
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

          // Create default columns for the new board
          const defaultColumns = [
               { title: 'To Do', order: 0, board_id: boardData.id },
               { title: 'In Progress', order: 1, board_id: boardData.id },
               { title: 'Done', order: 2, board_id: boardData.id },
          ];

          await supabase.from('columns').insert(defaultColumns);

          return NextResponse.json(boardData);
     } catch {
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
     }
}
