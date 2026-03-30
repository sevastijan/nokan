import { EndpointBuilder, BaseQueryFn } from '@reduxjs/toolkit/query';
import { getSupabase } from '@/app/lib/supabase';
import {
  CrmCompany,
  CrmContact,
  CrmDeal,
  CrmDealPartner,
  CrmActivity,
  CrmExchangeRate,
  CrmDealContact,
  CrmDealStage,
  STAGE_PROBABILITY,
} from '@/app/types/crmTypes';

type SupabaseError = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

const getErrorMessage = (err: unknown): string => {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object') {
    const e = err as SupabaseError;
    if (e.message && typeof e.message === 'string') return e.message;
    if (e.details && typeof e.details === 'string') return e.details;
    if (e.hint && typeof e.hint === 'string') return e.hint;
    if (e.code && typeof e.code === 'string') return `Error code: ${e.code}`;
    return JSON.stringify(err);
  }
  return 'Unknown error';
};

/** Helper to unwrap Supabase join results that may be array or object */
const unwrapJoin = <T>(val: T | T[] | null | undefined): T | null => {
  if (val == null) return null;
  if (Array.isArray(val)) return val[0] ?? null;
  return val;
};

export const crmEndpoints = (builder: EndpointBuilder<BaseQueryFn, string, string>) => ({
  // ---------------------------------------------------------------------------
  // Companies
  // ---------------------------------------------------------------------------

  getCrmCompanies: builder.query<CrmCompany[], void>({
    async queryFn() {
      try {
        const { data, error } = await getSupabase()
          .from('crm_companies')
          .select(
            `
            *,
            contacts:crm_contacts(id),
            deals:crm_deals(id)
          `,
          )
          .order('name', { ascending: true });

        if (error) throw error;

        const companies: CrmCompany[] = (data ?? []).map((row: Record<string, unknown>) => ({
          ...(row as unknown as CrmCompany),
          contact_count: Array.isArray(row.contacts) ? row.contacts.length : 0,
          deal_count: Array.isArray(row.deals) ? row.deals.length : 0,
          contacts: undefined,
          deals: undefined,
        }));

        return { data: companies };
      } catch (err) {
        console.error('[crmEndpoints.getCrmCompanies] error:', err);
        return { error: { status: 'CUSTOM_ERROR' as const, error: getErrorMessage(err) } };
      }
    },
    providesTags: (result) =>
      result
        ? [
            ...result.map(({ id }) => ({ type: 'CrmCompany' as const, id })),
            { type: 'CrmCompany' as const, id: 'LIST' },
          ]
        : [{ type: 'CrmCompany' as const, id: 'LIST' }],
  }),

  getCrmCompanyById: builder.query<CrmCompany, string>({
    async queryFn(companyId) {
      try {
        const { data, error } = await getSupabase()
          .from('crm_companies')
          .select(
            `
            *,
            contacts:crm_contacts(id),
            deals:crm_deals(id)
          `,
          )
          .eq('id', companyId)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Company not found');

        const row = data as Record<string, unknown>;
        const company: CrmCompany = {
          ...(row as unknown as CrmCompany),
          contact_count: Array.isArray(row.contacts) ? (row.contacts as unknown[]).length : 0,
          deal_count: Array.isArray(row.deals) ? (row.deals as unknown[]).length : 0,
        };

        return { data: company };
      } catch (err) {
        console.error('[crmEndpoints.getCrmCompanyById] error:', err);
        return { error: { status: 'CUSTOM_ERROR' as const, error: getErrorMessage(err) } };
      }
    },
    providesTags: (_result, _error, id) => [{ type: 'CrmCompany', id }],
  }),

  createCrmCompany: builder.mutation<CrmCompany, Omit<CrmCompany, 'id' | 'created_at' | 'updated_at' | 'contact_count' | 'deal_count'>>({
    async queryFn(payload) {
      try {
        const { data, error } = await getSupabase()
          .from('crm_companies')
          .insert(payload)
          .select('*')
          .single();

        if (error) throw error;
        if (!data) throw new Error('Create company failed');

        return { data: data as CrmCompany };
      } catch (err) {
        console.error('[crmEndpoints.createCrmCompany] error:', err);
        return { error: { status: 'CUSTOM_ERROR' as const, error: getErrorMessage(err) } };
      }
    },
    invalidatesTags: () => [{ type: 'CrmCompany', id: 'LIST' }],
  }),

  updateCrmCompany: builder.mutation<CrmCompany, { id: string; data: Partial<CrmCompany> }>({
    async queryFn({ id, data: updates }) {
      try {
        const { data, error } = await getSupabase()
          .from('crm_companies')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select('*')
          .single();

        if (error) throw error;
        if (!data) throw new Error('Update company failed');

        return { data: data as CrmCompany };
      } catch (err) {
        console.error('[crmEndpoints.updateCrmCompany] error:', err);
        return { error: { status: 'CUSTOM_ERROR' as const, error: getErrorMessage(err) } };
      }
    },
    invalidatesTags: (_result, _error, { id }) => [
      { type: 'CrmCompany', id },
      { type: 'CrmCompany', id: 'LIST' },
    ],
  }),

  deleteCrmCompany: builder.mutation<{ id: string }, string>({
    async queryFn(id) {
      try {
        const { error } = await getSupabase()
          .from('crm_companies')
          .delete()
          .eq('id', id);

        if (error) throw error;

        return { data: { id } };
      } catch (err) {
        console.error('[crmEndpoints.deleteCrmCompany] error:', err);
        return { error: { status: 'CUSTOM_ERROR' as const, error: getErrorMessage(err) } };
      }
    },
    invalidatesTags: () => [
      { type: 'CrmCompany', id: 'LIST' },
      { type: 'CrmDeal', id: 'LIST' },
    ],
  }),

  // ---------------------------------------------------------------------------
  // Contacts
  // ---------------------------------------------------------------------------

  getCrmContactsByCompany: builder.query<CrmContact[], string>({
    async queryFn(companyId) {
      try {
        const { data, error } = await getSupabase()
          .from('crm_contacts')
          .select('*')
          .eq('company_id', companyId)
          .order('last_name', { ascending: true });

        if (error) throw error;

        return { data: (data ?? []) as CrmContact[] };
      } catch (err) {
        console.error('[crmEndpoints.getCrmContactsByCompany] error:', err);
        return { error: { status: 'CUSTOM_ERROR' as const, error: getErrorMessage(err) } };
      }
    },
    providesTags: (result, _error, companyId) =>
      result
        ? [
            ...result.map(({ id }) => ({ type: 'CrmContact' as const, id })),
            { type: 'CrmContact' as const, id: `COMPANY_${companyId}` },
          ]
        : [{ type: 'CrmContact' as const, id: `COMPANY_${companyId}` }],
  }),

  createCrmContact: builder.mutation<CrmContact, Omit<CrmContact, 'id' | 'created_at' | 'updated_at' | 'company'>>({
    async queryFn(payload) {
      try {
        const { data, error } = await getSupabase()
          .from('crm_contacts')
          .insert(payload)
          .select('*')
          .single();

        if (error) throw error;
        if (!data) throw new Error('Create contact failed');

        return { data: data as CrmContact };
      } catch (err) {
        console.error('[crmEndpoints.createCrmContact] error:', err);
        return { error: { status: 'CUSTOM_ERROR' as const, error: getErrorMessage(err) } };
      }
    },
    invalidatesTags: (_result, _error, { company_id }) => [
      { type: 'CrmContact', id: `COMPANY_${company_id}` },
      { type: 'CrmCompany', id: company_id },
    ],
  }),

  updateCrmContact: builder.mutation<CrmContact, { id: string; data: Partial<CrmContact> }>({
    async queryFn({ id, data: updates }) {
      try {
        const { company, ...cleanUpdates } = updates;
        void company;

        const { data, error } = await getSupabase()
          .from('crm_contacts')
          .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select('*')
          .single();

        if (error) throw error;
        if (!data) throw new Error('Update contact failed');

        return { data: data as CrmContact };
      } catch (err) {
        console.error('[crmEndpoints.updateCrmContact] error:', err);
        return { error: { status: 'CUSTOM_ERROR' as const, error: getErrorMessage(err) } };
      }
    },
    invalidatesTags: (result) => {
      const tags: { type: 'CrmContact'; id: string }[] = [];
      if (result) {
        tags.push({ type: 'CrmContact', id: result.id });
        tags.push({ type: 'CrmContact', id: `COMPANY_${result.company_id}` });
      }
      return tags;
    },
  }),

  deleteCrmContact: builder.mutation<{ id: string }, { id: string; companyId: string }>({
    async queryFn({ id }) {
      try {
        const { error } = await getSupabase()
          .from('crm_contacts')
          .delete()
          .eq('id', id);

        if (error) throw error;

        return { data: { id } };
      } catch (err) {
        console.error('[crmEndpoints.deleteCrmContact] error:', err);
        return { error: { status: 'CUSTOM_ERROR' as const, error: getErrorMessage(err) } };
      }
    },
    invalidatesTags: (_result, _error, { companyId }) => [
      { type: 'CrmContact', id: `COMPANY_${companyId}` },
      { type: 'CrmCompany', id: companyId },
    ],
  }),

  // ---------------------------------------------------------------------------
  // Deals
  // ---------------------------------------------------------------------------

  getCrmDeals: builder.query<CrmDeal[], { stage?: CrmDealStage } | void>({
    async queryFn(args) {
      try {
        let query = getSupabase()
          .from('crm_deals')
          .select(
            `
            *,
            company:crm_companies!crm_deals_company_id_fkey(id, name),
            contact:crm_contacts!crm_deals_contact_id_fkey(id, first_name, last_name),
            deal_board:crm_deal_boards(board_id)
          `,
          )
          .order('created_at', { ascending: false });

        if (args && args.stage) {
          query = query.eq('stage', args.stage);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Fetch deal contacts separately (table may not exist yet)
        let dealContactsMap: Record<string, CrmDealContact[]> = {};
        try {
          const dealIds = (data ?? []).map((d: Record<string, unknown>) => d.id as string);
          if (dealIds.length > 0) {
            const { data: dcData } = await getSupabase()
              .from('crm_deal_contacts')
              .select('id, deal_id, contact_id, contact:crm_contacts(id, first_name, last_name, email, position)')
              .in('deal_id', dealIds);
            if (dcData) {
              for (const dc of dcData) {
                const row = dc as Record<string, unknown>;
                const dealId = row.deal_id as string;
                if (!dealContactsMap[dealId]) dealContactsMap[dealId] = [];
                dealContactsMap[dealId].push({
                  ...row,
                  contact: unwrapJoin(row.contact as Record<string, unknown> | Record<string, unknown>[] | null),
                } as unknown as CrmDealContact);
              }
            }
          }
        } catch {
          // crm_deal_contacts table may not exist yet — skip gracefully
        }

        const deals: CrmDeal[] = (data ?? []).map((row: Record<string, unknown>) => {
          const company = unwrapJoin(row.company as Record<string, unknown> | Record<string, unknown>[] | null);
          const contact = unwrapJoin(row.contact as Record<string, unknown> | Record<string, unknown>[] | null);
          const dealBoard = unwrapJoin(row.deal_board as Record<string, unknown> | Record<string, unknown>[] | null);

          return {
            ...(row as unknown as CrmDeal),
            company: company as CrmDeal['company'],
            contact: contact as CrmDeal['contact'],
            contacts: dealContactsMap[(row.id as string)] ?? [],
            board_id: (dealBoard?.board_id as string) ?? null,
            deal_board: undefined,
          };
        });

        return { data: deals };
      } catch (err) {
        console.error('[crmEndpoints.getCrmDeals] error:', err);
        return { error: { status: 'CUSTOM_ERROR' as const, error: getErrorMessage(err) } };
      }
    },
    providesTags: (result) =>
      result
        ? [
            ...result.map(({ id }) => ({ type: 'CrmDeal' as const, id })),
            { type: 'CrmDeal' as const, id: 'LIST' },
          ]
        : [{ type: 'CrmDeal' as const, id: 'LIST' }],
  }),

  getCrmDealById: builder.query<CrmDeal, string>({
    async queryFn(dealId) {
      try {
        const { data, error } = await getSupabase()
          .from('crm_deals')
          .select(
            `
            *,
            company:crm_companies!crm_deals_company_id_fkey(id, name, domain, email, phone),
            contact:crm_contacts!crm_deals_contact_id_fkey(id, first_name, last_name, email, phone, position),
            deal_board:crm_deal_boards(board_id)
          `,
          )
          .eq('id', dealId)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Deal not found');

        const row = data as Record<string, unknown>;
        const company = unwrapJoin(row.company as Record<string, unknown> | Record<string, unknown>[] | null);
        const contact = unwrapJoin(row.contact as Record<string, unknown> | Record<string, unknown>[] | null);
        const dealBoard = unwrapJoin(row.deal_board as Record<string, unknown> | Record<string, unknown>[] | null);

        // Fetch deal contacts separately (table may not exist yet)
        let contacts: CrmDealContact[] = [];
        try {
          const { data: dcData } = await getSupabase()
            .from('crm_deal_contacts')
            .select('id, deal_id, contact_id, contact:crm_contacts(id, first_name, last_name, email, phone, position)')
            .eq('deal_id', dealId);
          if (dcData) {
            contacts = dcData.map((dc) => {
              const dcRow = dc as Record<string, unknown>;
              return {
                ...dcRow,
                contact: unwrapJoin(dcRow.contact as Record<string, unknown> | Record<string, unknown>[] | null),
              } as unknown as CrmDealContact;
            });
          }
        } catch {
          // crm_deal_contacts table may not exist yet
        }

        const deal: CrmDeal = {
          ...(row as unknown as CrmDeal),
          company: company as CrmDeal['company'],
          contact: contact as CrmDeal['contact'],
          contacts,
          board_id: (dealBoard?.board_id as string) ?? null,
        };

        return { data: deal };
      } catch (err) {
        console.error('[crmEndpoints.getCrmDealById] error:', err);
        return { error: { status: 'CUSTOM_ERROR' as const, error: getErrorMessage(err) } };
      }
    },
    providesTags: (_result, _error, id) => [{ type: 'CrmDeal', id }],
  }),

  createCrmDeal: builder.mutation<CrmDeal, Omit<CrmDeal, 'id' | 'created_at' | 'updated_at' | 'company' | 'contact' | 'board_id'>>({
    async queryFn(payload) {
      try {
        const probability = STAGE_PROBABILITY[payload.stage] ?? payload.probability;

        const { data, error } = await getSupabase()
          .from('crm_deals')
          .insert({ ...payload, probability })
          .select('*')
          .single();

        if (error) throw error;
        if (!data) throw new Error('Create deal failed');

        return { data: data as CrmDeal };
      } catch (err) {
        console.error('[crmEndpoints.createCrmDeal] error:', err);
        return { error: { status: 'CUSTOM_ERROR' as const, error: getErrorMessage(err) } };
      }
    },
    invalidatesTags: () => [
      { type: 'CrmDeal', id: 'LIST' },
      { type: 'CrmCompany', id: 'LIST' },
    ],
  }),

  updateCrmDeal: builder.mutation<CrmDeal, { id: string; data: Partial<CrmDeal> }>({
    async queryFn({ id, data: updates }) {
      try {
        // Strip joined/computed fields that don't belong in the update payload
        const { company, contact, board_id, ...cleanUpdates } = updates;
        void company;
        void contact;
        void board_id;

        // Auto-update probability when stage changes
        const updatePayload: Record<string, unknown> = {
          ...cleanUpdates,
          updated_at: new Date().toISOString(),
        };

        if (cleanUpdates.stage) {
          updatePayload.probability = STAGE_PROBABILITY[cleanUpdates.stage];
        }

        const { data, error } = await getSupabase()
          .from('crm_deals')
          .update(updatePayload)
          .eq('id', id)
          .select('*')
          .single();

        if (error) throw error;
        if (!data) throw new Error('Update deal failed');

        return { data: data as CrmDeal };
      } catch (err) {
        console.error('[crmEndpoints.updateCrmDeal] error:', err);
        return { error: { status: 'CUSTOM_ERROR' as const, error: getErrorMessage(err) } };
      }
    },
    invalidatesTags: (_result, _error, { id }) => [
      { type: 'CrmDeal', id },
      { type: 'CrmDeal', id: 'LIST' },
      { type: 'CrmCompany', id: 'LIST' },
    ],
  }),

  deleteCrmDeal: builder.mutation<{ id: string }, string>({
    async queryFn(id) {
      try {
        const { error } = await getSupabase()
          .from('crm_deals')
          .delete()
          .eq('id', id);

        if (error) throw error;

        return { data: { id } };
      } catch (err) {
        console.error('[crmEndpoints.deleteCrmDeal] error:', err);
        return { error: { status: 'CUSTOM_ERROR' as const, error: getErrorMessage(err) } };
      }
    },
    invalidatesTags: () => [
      { type: 'CrmDeal', id: 'LIST' },
      { type: 'CrmCompany', id: 'LIST' },
    ],
  }),

  // ---------------------------------------------------------------------------
  // Deal Partners
  // ---------------------------------------------------------------------------

  getCrmDealPartners: builder.query<CrmDealPartner[], string>({
    async queryFn(dealId) {
      try {
        const { data, error } = await getSupabase()
          .from('crm_deal_partners')
          .select(
            `
            *,
            company:crm_companies!crm_deal_partners_company_id_fkey(id, name),
            contact:crm_contacts!crm_deal_partners_contact_id_fkey(id, first_name, last_name, email)
          `,
          )
          .eq('deal_id', dealId);

        if (error) throw error;

        const partners: CrmDealPartner[] = (data ?? []).map((row: Record<string, unknown>) => ({
          ...(row as unknown as CrmDealPartner),
          company: unwrapJoin(row.company as Record<string, unknown> | Record<string, unknown>[] | null) as CrmDealPartner['company'],
          contact: unwrapJoin(row.contact as Record<string, unknown> | Record<string, unknown>[] | null) as CrmDealPartner['contact'],
        }));

        return { data: partners };
      } catch (err) {
        console.error('[crmEndpoints.getCrmDealPartners] error:', err);
        return { error: { status: 'CUSTOM_ERROR' as const, error: getErrorMessage(err) } };
      }
    },
    providesTags: (result, _error, dealId) =>
      result
        ? [
            ...result.map(({ id }) => ({ type: 'CrmDealPartner' as const, id })),
            { type: 'CrmDealPartner' as const, id: `DEAL_${dealId}` },
          ]
        : [{ type: 'CrmDealPartner' as const, id: `DEAL_${dealId}` }],
  }),

  addCrmDealPartner: builder.mutation<CrmDealPartner, { deal_id: string; company_id: string; contact_id?: string }>({
    async queryFn(payload) {
      try {
        const { data, error } = await getSupabase()
          .from('crm_deal_partners')
          .insert(payload)
          .select('*')
          .single();

        if (error) throw error;
        if (!data) throw new Error('Add deal partner failed');

        return { data: data as CrmDealPartner };
      } catch (err) {
        console.error('[crmEndpoints.addCrmDealPartner] error:', err);
        return { error: { status: 'CUSTOM_ERROR' as const, error: getErrorMessage(err) } };
      }
    },
    invalidatesTags: (_result, _error, { deal_id }) => [
      { type: 'CrmDealPartner', id: `DEAL_${deal_id}` },
    ],
  }),

  removeCrmDealPartner: builder.mutation<{ id: string }, { id: string; dealId: string }>({
    async queryFn({ id }) {
      try {
        const { error } = await getSupabase()
          .from('crm_deal_partners')
          .delete()
          .eq('id', id);

        if (error) throw error;

        return { data: { id } };
      } catch (err) {
        console.error('[crmEndpoints.removeCrmDealPartner] error:', err);
        return { error: { status: 'CUSTOM_ERROR' as const, error: getErrorMessage(err) } };
      }
    },
    invalidatesTags: (_result, _error, { dealId }) => [
      { type: 'CrmDealPartner', id: `DEAL_${dealId}` },
    ],
  }),

  // ---------------------------------------------------------------------------
  // Activities
  // ---------------------------------------------------------------------------

  getCrmActivities: builder.query<CrmActivity[], { companyId?: string; dealId?: string }>({
    async queryFn({ companyId, dealId }) {
      try {
        let query = getSupabase()
          .from('crm_activities')
          .select(
            `
            *,
            creator:users!crm_activities_created_by_fkey(id, name, image)
          `,
          )
          .order('date', { ascending: false });

        if (companyId) {
          query = query.eq('company_id', companyId);
        }
        if (dealId) {
          query = query.eq('deal_id', dealId);
        }

        const { data, error } = await query;

        if (error) throw error;

        const activities: CrmActivity[] = (data ?? []).map((row: Record<string, unknown>) => ({
          ...(row as unknown as CrmActivity),
          creator: unwrapJoin(row.creator as Record<string, unknown> | Record<string, unknown>[] | null) as CrmActivity['creator'],
        }));

        return { data: activities };
      } catch (err) {
        console.error('[crmEndpoints.getCrmActivities] error:', err);
        return { error: { status: 'CUSTOM_ERROR' as const, error: getErrorMessage(err) } };
      }
    },
    providesTags: (result, _error, { companyId, dealId }) => {
      const tags: { type: 'CrmActivity'; id: string }[] = [];
      if (result) {
        result.forEach(({ id }) => tags.push({ type: 'CrmActivity', id }));
      }
      if (companyId) tags.push({ type: 'CrmActivity', id: `COMPANY_${companyId}` });
      if (dealId) tags.push({ type: 'CrmActivity', id: `DEAL_${dealId}` });
      return tags;
    },
  }),

  createCrmActivity: builder.mutation<CrmActivity, Omit<CrmActivity, 'id' | 'created_at' | 'creator'>>({
    async queryFn(payload) {
      try {
        const { data, error } = await getSupabase()
          .from('crm_activities')
          .insert(payload)
          .select('*')
          .single();

        if (error) throw error;
        if (!data) throw new Error('Create activity failed');

        return { data: data as CrmActivity };
      } catch (err) {
        console.error('[crmEndpoints.createCrmActivity] error:', err);
        return { error: { status: 'CUSTOM_ERROR' as const, error: getErrorMessage(err) } };
      }
    },
    invalidatesTags: (_result, _error, { company_id, deal_id }) => {
      const tags: { type: 'CrmActivity'; id: string }[] = [
        { type: 'CrmActivity', id: `COMPANY_${company_id}` },
      ];
      if (deal_id) tags.push({ type: 'CrmActivity', id: `DEAL_${deal_id}` });
      return tags;
    },
  }),

  deleteCrmActivity: builder.mutation<{ id: string }, { id: string; companyId: string; dealId?: string }>({
    async queryFn({ id }) {
      try {
        const { error } = await getSupabase()
          .from('crm_activities')
          .delete()
          .eq('id', id);

        if (error) throw error;

        return { data: { id } };
      } catch (err) {
        console.error('[crmEndpoints.deleteCrmActivity] error:', err);
        return { error: { status: 'CUSTOM_ERROR' as const, error: getErrorMessage(err) } };
      }
    },
    invalidatesTags: (_result, _error, { companyId, dealId }) => {
      const tags: { type: 'CrmActivity'; id: string }[] = [
        { type: 'CrmActivity', id: `COMPANY_${companyId}` },
      ];
      if (dealId) tags.push({ type: 'CrmActivity', id: `DEAL_${dealId}` });
      return tags;
    },
  }),

  // ---------------------------------------------------------------------------
  // Deal-Board Link
  // ---------------------------------------------------------------------------

  linkCrmDealToBoard: builder.mutation<{ deal_id: string; board_id: string }, { deal_id: string; board_id: string }>({
    async queryFn(payload) {
      try {
        // Upsert: delete existing link then insert new one
        await getSupabase()
          .from('crm_deal_boards')
          .delete()
          .eq('deal_id', payload.deal_id);

        const { data, error } = await getSupabase()
          .from('crm_deal_boards')
          .insert(payload)
          .select('*')
          .single();

        if (error) throw error;
        if (!data) throw new Error('Link deal to board failed');

        return { data: { deal_id: payload.deal_id, board_id: payload.board_id } };
      } catch (err) {
        console.error('[crmEndpoints.linkCrmDealToBoard] error:', err);
        return { error: { status: 'CUSTOM_ERROR' as const, error: getErrorMessage(err) } };
      }
    },
    invalidatesTags: (_result, _error, { deal_id }) => [
      { type: 'CrmDeal', id: deal_id },
      { type: 'CrmDeal', id: 'LIST' },
    ],
  }),

  // ---------------------------------------------------------------------------
  // Deal Contacts (many-to-many)
  // ---------------------------------------------------------------------------

  setCrmDealContacts: builder.mutation<CrmDealContact[], { dealId: string; contactIds: string[] }>({
    async queryFn({ dealId, contactIds }) {
      try {
        // Remove all existing
        await getSupabase().from('crm_deal_contacts').delete().eq('deal_id', dealId);
        // Insert new
        if (contactIds.length > 0) {
          const rows = contactIds.map((contact_id) => ({ deal_id: dealId, contact_id }));
          const { error } = await getSupabase().from('crm_deal_contacts').insert(rows);
          if (error) throw error;
        }
        const { data } = await getSupabase()
          .from('crm_deal_contacts')
          .select('id, deal_id, contact_id, contact:crm_contacts(id, first_name, last_name, email, position)')
          .eq('deal_id', dealId);
        const mapped = (data ?? []).map((dc: Record<string, unknown>) => ({
          ...dc,
          contact: unwrapJoin(dc.contact as Record<string, unknown> | Record<string, unknown>[] | null),
        }));
        return { data: mapped as CrmDealContact[] };
      } catch (err) {
        console.error('[crmEndpoints.setCrmDealContacts] error:', err);
        return { error: { status: 'CUSTOM_ERROR' as const, error: getErrorMessage(err) } };
      }
    },
    invalidatesTags: (_r, _e, { dealId }) => [
      { type: 'CrmDeal', id: dealId },
      { type: 'CrmDeal', id: 'LIST' },
    ],
  }),

  // ---------------------------------------------------------------------------
  // Exchange Rates
  // ---------------------------------------------------------------------------

  getCrmExchangeRates: builder.query<CrmExchangeRate[], void>({
    async queryFn() {
      try {
        const { data, error } = await getSupabase()
          .from('crm_exchange_rates')
          .select('*');

        if (error) throw error;

        return { data: (data ?? []) as CrmExchangeRate[] };
      } catch (err) {
        console.error('[crmEndpoints.getCrmExchangeRates] error:', err);
        return { error: { status: 'CUSTOM_ERROR' as const, error: getErrorMessage(err) } };
      }
    },
    providesTags: () => [{ type: 'CrmExchangeRate' as const, id: 'LIST' }],
  }),

  // ---------------------------------------------------------------------------
  // Deal Sources
  // ---------------------------------------------------------------------------

  getCrmDealSources: builder.query<{ id: string; name: string }[], void>({
    async queryFn() {
      try {
        const { data, error } = await getSupabase()
          .from('crm_deal_sources')
          .select('id, name')
          .order('name', { ascending: true });
        if (error) throw error;
        return { data: (data ?? []) as { id: string; name: string }[] };
      } catch (err) {
        console.error('[crmEndpoints.getCrmDealSources] error:', err);
        return { error: { status: 'CUSTOM_ERROR' as const, error: getErrorMessage(err) } };
      }
    },
    providesTags: () => [{ type: 'CrmDealSource' as const, id: 'LIST' }],
  }),

  addCrmDealSource: builder.mutation<{ id: string; name: string }, string>({
    async queryFn(name) {
      try {
        const { data, error } = await getSupabase()
          .from('crm_deal_sources')
          .upsert({ name }, { onConflict: 'name' })
          .select('id, name')
          .single();
        if (error) throw error;
        return { data: data as { id: string; name: string } };
      } catch (err) {
        console.error('[crmEndpoints.addCrmDealSource] error:', err);
        return { error: { status: 'CUSTOM_ERROR' as const, error: getErrorMessage(err) } };
      }
    },
    invalidatesTags: [{ type: 'CrmDealSource', id: 'LIST' }],
  }),
});
