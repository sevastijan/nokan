-- Deal ↔ Contact many-to-many relationship
CREATE TABLE IF NOT EXISTS crm_deal_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  UNIQUE(deal_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_deal_contacts_deal ON crm_deal_contacts(deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_deal_contacts_contact ON crm_deal_contacts(contact_id);

-- Deal source field
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS source text;

-- CRM API keys for lead ingestion
CREATE TABLE IF NOT EXISTS crm_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_api_keys_hash ON crm_api_keys(key_hash);
