import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/app/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET: Fetch all statuses for a specific board, ordered by their position.
 */
export async function GET(request: NextRequest) {
     try {
          const { searchParams } = new URL(request.url);
          const boardId = searchParams.get('board_id');

          if (!boardId) {
               return NextResponse.json({ error: 'board_id is required' }, { status: 400 });
          }

          const { data, error } = await getSupabase().from('statuses').select('*').eq('board_id', boardId).order('order_index', { ascending: true });

          if (error) {
               console.error('Error fetching statuses:', error);
               return NextResponse.json({ error: error.message }, { status: 500 });
          }

          return NextResponse.json(data || []);
     } catch (error) {
          console.error('Error in GET /api/statuses:', error);
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
     }
}

/**
 * POST: Create a new status for a board.
 */
export async function POST(request: NextRequest) {
     try {
          const body = await request.json();
          const { board_id, label, color, order_index } = body;

          if (!board_id || !label) {
               return NextResponse.json({ error: 'board_id and label are required' }, { status: 400 });
          }

          const { data, error } = await getSupabase()
               .from('statuses')
               .insert({
                    board_id,
                    label,
                    color: color || '#94a3b8',
                    order_index: order_index || 0,
               })
               .select()
               .single();

          if (error) {
               console.error('Error creating status:', error);
               return NextResponse.json({ error: error.message }, { status: 500 });
          }

          return NextResponse.json(data);
     } catch (error) {
          console.error('Error in POST /api/statuses:', error);
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
     }
}

/**
 * PATCH: Update an existing status (label, color, or order_index).
 */
export async function PATCH(request: NextRequest) {
     try {
          const body = await request.json();
          const { id, label, color, order_index } = body;

          if (!id) {
               return NextResponse.json({ error: 'id is required' }, { status: 400 });
          }

          const updates: Partial<{
               label: string;
               color: string;
               order_index: number;
          }> = {};

          if (label !== undefined) updates.label = label;
          if (color !== undefined) updates.color = color;
          if (order_index !== undefined) updates.order_index = order_index;

          const { data, error } = await getSupabase().from('statuses').update(updates).eq('id', id).select().single();

          if (error) {
               console.error('Error updating status:', error);
               return NextResponse.json({ error: error.message }, { status: 500 });
          }

          return NextResponse.json(data);
     } catch (error) {
          console.error('Error in PATCH /api/statuses:', error);
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
     }
}

/**
 * DELETE: Remove a status by its ID.
 */
export async function DELETE(request: NextRequest) {
     try {
          const { searchParams } = new URL(request.url);
          const id = searchParams.get('id');

          if (!id) {
               return NextResponse.json({ error: 'id is required' }, { status: 400 });
          }

          const { error } = await getSupabase().from('statuses').delete().eq('id', id);

          if (error) {
               console.error('Error deleting status:', error);
               return NextResponse.json({ error: error.message }, { status: 500 });
          }

          return NextResponse.json({ success: true });
     } catch (error) {
          console.error('Error in DELETE /api/statuses:', error);
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
     }
}
