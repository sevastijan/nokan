# CRM Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a CRM module (companies, contacts, deal pipeline, activities) to nokan-taskboard with deep board integration and multi-currency support.

**Architecture:** Separate Supabase tables (prefixed `crm_`), one RTK Query endpoint file (`crmEndpoints.ts`), pages under `/crm/*`, components under `src/app/components/CRM/`. Only OWNER role has access. Deal "won" flow proposes board creation.

**Tech Stack:** Next.js 16, Supabase (PostgreSQL), RTK Query, @dnd-kit (kanban), Tailwind CSS 4, Headless UI, Lucide icons, react-i18next, NBP API (exchange rates).

**Spec:** `docs/superpowers/specs/2026-03-29-crm-module-design.md`

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/011_add_crm_tables.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- CRM Companies
CREATE TABLE IF NOT EXISTS crm_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text,
  address text,
  phone text,
  email text,
  industry text,
  notes text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- CRM Contacts
CREATE TABLE IF NOT EXISTS crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES crm_companies(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  position text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- CRM Deals
CREATE TABLE IF NOT EXISTS crm_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company_id uuid NOT NULL REFERENCES crm_companies(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES crm_contacts(id) ON DELETE SET NULL,
  stage text NOT NULL DEFAULT 'lead' CHECK (stage IN ('lead','qualification','proposal','negotiation','won','lost')),
  value numeric DEFAULT 0,
  value_max numeric DEFAULT 0,
  currency text DEFAULT 'PLN',
  probability integer DEFAULT 10,
  expected_close_date date,
  notes text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- CRM Deal Partners
CREATE TABLE IF NOT EXISTS crm_deal_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES crm_companies(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES crm_contacts(id) ON DELETE SET NULL,
  UNIQUE(deal_id, company_id)
);

-- CRM Activities
CREATE TABLE IF NOT EXISTS crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES crm_companies(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES crm_contacts(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES crm_deals(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('email','call','meeting','note')),
  subject text,
  body text,
  date timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- CRM Deal ↔ Board link
CREATE TABLE IF NOT EXISTS crm_deal_boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL UNIQUE REFERENCES crm_deals(id) ON DELETE CASCADE,
  board_id uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- CRM Exchange Rates cache
CREATE TABLE IF NOT EXISTS crm_exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  currency text NOT NULL UNIQUE,
  rate_to_pln numeric NOT NULL,
  fetched_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_crm_contacts_company ON crm_contacts(company_id);
CREATE INDEX idx_crm_deals_company ON crm_deals(company_id);
CREATE INDEX idx_crm_deals_stage ON crm_deals(stage);
CREATE INDEX idx_crm_activities_company ON crm_activities(company_id);
CREATE INDEX idx_crm_activities_deal ON crm_activities(deal_id);
CREATE INDEX idx_crm_deal_boards_board ON crm_deal_boards(board_id);
```

- [ ] **Step 2: Run migration in Supabase**

Run this SQL in the Supabase SQL Editor for the project at `https://api.supabase.nkdlab.space`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/011_add_crm_tables.sql
git commit -m "feat(crm): add database migration for CRM tables"
```

---

### Task 2: TypeScript Types

**Files:**
- Create: `src/app/types/crmTypes.ts`

- [ ] **Step 1: Create CRM type definitions**

```typescript
export type CrmDealStage = 'lead' | 'qualification' | 'proposal' | 'negotiation' | 'won' | 'lost';
export type CrmActivityType = 'email' | 'call' | 'meeting' | 'note';
export type CrmCurrency = 'PLN' | 'EUR' | 'USD';

export interface CrmCompany {
  id: string;
  name: string;
  domain?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  industry?: string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  contact_count?: number;
  deal_count?: number;
}

export interface CrmContact {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  company?: CrmCompany | null;
}

export interface CrmDeal {
  id: string;
  title: string;
  company_id: string;
  contact_id?: string | null;
  stage: CrmDealStage;
  value: number;
  value_max: number;
  currency: CrmCurrency;
  probability: number;
  expected_close_date?: string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  company?: CrmCompany | null;
  contact?: CrmContact | null;
  board_id?: string | null;
}

export interface CrmDealPartner {
  id: string;
  deal_id: string;
  company_id: string;
  contact_id?: string | null;
  company?: CrmCompany | null;
  contact?: CrmContact | null;
}

export interface CrmActivity {
  id: string;
  company_id: string;
  contact_id?: string | null;
  deal_id?: string | null;
  type: CrmActivityType;
  subject?: string | null;
  body?: string | null;
  date: string;
  created_by?: string | null;
  created_at?: string;
  creator?: { id: string; name: string; image?: string | null } | null;
}

export interface CrmDealBoard {
  id: string;
  deal_id: string;
  board_id: string;
  created_at?: string;
}

export interface CrmExchangeRate {
  currency: string;
  rate_to_pln: number;
  fetched_at: string;
}

export interface CrmPipelineStats {
  total_value_pln: number;
  deal_count: number;
  won_count: number;
  lost_count: number;
  win_rate: number;
  by_stage: Record<CrmDealStage, { count: number; value_pln: number }>;
}

export const STAGE_PROBABILITY: Record<CrmDealStage, number> = {
  lead: 10,
  qualification: 25,
  proposal: 50,
  negotiation: 75,
  won: 100,
  lost: 0,
};

export const STAGE_ORDER: CrmDealStage[] = ['lead', 'qualification', 'proposal', 'negotiation', 'won', 'lost'];

export const STAGE_LABELS: Record<CrmDealStage, string> = {
  lead: 'Lead',
  qualification: 'Kwalifikacja',
  proposal: 'Oferta',
  negotiation: 'Negocjacje',
  won: 'Wygrana',
  lost: 'Przegrana',
};

export const STAGE_COLORS: Record<CrmDealStage, string> = {
  lead: 'bg-slate-500',
  qualification: 'bg-blue-500',
  proposal: 'bg-amber-500',
  negotiation: 'bg-purple-500',
  won: 'bg-emerald-500',
  lost: 'bg-red-500',
};
```

- [ ] **Step 2: Commit**

```bash
git add src/app/types/crmTypes.ts
git commit -m "feat(crm): add TypeScript type definitions"
```

---

### Task 3: RTK Query Endpoints — Companies & Contacts

**Files:**
- Create: `src/app/store/endpoints/crmEndpoints.ts`
- Modify: `src/app/store/apiSlice.ts`

- [ ] **Step 1: Create crmEndpoints.ts with companies & contacts**

```typescript
import { EndpointBuilder, BaseQueryFn } from '@reduxjs/toolkit/query';
import { getSupabase } from '@/app/lib/supabase';
import { CrmCompany, CrmContact, CrmDeal, CrmDealPartner, CrmActivity, CrmDealBoard, CrmExchangeRate, CrmDealStage, STAGE_PROBABILITY } from '@/app/types/crmTypes';

export const crmEndpoints = (builder: EndpointBuilder<BaseQueryFn, string, string>) => ({

  // ─── Companies ──────────────────────────────────────────
  getCrmCompanies: builder.query<CrmCompany[], void>({
    async queryFn() {
      try {
        const { data, error } = await getSupabase()
          .from('crm_companies')
          .select('*, crm_contacts(id), crm_deals(id)')
          .order('name', { ascending: true });
        if (error) throw error;
        const mapped = (data || []).map((c) => ({
          ...c,
          contact_count: Array.isArray(c.crm_contacts) ? c.crm_contacts.length : 0,
          deal_count: Array.isArray(c.crm_deals) ? c.crm_deals.length : 0,
          crm_contacts: undefined,
          crm_deals: undefined,
        }));
        return { data: mapped };
      } catch (err) {
        return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } };
      }
    },
    providesTags: (result) =>
      result
        ? [...result.map((c) => ({ type: 'CrmCompany' as const, id: c.id })), { type: 'CrmCompany', id: 'LIST' }]
        : [{ type: 'CrmCompany', id: 'LIST' }],
  }),

  getCrmCompanyById: builder.query<CrmCompany, string>({
    async queryFn(companyId) {
      try {
        const { data, error } = await getSupabase()
          .from('crm_companies')
          .select('*')
          .eq('id', companyId)
          .single();
        if (error) throw error;
        return { data };
      } catch (err) {
        return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } };
      }
    },
    providesTags: (_r, _e, id) => [{ type: 'CrmCompany', id }],
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
        return { data };
      } catch (err) {
        return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } };
      }
    },
    invalidatesTags: [{ type: 'CrmCompany', id: 'LIST' }],
  }),

  updateCrmCompany: builder.mutation<CrmCompany, { id: string; data: Partial<CrmCompany> }>({
    async queryFn({ id, data: payload }) {
      try {
        const { data, error } = await getSupabase()
          .from('crm_companies')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select('*')
          .single();
        if (error) throw error;
        return { data };
      } catch (err) {
        return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } };
      }
    },
    invalidatesTags: (_r, _e, { id }) => [{ type: 'CrmCompany', id }, { type: 'CrmCompany', id: 'LIST' }],
  }),

  deleteCrmCompany: builder.mutation<void, string>({
    async queryFn(id) {
      try {
        const { error } = await getSupabase().from('crm_companies').delete().eq('id', id);
        if (error) throw error;
        return { data: undefined };
      } catch (err) {
        return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } };
      }
    },
    invalidatesTags: [{ type: 'CrmCompany', id: 'LIST' }, { type: 'CrmDeal', id: 'LIST' }],
  }),

  // ─── Contacts ──────────────────────────────────────────
  getCrmContactsByCompany: builder.query<CrmContact[], string>({
    async queryFn(companyId) {
      try {
        const { data, error } = await getSupabase()
          .from('crm_contacts')
          .select('*')
          .eq('company_id', companyId)
          .order('last_name', { ascending: true });
        if (error) throw error;
        return { data: data || [] };
      } catch (err) {
        return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } };
      }
    },
    providesTags: (result, _e, companyId) =>
      result
        ? [...result.map((c) => ({ type: 'CrmContact' as const, id: c.id })), { type: 'CrmContact', id: companyId }]
        : [{ type: 'CrmContact', id: companyId }],
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
        return { data };
      } catch (err) {
        return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } };
      }
    },
    invalidatesTags: (_r, _e, { company_id }) => [{ type: 'CrmContact', id: company_id }, { type: 'CrmCompany', id: 'LIST' }],
  }),

  updateCrmContact: builder.mutation<CrmContact, { id: string; data: Partial<CrmContact> }>({
    async queryFn({ id, data: payload }) {
      try {
        const { data, error } = await getSupabase()
          .from('crm_contacts')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select('*')
          .single();
        if (error) throw error;
        return { data };
      } catch (err) {
        return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } };
      }
    },
    invalidatesTags: (_r, _e, { id }) => [{ type: 'CrmContact', id }],
  }),

  deleteCrmContact: builder.mutation<void, { id: string; companyId: string }>({
    async queryFn({ id }) {
      try {
        const { error } = await getSupabase().from('crm_contacts').delete().eq('id', id);
        if (error) throw error;
        return { data: undefined };
      } catch (err) {
        return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } };
      }
    },
    invalidatesTags: (_r, _e, { companyId }) => [{ type: 'CrmContact', id: companyId }, { type: 'CrmCompany', id: 'LIST' }],
  }),

  // ─── Deals ──────────────────────────────────────────
  getCrmDeals: builder.query<CrmDeal[], { stage?: CrmDealStage } | void>({
    async queryFn(args) {
      try {
        let query = getSupabase()
          .from('crm_deals')
          .select('*, company:crm_companies!crm_deals_company_id_fkey(id, name), contact:crm_contacts!crm_deals_contact_id_fkey(id, first_name, last_name), deal_board:crm_deal_boards(board_id)')
          .order('created_at', { ascending: false });
        if (args && args.stage) {
          query = query.eq('stage', args.stage);
        }
        const { data, error } = await query;
        if (error) throw error;
        const mapped = (data || []).map((d) => {
          const company = Array.isArray(d.company) ? d.company[0] : d.company;
          const contact = Array.isArray(d.contact) ? d.contact[0] : d.contact;
          const dealBoard = Array.isArray(d.deal_board) ? d.deal_board[0] : d.deal_board;
          return {
            ...d,
            company: company || null,
            contact: contact || null,
            board_id: dealBoard?.board_id || null,
            deal_board: undefined,
          };
        });
        return { data: mapped };
      } catch (err) {
        return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } };
      }
    },
    providesTags: (result) =>
      result
        ? [...result.map((d) => ({ type: 'CrmDeal' as const, id: d.id })), { type: 'CrmDeal', id: 'LIST' }]
        : [{ type: 'CrmDeal', id: 'LIST' }],
  }),

  getCrmDealById: builder.query<CrmDeal, string>({
    async queryFn(dealId) {
      try {
        const { data, error } = await getSupabase()
          .from('crm_deals')
          .select('*, company:crm_companies!crm_deals_company_id_fkey(*), contact:crm_contacts!crm_deals_contact_id_fkey(*), deal_board:crm_deal_boards(board_id)')
          .eq('id', dealId)
          .single();
        if (error) throw error;
        const company = Array.isArray(data.company) ? data.company[0] : data.company;
        const contact = Array.isArray(data.contact) ? data.contact[0] : data.contact;
        const dealBoard = Array.isArray(data.deal_board) ? data.deal_board[0] : data.deal_board;
        return {
          data: {
            ...data,
            company: company || null,
            contact: contact || null,
            board_id: dealBoard?.board_id || null,
            deal_board: undefined,
          },
        };
      } catch (err) {
        return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } };
      }
    },
    providesTags: (_r, _e, id) => [{ type: 'CrmDeal', id }],
  }),

  createCrmDeal: builder.mutation<CrmDeal, Omit<CrmDeal, 'id' | 'created_at' | 'updated_at' | 'company' | 'contact' | 'board_id'>>({
    async queryFn(payload) {
      try {
        const probability = STAGE_PROBABILITY[payload.stage] ?? 10;
        const { data, error } = await getSupabase()
          .from('crm_deals')
          .insert({ ...payload, probability })
          .select('*')
          .single();
        if (error) throw error;
        return { data };
      } catch (err) {
        return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } };
      }
    },
    invalidatesTags: [{ type: 'CrmDeal', id: 'LIST' }, { type: 'CrmCompany', id: 'LIST' }],
  }),

  updateCrmDeal: builder.mutation<CrmDeal, { id: string; data: Partial<CrmDeal> }>({
    async queryFn({ id, data: payload }) {
      try {
        const updates: Record<string, unknown> = { ...payload, updated_at: new Date().toISOString() };
        if (payload.stage) {
          updates.probability = STAGE_PROBABILITY[payload.stage] ?? updates.probability;
        }
        delete updates.company;
        delete updates.contact;
        delete updates.board_id;
        const { data, error } = await getSupabase()
          .from('crm_deals')
          .update(updates)
          .eq('id', id)
          .select('*')
          .single();
        if (error) throw error;
        return { data };
      } catch (err) {
        return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } };
      }
    },
    invalidatesTags: (_r, _e, { id }) => [{ type: 'CrmDeal', id }, { type: 'CrmDeal', id: 'LIST' }],
  }),

  deleteCrmDeal: builder.mutation<void, string>({
    async queryFn(id) {
      try {
        const { error } = await getSupabase().from('crm_deals').delete().eq('id', id);
        if (error) throw error;
        return { data: undefined };
      } catch (err) {
        return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } };
      }
    },
    invalidatesTags: [{ type: 'CrmDeal', id: 'LIST' }, { type: 'CrmCompany', id: 'LIST' }],
  }),

  // ─── Deal Partners ──────────────────────────────────────
  getCrmDealPartners: builder.query<CrmDealPartner[], string>({
    async queryFn(dealId) {
      try {
        const { data, error } = await getSupabase()
          .from('crm_deal_partners')
          .select('*, company:crm_companies!crm_deal_partners_company_id_fkey(id, name), contact:crm_contacts!crm_deal_partners_contact_id_fkey(id, first_name, last_name)')
          .eq('deal_id', dealId);
        if (error) throw error;
        const mapped = (data || []).map((p) => ({
          ...p,
          company: Array.isArray(p.company) ? p.company[0] : p.company,
          contact: Array.isArray(p.contact) ? p.contact[0] : p.contact,
        }));
        return { data: mapped };
      } catch (err) {
        return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } };
      }
    },
    providesTags: (_r, _e, dealId) => [{ type: 'CrmDealPartner', id: dealId }],
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
        return { data };
      } catch (err) {
        return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } };
      }
    },
    invalidatesTags: (_r, _e, { deal_id }) => [{ type: 'CrmDealPartner', id: deal_id }],
  }),

  removeCrmDealPartner: builder.mutation<void, { id: string; dealId: string }>({
    async queryFn({ id }) {
      try {
        const { error } = await getSupabase().from('crm_deal_partners').delete().eq('id', id);
        if (error) throw error;
        return { data: undefined };
      } catch (err) {
        return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } };
      }
    },
    invalidatesTags: (_r, _e, { dealId }) => [{ type: 'CrmDealPartner', id: dealId }],
  }),

  // ─── Activities ──────────────────────────────────────────
  getCrmActivities: builder.query<CrmActivity[], { companyId?: string; dealId?: string }>({
    async queryFn({ companyId, dealId }) {
      try {
        let query = getSupabase()
          .from('crm_activities')
          .select('*, creator:users!crm_activities_created_by_fkey(id, name, image)')
          .order('date', { ascending: false });
        if (companyId) query = query.eq('company_id', companyId);
        if (dealId) query = query.eq('deal_id', dealId);
        const { data, error } = await query;
        if (error) throw error;
        const mapped = (data || []).map((a) => ({
          ...a,
          creator: Array.isArray(a.creator) ? a.creator[0] : a.creator,
        }));
        return { data: mapped };
      } catch (err) {
        return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } };
      }
    },
    providesTags: (result, _e, { companyId, dealId }) => {
      const tags = result ? result.map((a) => ({ type: 'CrmActivity' as const, id: a.id })) : [];
      if (companyId) tags.push({ type: 'CrmActivity' as const, id: `company-${companyId}` });
      if (dealId) tags.push({ type: 'CrmActivity' as const, id: `deal-${dealId}` });
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
        return { data };
      } catch (err) {
        return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } };
      }
    },
    invalidatesTags: (_r, _e, { company_id, deal_id }) => {
      const tags: { type: 'CrmActivity'; id: string }[] = [];
      if (company_id) tags.push({ type: 'CrmActivity', id: `company-${company_id}` });
      if (deal_id) tags.push({ type: 'CrmActivity', id: `deal-${deal_id}` });
      return tags;
    },
  }),

  deleteCrmActivity: builder.mutation<void, { id: string; companyId: string; dealId?: string }>({
    async queryFn({ id }) {
      try {
        const { error } = await getSupabase().from('crm_activities').delete().eq('id', id);
        if (error) throw error;
        return { data: undefined };
      } catch (err) {
        return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } };
      }
    },
    invalidatesTags: (_r, _e, { companyId, dealId }) => {
      const tags: { type: 'CrmActivity'; id: string }[] = [{ type: 'CrmActivity', id: `company-${companyId}` }];
      if (dealId) tags.push({ type: 'CrmActivity', id: `deal-${dealId}` });
      return tags;
    },
  }),

  // ─── Deal-Board Link ──────────────────────────────────────
  linkCrmDealToBoard: builder.mutation<CrmDealBoard, { deal_id: string; board_id: string }>({
    async queryFn(payload) {
      try {
        const { data, error } = await getSupabase()
          .from('crm_deal_boards')
          .insert(payload)
          .select('*')
          .single();
        if (error) throw error;
        return { data };
      } catch (err) {
        return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } };
      }
    },
    invalidatesTags: (_r, _e, { deal_id }) => [{ type: 'CrmDeal', id: deal_id }, { type: 'CrmDeal', id: 'LIST' }],
  }),

  // ─── Exchange Rates ──────────────────────────────────────
  getCrmExchangeRates: builder.query<CrmExchangeRate[], void>({
    async queryFn() {
      try {
        const { data, error } = await getSupabase()
          .from('crm_exchange_rates')
          .select('*');
        if (error) throw error;
        return { data: data || [] };
      } catch (err) {
        return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } };
      }
    },
    providesTags: ['CrmExchangeRate'],
  }),
});
```

- [ ] **Step 2: Register CRM endpoints and tag types in apiSlice.ts**

Add import at top of `src/app/store/apiSlice.ts`:
```typescript
import { crmEndpoints } from './endpoints/crmEndpoints';
```

Add to `tagTypes` array:
```typescript
'CrmCompany',
'CrmContact',
'CrmDeal',
'CrmDealPartner',
'CrmActivity',
'CrmExchangeRate',
```

Add to `endpoints` spread:
```typescript
...crmEndpoints(builder),
```

Add hook exports:
```typescript
// CRM hooks
useGetCrmCompaniesQuery,
useGetCrmCompanyByIdQuery,
useCreateCrmCompanyMutation,
useUpdateCrmCompanyMutation,
useDeleteCrmCompanyMutation,
useGetCrmContactsByCompanyQuery,
useCreateCrmContactMutation,
useUpdateCrmContactMutation,
useDeleteCrmContactMutation,
useGetCrmDealsQuery,
useGetCrmDealByIdQuery,
useCreateCrmDealMutation,
useUpdateCrmDealMutation,
useDeleteCrmDealMutation,
useGetCrmDealPartnersQuery,
useAddCrmDealPartnerMutation,
useRemoveCrmDealPartnerMutation,
useGetCrmActivitiesQuery,
useCreateCrmActivityMutation,
useDeleteCrmActivityMutation,
useLinkCrmDealToBoardMutation,
useGetCrmExchangeRatesQuery,
```

- [ ] **Step 3: Commit**

```bash
git add src/app/store/endpoints/crmEndpoints.ts src/app/store/apiSlice.ts
git commit -m "feat(crm): add RTK Query endpoints for all CRM entities"
```

---

### Task 4: Exchange Rate API Route

**Files:**
- Create: `src/app/api/crm/exchange-rates/route.ts`

- [ ] **Step 1: Create the API route**

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SERVICE_ROLE_KEY!,
  );
}

const CURRENCIES = ['EUR', 'USD'];
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

async function fetchNbpRate(currency: string): Promise<number> {
  const res = await fetch(`https://api.nbp.pl/api/exchangerates/rates/a/${currency}/?format=json`);
  if (!res.ok) throw new Error(`NBP API error for ${currency}: ${res.status}`);
  const data = await res.json();
  return data.rates[0].mid;
}

export async function GET() {
  try {
    const supabase = getServiceSupabase();

    const { data: cached } = await supabase.from('crm_exchange_rates').select('*');
    const now = Date.now();
    const needsRefresh = !cached || cached.length === 0 ||
      cached.some((r) => now - new Date(r.fetched_at).getTime() > CACHE_DURATION_MS);

    if (needsRefresh) {
      for (const currency of CURRENCIES) {
        try {
          const rate = await fetchNbpRate(currency);
          await supabase
            .from('crm_exchange_rates')
            .upsert({ currency, rate_to_pln: rate, fetched_at: new Date().toISOString() }, { onConflict: 'currency' });
        } catch (err) {
          console.error(`Failed to fetch rate for ${currency}:`, err);
        }
      }
      const { data: updated } = await supabase.from('crm_exchange_rates').select('*');
      return NextResponse.json(updated || []);
    }

    return NextResponse.json(cached);
  } catch (error) {
    console.error('Exchange rate error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/crm/exchange-rates/route.ts
git commit -m "feat(crm): add NBP exchange rate API with 24h cache"
```

---

### Task 5: i18n — CRM Translations

**Files:**
- Modify: `src/app/i18n/locales/pl.json`
- Modify: `src/app/i18n/locales/en.json`

- [ ] **Step 1: Add CRM keys to Polish locale**

Add a `"crm"` section to `pl.json`:

```json
"crm": {
  "title": "CRM",
  "dashboard": "Dashboard",
  "pipeline": "Pipeline",
  "companies": "Firmy",
  "company": "Firma",
  "contacts": "Kontakty",
  "contact": "Kontakt",
  "deals": "Deale",
  "deal": "Deal",
  "activities": "Aktywności",
  "activity": "Aktywność",
  "newCompany": "Nowa firma",
  "newContact": "Nowy kontakt",
  "newDeal": "Nowy deal",
  "newActivity": "Nowa aktywność",
  "editCompany": "Edytuj firmę",
  "editContact": "Edytuj kontakt",
  "editDeal": "Edytuj deal",
  "companyName": "Nazwa firmy",
  "domain": "Domena",
  "address": "Adres",
  "phone": "Telefon",
  "email": "Email",
  "industry": "Branża",
  "notes": "Notatki",
  "firstName": "Imię",
  "lastName": "Nazwisko",
  "position": "Stanowisko",
  "dealTitle": "Nazwa deala",
  "stage": "Etap",
  "value": "Wartość",
  "valueMax": "Wartość max",
  "currency": "Waluta",
  "probability": "Prawdopodobieństwo",
  "expectedCloseDate": "Planowana data zamknięcia",
  "activityType": "Typ",
  "subject": "Temat",
  "body": "Treść",
  "date": "Data",
  "stages": {
    "lead": "Lead",
    "qualification": "Kwalifikacja",
    "proposal": "Oferta",
    "negotiation": "Negocjacje",
    "won": "Wygrana",
    "lost": "Przegrana"
  },
  "activityTypes": {
    "email": "Email",
    "call": "Rozmowa",
    "meeting": "Spotkanie",
    "note": "Notatka"
  },
  "stats": {
    "pipelineValue": "Wartość pipeline",
    "winRate": "Win rate",
    "totalDeals": "Wszystkie deale",
    "wonDeals": "Wygrane",
    "lostDeals": "Przegrane"
  },
  "dealWon": {
    "title": "Deal wygrany!",
    "createBoard": "Chcesz utworzyć board dla tego klienta?",
    "selectTemplate": "Wybierz szablon",
    "create": "Utwórz board",
    "skip": "Pomiń"
  },
  "partners": "Partnerzy",
  "addPartner": "Dodaj partnera",
  "linkedBoard": "Powiązany board",
  "noActivities": "Brak aktywności",
  "noDeals": "Brak dealów",
  "noContacts": "Brak kontaktów",
  "confirmDelete": "Czy na pewno chcesz usunąć?",
  "saved": "Zapisano",
  "deleted": "Usunięto",
  "search": "Szukaj..."
}
```

- [ ] **Step 2: Add CRM keys to English locale**

Add equivalent `"crm"` section to `en.json` with English translations.

- [ ] **Step 3: Commit**

```bash
git add src/app/i18n/locales/pl.json src/app/i18n/locales/en.json
git commit -m "feat(crm): add i18n translations for CRM module"
```

---

### Task 6: Navbar — CRM Link for OWNER

**Files:**
- Modify: `src/app/components/Navbar.tsx`

- [ ] **Step 1: Add CRM nav item**

In `Navbar.tsx`, import `Briefcase` from lucide-react. In the `nav` array (around line 210), add after the management access items:

```typescript
const nav = [
  { href: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
  { href: '/calendar', label: t('nav.calendar'), icon: Calendar },
  { href: '/submissions', label: t('nav.submissions'), icon: FileText },
  ...(hasManagementAccess()
    ? [
        { href: '/users', label: t('nav.users'), icon: UserCog },
        { href: '/team-management', label: t('nav.teams'), icon: Users },
      ]
    : []),
  ...(userRole === 'OWNER'
    ? [{ href: '/crm', label: 'CRM', icon: Briefcase }]
    : []),
];
```

- [ ] **Step 2: Commit**

```bash
git add src/app/components/Navbar.tsx
git commit -m "feat(crm): add CRM link in navbar for OWNER role"
```

---

### Task 7: CRM Pages — Company List & Company Detail

**Files:**
- Create: `src/app/crm/page.tsx` (redirects to pipeline)
- Create: `src/app/crm/companies/page.tsx`
- Create: `src/app/crm/companies/[id]/page.tsx`
- Create: `src/app/components/CRM/CompanyList.tsx`
- Create: `src/app/components/CRM/CompanyDetail.tsx`
- Create: `src/app/components/CRM/CompanyForm.tsx`
- Create: `src/app/components/CRM/ContactForm.tsx`
- Create: `src/app/components/CRM/CrmLayout.tsx`

- [ ] **Step 1: Create CrmLayout — shared sub-navigation**

`src/app/components/CRM/CrmLayout.tsx` — a wrapper component with CRM sub-nav tabs (Dashboard, Pipeline, Firmy). Uses `usePathname()` to highlight active tab. Checks `useGetUserRoleQuery` and redirects non-OWNER to `/dashboard`.

- [ ] **Step 2: Create CRM root page (redirect)**

`src/app/crm/page.tsx`:
```typescript
'use client';
import { redirect } from 'next/navigation';
export default function CrmPage() {
  redirect('/crm/pipeline');
}
```

- [ ] **Step 3: Create CompanyList component**

`src/app/components/CRM/CompanyList.tsx` — uses `useGetCrmCompaniesQuery()`. Table view with columns: name, domain, industry, contacts count, deals count. Search input filters by name. "Nowa firma" button opens CompanyForm modal. Click row → navigate to `/crm/companies/[id]`.

Style: match existing app aesthetic (slate-800/900 backgrounds, slate-700 borders, brand-500 accents). Use `motion.div` for row animations like existing components.

- [ ] **Step 4: Create CompanyForm modal**

`src/app/components/CRM/CompanyForm.tsx` — modal (Headless UI Dialog) for create/edit company. Fields: name (required), domain, address, phone, email, industry, notes. Uses `useCreateCrmCompanyMutation` or `useUpdateCrmCompanyMutation`. Shows toast on success.

- [ ] **Step 5: Create ContactForm modal**

`src/app/components/CRM/ContactForm.tsx` — modal for create/edit contact. Fields: first_name, last_name (required), email, phone, position, notes. Takes `companyId` as prop. Uses `useCreateCrmContactMutation` or `useUpdateCrmContactMutation`.

- [ ] **Step 6: Create CompanyDetail component**

`src/app/components/CRM/CompanyDetail.tsx` — detail view with company header (name, domain, industry, edit button). Three tabs: Kontakty (list contacts with add/edit/delete), Deale (list deals linked to this company), Aktywności (activity log for this company). Uses `useGetCrmCompanyByIdQuery`, `useGetCrmContactsByCompanyQuery`, `useGetCrmActivitiesQuery`.

- [ ] **Step 7: Wire up pages**

`src/app/crm/companies/page.tsx`:
```typescript
'use client';
import CrmLayout from '@/app/components/CRM/CrmLayout';
import CompanyList from '@/app/components/CRM/CompanyList';

export default function CrmCompaniesPage() {
  return (
    <CrmLayout>
      <CompanyList />
    </CrmLayout>
  );
}
```

`src/app/crm/companies/[id]/page.tsx`:
```typescript
'use client';
import { useParams } from 'next/navigation';
import CrmLayout from '@/app/components/CRM/CrmLayout';
import CompanyDetail from '@/app/components/CRM/CompanyDetail';

export default function CrmCompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <CrmLayout>
      <CompanyDetail companyId={id} />
    </CrmLayout>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add src/app/crm/ src/app/components/CRM/
git commit -m "feat(crm): add company list, detail, and contact management"
```

---

### Task 8: Pipeline Kanban Board

**Files:**
- Create: `src/app/crm/pipeline/page.tsx`
- Create: `src/app/components/CRM/PipelineBoard.tsx`
- Create: `src/app/components/CRM/DealCard.tsx`
- Create: `src/app/components/CRM/DealForm.tsx`
- Create: `src/app/components/CRM/DealWonModal.tsx`

- [ ] **Step 1: Create DealCard component**

`src/app/components/CRM/DealCard.tsx` — compact card showing: deal title, company name, value + currency, expected close date, probability badge. Color-coded left border by stage. Click → navigate to `/crm/deals/[id]`.

- [ ] **Step 2: Create DealForm modal**

`src/app/components/CRM/DealForm.tsx` — create/edit deal modal. Fields: title, company (searchable select from `useGetCrmCompaniesQuery`), contact (filtered by selected company), stage (dropdown), value, value_max, currency (PLN/EUR/USD), expected_close_date, notes. Uses `useCreateCrmDealMutation` / `useUpdateCrmDealMutation`.

- [ ] **Step 3: Create DealWonModal**

`src/app/components/CRM/DealWonModal.tsx` — triggered when deal stage changes to 'won'. Shows company name, deal title. Option to create board from template (uses `DEFAULT_TEMPLATES` from globalTypes, plus `useCreateBoardFromTemplateMutation`). On board creation, calls `useLinkCrmDealToBoardMutation`. "Pomiń" closes modal without action.

- [ ] **Step 4: Create PipelineBoard component**

`src/app/components/CRM/PipelineBoard.tsx` — 6-column kanban using `@dnd-kit/core` and `@dnd-kit/sortable`. Each column = one stage. Uses `useGetCrmDealsQuery()` to fetch all deals, groups by stage. Drag-and-drop calls `useUpdateCrmDealMutation` to change stage. When dropped on 'won' column → opens DealWonModal. Header shows "Nowy deal" button. Each column header shows count and total value.

Reference existing drag-and-drop patterns from `src/app/components/Column.tsx` for @dnd-kit setup.

- [ ] **Step 5: Wire up pipeline page**

`src/app/crm/pipeline/page.tsx`:
```typescript
'use client';
import CrmLayout from '@/app/components/CRM/CrmLayout';
import PipelineBoard from '@/app/components/CRM/PipelineBoard';

export default function CrmPipelinePage() {
  return (
    <CrmLayout>
      <PipelineBoard />
    </CrmLayout>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/crm/pipeline/ src/app/components/CRM/PipelineBoard.tsx src/app/components/CRM/DealCard.tsx src/app/components/CRM/DealForm.tsx src/app/components/CRM/DealWonModal.tsx
git commit -m "feat(crm): add pipeline kanban with drag-and-drop and deal won flow"
```

---

### Task 9: Deal Detail Page

**Files:**
- Create: `src/app/crm/deals/[id]/page.tsx`
- Create: `src/app/components/CRM/DealDetail.tsx`
- Create: `src/app/components/CRM/ActivityLog.tsx`
- Create: `src/app/components/CRM/ActivityForm.tsx`

- [ ] **Step 1: Create ActivityForm modal**

`src/app/components/CRM/ActivityForm.tsx` — modal for adding activity. Fields: type (select: email/call/meeting/note), subject, body (textarea), date (defaults to now). Takes `companyId`, optional `dealId` and `contactId` as props. Uses `useCreateCrmActivityMutation`.

- [ ] **Step 2: Create ActivityLog component**

`src/app/components/CRM/ActivityLog.tsx` — list of activities with type icon (Mail, Phone, Users, StickyNote from lucide), subject, body preview, date, creator avatar+name. Filter by type. Delete button. "Nowa aktywność" button opens ActivityForm.

- [ ] **Step 3: Create DealDetail component**

`src/app/components/CRM/DealDetail.tsx` — header with deal title, stage badge (colored), value, currency, probability, expected close date, edit button (opens DealForm). Sections: company info card (click to go to company), contact info, partners list (add/remove via `useAddCrmDealPartnerMutation`), linked board (link to `/board/[id]` if exists), activity log (ActivityLog component scoped to this deal). Stage change dropdown that triggers DealWonModal when changing to 'won'.

- [ ] **Step 4: Wire up deal detail page**

`src/app/crm/deals/[id]/page.tsx`:
```typescript
'use client';
import { useParams } from 'next/navigation';
import CrmLayout from '@/app/components/CRM/CrmLayout';
import DealDetail from '@/app/components/CRM/DealDetail';

export default function CrmDealDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <CrmLayout>
      <DealDetail dealId={id} />
    </CrmLayout>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/crm/deals/ src/app/components/CRM/DealDetail.tsx src/app/components/CRM/ActivityLog.tsx src/app/components/CRM/ActivityForm.tsx
git commit -m "feat(crm): add deal detail page with activities and partner management"
```

---

### Task 10: CRM Dashboard with Stats & Exchange Rates

**Files:**
- Create: `src/app/crm/dashboard/page.tsx`
- Create: `src/app/components/CRM/CrmDashboard.tsx`
- Create: `src/app/components/CRM/CrmStats.tsx`

- [ ] **Step 1: Create CrmStats component**

`src/app/components/CRM/CrmStats.tsx` — takes deals array and exchange rates. Calculates:
- Total pipeline value in PLN (converts EUR/USD using rates)
- Deal count per stage
- Win rate (won / (won + lost) * 100)
- Displays as stat cards (like existing DashboardStats pattern)

Conversion logic:
```typescript
function convertToPln(value: number, currency: string, rates: CrmExchangeRate[]): number {
  if (currency === 'PLN') return value;
  const rate = rates.find((r) => r.currency === currency);
  return rate ? value * rate.rate_to_pln : value;
}
```

- [ ] **Step 2: Create CrmDashboard component**

`src/app/components/CRM/CrmDashboard.tsx` — uses `useGetCrmDealsQuery()`, `useGetCrmExchangeRatesQuery()`, `useGetCrmCompaniesQuery()`. Fetches exchange rates from API on mount. Shows: CrmStats at top, recent activities list (last 10), quick links to pipeline and companies. Also triggers `/api/crm/exchange-rates` fetch to refresh cache.

- [ ] **Step 3: Wire up dashboard page and update CRM root redirect**

`src/app/crm/dashboard/page.tsx`:
```typescript
'use client';
import CrmLayout from '@/app/components/CRM/CrmLayout';
import CrmDashboard from '@/app/components/CRM/CrmDashboard';

export default function CrmDashboardPage() {
  return (
    <CrmLayout>
      <CrmDashboard />
    </CrmLayout>
  );
}
```

Update `src/app/crm/page.tsx` to redirect to `/crm/dashboard` instead of `/crm/pipeline`.

- [ ] **Step 4: Commit**

```bash
git add src/app/crm/dashboard/ src/app/components/CRM/CrmDashboard.tsx src/app/components/CRM/CrmStats.tsx src/app/crm/page.tsx
git commit -m "feat(crm): add CRM dashboard with pipeline stats and exchange rate conversion"
```

---

### Task 11: Final Integration & TypeScript Check

**Files:**
- Various (all CRM files)

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Fix any type errors found.

- [ ] **Step 2: Test all CRM pages manually**

Navigate through: `/crm` → `/crm/dashboard` → `/crm/pipeline` → `/crm/companies` → create company → add contact → create deal → drag to won → create board → check link.

- [ ] **Step 3: Verify OWNER-only access**

Log in as non-OWNER user and verify: CRM link not in navbar, direct URL `/crm/*` redirects to dashboard.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(crm): final integration fixes and polish"
```
