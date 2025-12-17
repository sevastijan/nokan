import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getSupabase } from '@/app/lib/supabase';
import { authOptions } from '@/app/lib/auth';

/**
 * PUT: Update board title by ID.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
     try {
          const { id: boardId } = await params;

          const session = await getServerSession(authOptions);

          if (!session?.user?.email) {
               return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          }

          const { title } = await request.json();

          if (!title || typeof title !== 'string' || !title.trim()) {
               return NextResponse.json({ error: 'Valid title is required' }, { status: 400 });
          }

          const supabase = getSupabase();

          const { data, error } = await supabase.from('boards').update({ title: title.trim() }).eq('id', boardId).eq('owner', session.user.email).select().single();

          if (error) {
               return NextResponse.json({ error: 'Failed to update board' }, { status: 500 });
          }

          return NextResponse.json(data);
     } catch {
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
     }
}

/**
 * DELETE: Delete board by ID along with its related columns.
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
     try {
          const { id: boardId } = await params;

          const session = await getServerSession(authOptions);

          if (!session?.user?.email) {
               return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          }

          const supabase = getSupabase();

          // Delete all columns related to this board
          const { error: columnsError } = await supabase.from('columns').delete().eq('board_id', boardId);

          if (columnsError) {
               return NextResponse.json({ error: 'Failed to delete board columns' }, { status: 500 });
          }

          // Delete the board itself
          const { error: boardError } = await supabase.from('boards').delete().eq('id', boardId).eq('owner', session.user.email);

          if (boardError) {
               return NextResponse.json({ error: 'Failed to delete board' }, { status: 500 });
          }

          return NextResponse.json({ message: 'Board deleted successfully' });
     } catch {
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
     }
}
