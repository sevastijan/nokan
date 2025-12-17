/**
 * POST /api/public/tickets/[id]/attachments
 * Upload a file attachment to a ticket
 * Requires: write permission
 */

import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabase';
import { authenticatePublicApi, successResponse } from '@/app/lib/public-api/auth-middleware';
import type { PublicApiResponse } from '@/app/lib/public-api/types';

interface RouteParams {
    params: Promise<{ id: string }>;
}

interface AttachmentResponse {
    id: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    created_at: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * GET /api/public/tickets/[id]/attachments
 * List attachments for a ticket
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    const auth = await authenticatePublicApi(request, 'read');
    if (!auth.success) {
        return auth.error;
    }

    const { context, headers } = auth;
    const { id: ticketId } = await params;
    const supabase = getSupabaseAdmin();

    // Verify ticket belongs to board
    const { data: ticket, error: ticketError } = await supabase
        .from('tasks')
        .select('id')
        .eq('id', ticketId)
        .eq('board_id', context.boardId)
        .single();

    if (ticketError || !ticket) {
        return successResponse({ error: 'Ticket not found' }, headers, 404);
    }

    // Fetch attachments
    const { data: attachments, error } = await supabase
        .from('task_attachments')
        .select('id, file_name, file_size, mime_type, created_at')
        .eq('task_id', ticketId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching attachments:', error);
        return successResponse({ error: 'Failed to fetch attachments' }, headers, 500);
    }

    const response: PublicApiResponse<AttachmentResponse[]> = {
        data: attachments || [],
    };

    return successResponse(response, headers);
}

/**
 * POST /api/public/tickets/[id]/attachments
 * Upload an attachment to a ticket
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    const auth = await authenticatePublicApi(request, 'write');
    if (!auth.success) {
        return auth.error;
    }

    const { context, headers } = auth;
    const { id: ticketId } = await params;

    // Parse multipart form data
    let formData: FormData;
    try {
        formData = await request.formData();
    } catch {
        return successResponse({ error: 'Invalid form data. Use multipart/form-data.' }, headers, 400);
    }

    const file = formData.get('file') as File | null;

    if (!file) {
        return successResponse({ error: 'No file provided. Use "file" field.' }, headers, 400);
    }

    if (file.size > MAX_FILE_SIZE) {
        return successResponse(
            { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
            headers,
            400
        );
    }

    const supabase = getSupabaseAdmin();

    // Verify ticket belongs to board
    const { data: ticket, error: ticketError } = await supabase
        .from('tasks')
        .select('id')
        .eq('id', ticketId)
        .eq('board_id', context.boardId)
        .single();

    if (ticketError || !ticket) {
        return successResponse({ error: 'Ticket not found' }, headers, 404);
    }

    // Generate unique file path
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${timestamp}-${safeFileName}`;
    const filePath = `task-attachments/${ticketId}/${fileName}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file, {
            contentType: file.type || 'application/octet-stream',
            upsert: false,
        });

    if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return successResponse({ error: 'Failed to upload file' }, headers, 500);
    }

    // Save attachment metadata
    const { data: attachment, error: dbError } = await supabase
        .from('task_attachments')
        .insert({
            task_id: ticketId,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type || 'application/octet-stream',
            uploaded_by: null, // API upload - no user
        })
        .select('id, file_name, file_size, mime_type, created_at')
        .single();

    if (dbError) {
        console.error('DB insert error:', dbError);
        // Try to clean up uploaded file
        await supabase.storage.from('attachments').remove([filePath]);
        return successResponse({ error: 'Failed to save attachment' }, headers, 500);
    }

    const response: PublicApiResponse<AttachmentResponse> = {
        data: {
            id: attachment.id,
            file_name: attachment.file_name,
            file_size: attachment.file_size,
            mime_type: attachment.mime_type,
            created_at: attachment.created_at,
        },
    };

    return successResponse(response, headers, 201);
}
