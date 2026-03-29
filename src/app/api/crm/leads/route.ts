import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SERVICE_ROLE_KEY!,
  );
}

interface LeadPayload {
  // Contact
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  position?: string;
  // Company
  company_name?: string;
  company_domain?: string;
  company_industry?: string;
  // Deal
  title: string;
  value?: number;
  value_max?: number;
  currency?: string;
  source?: string;
  notes?: string;
}

async function validateApiKey(request: NextRequest): Promise<boolean> {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey) return false;

  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
  const supabase = getServiceSupabase();

  const { data } = await supabase
    .from('crm_api_keys')
    .select('id')
    .eq('key_hash', keyHash)
    .eq('active', true)
    .single();

  return !!data;
}

async function notifyOwners(supabase: ReturnType<typeof getServiceSupabase>, dealTitle: string, companyName: string, contactName: string) {
  try {
    const { data: owners } = await supabase
      .from('users')
      .select('id, email')
      .eq('role', 'OWNER');

    if (!owners || owners.length === 0) return;

    for (const owner of owners) {
      // In-app notification
      await supabase.from('notifications').insert({
        user_id: owner.id,
        type: 'new_submission',
        message: `Nowy lead: ${dealTitle} od ${contactName} (${companyName || 'brak firmy'})`,
        read: false,
      });

      // Email notification
      if (owner.email) {
        try {
          const { Resend } = await import('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: process.env.EMAIL_FROM || 'noreply@example.com',
            to: owner.email,
            subject: `Nowy lead CRM: ${dealTitle}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0f172a;">Nowy lead w CRM</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; color: #64748b;">Deal</td><td style="padding: 8px 0; font-weight: 600;">${dealTitle}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b;">Kontakt</td><td style="padding: 8px 0;">${contactName}</td></tr>
                  ${companyName ? `<tr><td style="padding: 8px 0; color: #64748b;">Firma</td><td style="padding: 8px 0;">${companyName}</td></tr>` : ''}
                </table>
                <p style="margin-top: 24px;">
                  <a href="https://nokan.nkdlab.space/crm/pipeline" style="background: #00a68b; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none;">Otwórz Pipeline</a>
                </p>
              </div>
            `,
          });
        } catch {
          // Email is best-effort
        }
      }
    }
  } catch {
    // Notifications are best-effort
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const isValid = await validateApiKey(request);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 });
    }

    const body: LeadPayload = await request.json();

    // Validate required fields
    if (!body.title || !body.first_name || !body.last_name) {
      return NextResponse.json(
        { error: 'Missing required fields: title, first_name, last_name' },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // 1. Create company (if name provided)
    let companyId: string | null = null;
    if (body.company_name) {
      const { data: company, error: companyErr } = await supabase
        .from('crm_companies')
        .insert({
          name: body.company_name,
          domain: body.company_domain || null,
          industry: body.company_industry || null,
        })
        .select('id')
        .single();

      if (companyErr) {
        console.error('[crm/leads] company create error:', companyErr);
        return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
      }
      companyId = company.id;
    }

    // 2. Create contact (linked to company if exists)
    const { data: contact, error: contactErr } = await supabase
      .from('crm_contacts')
      .insert({
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email || null,
        phone: body.phone || null,
        position: body.position || null,
        company_id: companyId,
      })
      .select('id')
      .single();

    if (contactErr) {
      console.error('[crm/leads] contact create error:', contactErr);
      return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
    }

    // 3. Create deal (stage: lead)
    const { data: deal, error: dealErr } = await supabase
      .from('crm_deals')
      .insert({
        title: body.title,
        company_id: companyId,
        contact_id: contact.id,
        stage: 'lead',
        value: body.value || 0,
        value_max: body.value_max || 0,
        currency: body.currency || 'PLN',
        probability: 10,
        source: body.source || null,
        notes: body.notes || null,
      })
      .select('id')
      .single();

    if (dealErr) {
      console.error('[crm/leads] deal create error:', dealErr);
      return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 });
    }

    // 4. Link contact to deal via crm_deal_contacts
    await supabase.from('crm_deal_contacts').insert({
      deal_id: deal.id,
      contact_id: contact.id,
    });

    // 5. Notify owners
    const contactName = `${body.first_name} ${body.last_name}`;
    await notifyOwners(supabase, body.title, body.company_name || '', contactName);

    return NextResponse.json({
      success: true,
      deal_id: deal.id,
      company_id: companyId,
      contact_id: contact.id,
    }, { status: 201 });

  } catch (error) {
    console.error('[crm/leads] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
