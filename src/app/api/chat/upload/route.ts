import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { getSupabaseAdmin } from '@/app/lib/supabase';
import { authOptions } from '@/app/lib/auth';

/**
 * POST: Upload a file attachment for a chat message.
 * Stores the file in Supabase Storage (bucket: chat-attachments).
 */
export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.email) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const formData = await request.formData();
		const file = formData.get('file') as File;
		const channelId = formData.get('channelId') as string;
		const messageId = formData.get('messageId') as string;

		if (!file) {
			return Response.json({ error: 'No file provided' }, { status: 400 });
		}
		if (!channelId || !messageId) {
			return Response.json({ error: 'channelId and messageId are required' }, { status: 400 });
		}
		if (file.size > 10 * 1024 * 1024) {
			return Response.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
		}

		const ext = file.name.includes('.') ? '.' + file.name.split('.').pop() : '';
		const safeFileName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
		const filePath = `${channelId}/${safeFileName}`;
		const supabaseAdmin = getSupabaseAdmin();

		// Ensure bucket exists
		const { data: buckets } = await supabaseAdmin.storage.listBuckets();
		if (!buckets?.some((b) => b.name === 'chat-attachments')) {
			await supabaseAdmin.storage.createBucket('chat-attachments', {
				public: false,
				fileSizeLimit: 10 * 1024 * 1024,
			});
		}

		// Upload to storage
		const { error: uploadError } = await supabaseAdmin.storage
			.from('chat-attachments')
			.upload(filePath, file, {
				contentType: file.type,
				upsert: false,
			});

		if (uploadError) {
			console.error('Chat upload error:', uploadError);
			return Response.json({ error: uploadError.message }, { status: 500 });
		}

		// Resolve internal user ID from email
		const { data: userData } = await supabaseAdmin
			.from('users')
			.select('id')
			.eq('email', session.user.email)
			.single();

		if (!userData) {
			await supabaseAdmin.storage.from('chat-attachments').remove([filePath]);
			return Response.json({ error: 'User not found' }, { status: 404 });
		}

		// Save attachment metadata
		const { data: attachment, error: dbError } = await supabaseAdmin
			.from('chat_attachments')
			.insert({
				message_id: messageId,
				file_name: file.name,
				file_path: filePath,
				file_size: file.size,
				mime_type: file.type,
				uploaded_by: userData.id,
			})
			.select()
			.single();

		if (dbError) {
			console.error('Chat attachment DB error:', dbError);
			await supabaseAdmin.storage.from('chat-attachments').remove([filePath]);
			return Response.json({ error: dbError.message }, { status: 500 });
		}

		return Response.json({ success: true, attachment });
	} catch (error) {
		console.error('Chat upload error:', error);
		return Response.json(
			{ error: error instanceof Error ? error.message : 'Internal server error' },
			{ status: 500 }
		);
	}
}

/**
 * GET: Download/view a chat attachment.
 */
export async function GET(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const filePath = searchParams.get('filePath');
		const action = searchParams.get('action');

		if (!filePath) {
			return Response.json({ error: 'filePath is required' }, { status: 400 });
		}

		const supabaseAdmin = getSupabaseAdmin();
		const { data, error } = await supabaseAdmin.storage.from('chat-attachments').download(filePath);

		if (error || !data) {
			return Response.json({ error: error?.message || 'File not found' }, { status: 404 });
		}

		const { data: attachmentInfo } = await supabaseAdmin
			.from('chat_attachments')
			.select('file_name, mime_type')
			.eq('file_path', filePath)
			.single();

		const fileName = attachmentInfo?.file_name || 'download';
		const mimeType = attachmentInfo?.mime_type || 'application/octet-stream';

		const headers = new Headers();
		headers.set('Content-Type', mimeType);
		headers.set(
			'Content-Disposition',
			action === 'download' ? `attachment; filename="${fileName}"` : `inline; filename="${fileName}"`
		);

		return new Response(data, { status: 200, headers });
	} catch (error) {
		console.error('Chat download error:', error);
		return Response.json(
			{ error: error instanceof Error ? error.message : 'Internal server error' },
			{ status: 500 }
		);
	}
}
