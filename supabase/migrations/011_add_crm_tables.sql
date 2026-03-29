-- CRM Companies
CREATE TABLE IF NOT EXISTS crm_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  industry TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRM Contacts
CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES crm_companies(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRM Deals
CREATE TABLE IF NOT EXISTS crm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES crm_companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  stage TEXT NOT NULL DEFAULT 'lead' CHECK (stage IN ('lead', 'qualification', 'proposal', 'negotiation', 'won', 'lost')),
  value NUMERIC DEFAULT 0,
  value_max NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'PLN',
  probability INTEGER DEFAULT 10,
  expected_close_date DATE,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRM Deal Partners
CREATE TABLE IF NOT EXISTS crm_deal_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES crm_companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  UNIQUE(deal_id, company_id)
);

-- CRM Activities
CREATE TABLE IF NOT EXISTS crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES crm_companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'call', 'meeting', 'note')),
  subject TEXT,
  body TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRM Deal Boards (link deals to task boards)
CREATE TABLE IF NOT EXISTS crm_deal_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL UNIQUE REFERENCES crm_deals(id) ON DELETE CASCADE,
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRM Exchange Rates
CREATE TABLE IF NOT EXISTS crm_exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency TEXT NOT NULL UNIQUE,
  rate_to_pln NUMERIC NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_contacts_company_id ON crm_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_company_id ON crm_deals(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON crm_deals(stage);
CREATE INDEX IF NOT EXISTS idx_crm_activities_company_id ON crm_activities(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_deal_id ON crm_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_deal_boards_board_id ON crm_deal_boards(board_id);
