import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createClient } from '@supabase/supabase-js';
import { authOptions } from '../../auth/[...nextauth]/route';

function getSupabase() {
     return createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
     );
}

/**
 * Update board by ID
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
     try {
          const session = await getServerSession(authOptions);

          if (!session?.user?.email) {
               return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          }

          const { title } = await request.json();

          if (!title || typeof title !== 'string' || !title.trim()) {
               return NextResponse.json({ error: 'Valid title is required' }, { status: 400 });
          }

          const boardId = params.id;

          const { data, error } = await getSupabase().from('boards').update({ title: title.trim() }).eq('id', boardId).eq('owner', session.user.email).select().single();

          if (error) {
               return NextResponse.json({ error: 'Failed to update board' }, { status: 500 });
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

          // Delete all columns related to this board
          const { error: columnsError } = await getSupabase().from('columns').delete().eq('board_id', boardId);

          if (columnsError) {
               return NextResponse.json({ error: 'Failed to delete board columns' }, { status: 500 });
          }

          // Delete the board itself
          const { error: boardError } = await getSupabase().from('boards').delete().eq('id', boardId).eq('owner', session.user.email);

          if (boardError) {
               return NextResponse.json({ error: 'Failed to delete board' }, { status: 500 });
          }

          return NextResponse.json({ message: 'Board deleted successfully' });
     } catch {
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
     }
}
