import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSupabase } from '@/app/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET: Fetch board data by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
     try {
          const { id: boardId } = await params;

          const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

          if (!token?.email) {
               return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          }

          const supabase = getSupabase();

          const { data: dashboardData, error } = await supabase.from('dashboards').select('*').eq('id', boardId).eq('owner', token.email).single();

          if (error) {
               if (error.code === 'PGRST116') {
                    return NextResponse.json({ error: 'Board not found' }, { status: 404 });
               }
               return NextResponse.json({ error: 'Database error' }, { status: 500 });
          }

          const boardData = {
               id: dashboardData.id,
               title: dashboardData.title,
               owner: dashboardData.owner,
               created_at: dashboardData.created_at,
               columns: [
                    { id: `todo-${dashboardData.id}`, title: 'To Do', tasks: [], boardId: dashboardData.id },
                    { id: `inprogress-${dashboardData.id}`, title: 'In Progress', tasks: [], boardId: dashboardData.id },
                    { id: `done-${dashboardData.id}`, title: 'Done', tasks: [], boardId: dashboardData.id },
               ],
          };

          return NextResponse.json(boardData);
     } catch (err) {
          console.error('GET /api/boards/[id] error:', err);
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
     }
}

/**
 * PUT: Update board title by ID
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
     try {
          const { id: boardId } = await params;

          const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

          if (!token?.email) {
               return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          }

          const { title } = await request.json();

          if (!title || !title.trim()) {
               return NextResponse.json({ error: 'Title is required' }, { status: 400 });
          }

          const supabase = getSupabase();

          const { data, error } = await supabase.from('dashboards').update({ title: title.trim() }).eq('id', boardId).eq('owner', token.email).select().single();

          if (error) {
               if (error.code === 'PGRST116') {
                    return NextResponse.json({ error: 'Board not found' }, { status: 404 });
               }
               return NextResponse.json({ error: 'Database error' }, { status: 500 });
          }

          return NextResponse.json(data);
     } catch (err) {
          console.error('PUT /api/boards/[id] error:', err);
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
     }
}

/**
 * DELETE: Delete board by ID
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
     try {
          const { id: boardId } = await params;

          const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

          if (!token?.email) {
               return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          }

          const supabase = getSupabase();

          const { error } = await supabase.from('dashboards').delete().eq('id', boardId).eq('owner', token.email);

          if (error) {
               return NextResponse.json({ error: 'Database error' }, { status: 500 });
          }

          return NextResponse.json({ message: 'Board deleted successfully' });
     } catch (err) {
          console.error('DELETE /api/boards/[id] error:', err);
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
     }
}
