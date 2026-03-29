# CRM Module Design — Nokan Taskboard

**Date**: 2026-03-29
**Status**: Approved
**Scope**: Companies & Contacts, Pipeline/Deals, Activities (manual)

## Overview

CRM module integrated into nokan-taskboard as a separate feature area with deep integration to existing boards. Accessible only to OWNER role. Migrates core functionality from nkdlab (Express+SQLite) to Next.js+Supabase stack.

## Key Decisions

- **Access**: OWNER role only
- **Integration depth**: Deep — deal "won" proposes board creation with template selection
- **Activities**: Manual on launch (notes, calls, meetings, email logs). Gmail sync deferred.
- **Pipeline view**: Kanban drag-and-drop (6 stages)
- **Currency**: Multi-currency (PLN/EUR/USD) with auto-conversion to PLN via NBP API
- **Architecture**: Separate CRM tables (prefixed `crm_`), separate RTK Query endpoints, shared layout/navbar

## Database Schema (Supabase/PostgreSQL)

### crm_companies

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| name | text | NOT NULL |
| domain | text | |
| address | text | |
| phone | text | |
| email | text | |
| industry | text | |
| notes | text | |
| created_by | uuid | FK → users(id) |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

### crm_contacts

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| company_id | uuid | FK → crm_companies(id) ON DELETE CASCADE |
| first_name | text | NOT NULL |
| last_name | text | NOT NULL |
| email | text | |
| phone | text | |
| position | text | |
| notes | text | |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

### crm_deals

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| title | text | NOT NULL |
| company_id | uuid | FK → crm_companies(id) ON DELETE CASCADE |
| contact_id | uuid | FK → crm_contacts(id) ON DELETE SET NULL |
| stage | text | NOT NULL DEFAULT 'lead', CHECK IN (lead, qualification, proposal, negotiation, won, lost) |
| value | numeric | DEFAULT 0 |
| value_max | numeric | DEFAULT 0 |
| currency | text | DEFAULT 'PLN' |
| probability | integer | DEFAULT 0 |
| expected_close_date | date | |
| notes | text | |
| created_by | uuid | FK → users(id) |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

Probability auto-set per stage: lead=10, qualification=25, proposal=50, negotiation=75, won=100, lost=0.

### crm_deal_partners

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| deal_id | uuid | FK → crm_deals(id) ON DELETE CASCADE |
| company_id | uuid | FK → crm_companies(id) ON DELETE CASCADE |
| contact_id | uuid | FK → crm_contacts(id) ON DELETE SET NULL |
| | | UNIQUE(deal_id, company_id) |

### crm_activities

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| company_id | uuid | FK → crm_companies(id) ON DELETE CASCADE |
| contact_id | uuid | FK → crm_contacts(id) ON DELETE SET NULL |
| deal_id | uuid | FK → crm_deals(id) ON DELETE SET NULL |
| type | text | NOT NULL, CHECK IN (email, call, meeting, note) |
| subject | text | |
| body | text | |
| date | timestamptz | DEFAULT now() |
| created_by | uuid | FK → users(id) |
| created_at | timestamptz | DEFAULT now() |

### crm_deal_boards

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| deal_id | uuid | FK → crm_deals(id) ON DELETE CASCADE, UNIQUE |
| board_id | uuid | FK → boards(id) ON DELETE CASCADE |
| created_at | timestamptz | DEFAULT now() |

### crm_exchange_rates

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| currency | text | NOT NULL, UNIQUE |
| rate_to_pln | numeric | NOT NULL |
| fetched_at | timestamptz | DEFAULT now() |

## Frontend Architecture

### Routing

```
/crm                    → Dashboard (pipeline stats, recent activities)
/crm/pipeline           → Kanban pipeline (drag-and-drop deal stages)
/crm/companies          → Company list (search, filter by industry)
/crm/companies/[id]     → Company detail (tabs: contacts, deals, activities)
/crm/deals/[id]         → Deal detail (activities, linked board, partners)
```

### Navigation

New "CRM" link in Navbar sidebar, visible only for OWNER role. Sub-links: Dashboard, Pipeline, Firmy.

### Component Structure

```
src/app/crm/
├── page.tsx                     # CRM Dashboard
├── pipeline/page.tsx            # Kanban pipeline
├── companies/page.tsx           # Company list
├── companies/[id]/page.tsx      # Company detail
├── deals/[id]/page.tsx          # Deal detail

src/app/components/CRM/
├── PipelineBoard.tsx            # Kanban with 6 columns (uses @dnd-kit)
├── DealCard.tsx                 # Deal card in pipeline column
├── CompanyList.tsx              # Company table with search/filter
├── CompanyDetail.tsx            # Company view with tabs
├── DealDetail.tsx               # Deal view with activities + linked board
├── ContactForm.tsx              # Add/edit contact modal
├── CompanyForm.tsx              # Add/edit company modal
├── DealForm.tsx                 # Add/edit deal modal
├── ActivityLog.tsx              # Activity list with type filters
├── ActivityForm.tsx             # Add activity modal
├── DealWonModal.tsx             # "Create board?" modal with template selection
├── CrmStats.tsx                 # Pipeline value, win rate, stage breakdown
└── ExchangeRateService.ts       # NBP API fetch + cache
```

### RTK Query Endpoints

New file: `src/app/store/endpoints/crmEndpoints.ts`

Endpoints:
- Companies: getAll, getById, create, update, delete
- Contacts: getByCompany, create, update, delete
- Deals: getAll, getById, create, update, delete, updateStage, getStats
- Activities: getByCompany, getByDeal, create, delete
- Deal Partners: add, remove
- Deal Boards: link, getByDeal
- Exchange Rates: get (with auto-refresh)

All hooks exported from `apiSlice.ts`.

### API Routes

```
/api/crm/exchange-rates    # GET — fetch & cache NBP rates
```

All other CRM operations go through RTK Query → Supabase directly (no API routes needed).

## Key Flows

### Creating a Deal
1. User clicks "Nowy deal" → DealForm modal
2. Select/create company, contact, set stage, value, currency
3. Probability auto-assigned based on stage
4. Save → appears on pipeline kanban

### Deal Moves to "Won"
1. Drag deal to "won" column (or change stage in detail view)
2. DealWonModal opens: "Chcesz utworzyć board dla [company name]?"
3. User selects board template from DEFAULT_TEMPLATES
4. Board created + saved in crm_deal_boards
5. User can go to new board or stay on pipeline

### Adding Activities
1. From company or deal detail → "Dodaj aktywność"
2. Select type: note/call/meeting/email
3. Fill subject + body + date
4. Saved with links to company + optionally deal + contact

### Exchange Rate Conversion
1. API route `/api/crm/exchange-rates` fetches from NBP API (https://api.nbp.pl/api/exchangerates/rates/a/{currency}/)
2. Cached in crm_exchange_rates, refreshed if older than 24h
3. Pipeline stats always show total value converted to PLN
4. Individual deal cards show original currency

## Board Integration

- When deal = won and user creates board → `crm_deal_boards` links them
- `DealDetail` shows link to associated board
- `BoardHeader` can optionally show company/deal badge if board is linked
- Board deletion does NOT delete the deal (ON DELETE CASCADE on board side only removes the link)

## Access Control

- All CRM pages check user role === 'OWNER' before rendering
- Supabase RLS policies on all crm_* tables: only users with OWNER role can SELECT/INSERT/UPDATE/DELETE
- Navbar CRM link hidden for non-OWNER users

## Future Extensions (not in scope)

- Gmail sync (OAuth2 + automatic activity creation)
- Company enrichment (Apollo API)
- Web scraping / research module
- Email sending from CRM (via Resend)
- Reminders / todos linked to deals
