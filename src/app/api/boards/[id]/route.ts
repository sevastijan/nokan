import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createClient } from '@supabase/supabase-js';
import { authOptions } from '../../auth/[...nextauth]/route';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

/**
 * Get board data by ID
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
     try {
          const session = await getServerSession(authOptions);

          if (!session?.user?.email) {
               return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          }

          const boardId = params.id;

          const { data: dashboardData, error } = await supabase.from('dashboards').select('*').eq('id', boardId).eq('owner', session.user.email).single();

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
     } catch {
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
     }
}

/**
 * Update board data by ID
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
     try {
          const session = await getServerSession(authOptions);

          if (!session?.user?.email) {
               return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          }

          const boardId = params.id;
          const { title } = await request.json();

          if (!title || !title.trim()) {
               return NextResponse.json({ error: 'Title is required' }, { status: 400 });
          }

          const { data, error } = await supabase.from('dashboards').update({ title: title.trim() }).eq('id', boardId).eq('owner', session.user.email).select().single();

          if (error) {
               if (error.code === 'PGRST116') {
                    return NextResponse.json({ error: 'Board not found' }, { status: 404 });
               }
               return NextResponse.json({ error: 'Database error' }, { status: 500 });
          }

          return NextResponse.json(data);
     } catch {
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
     }
}

/**
 * Delete board by ID
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
     try {
          const session = await getServerSession(authOptions);

          if (!session?.user?.email) {
               return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          }

          const boardId = params.id;

          const { error } = await supabase.from('dashboards').delete().eq('id', boardId).eq('owner', session.user.email);

          if (error) {
               return NextResponse.json({ error: 'Database error' }, { status: 500 });
          }

          return NextResponse.json({ message: 'Board deleted successfully' });
     } catch {
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
     }
}
