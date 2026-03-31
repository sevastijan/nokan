import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getServiceSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SERVICE_ROLE_KEY!);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `wiki/${timestamp}-${safeName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from('wiki-images')
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      // Try creating bucket if it doesn't exist
      await supabase.storage.createBucket('wiki-images', { public: true });
      const { error: retryError } = await supabase.storage
        .from('wiki-images')
        .upload(path, buffer, { contentType: file.type, upsert: false });
      if (retryError) throw retryError;
    }

    const { data: publicUrl } = supabase.storage.from('wiki-images').getPublicUrl(path);

    return NextResponse.json({ url: publicUrl.publicUrl });
  } catch (error) {
    console.error('[docs/upload] error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
