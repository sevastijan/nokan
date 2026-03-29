// ---------------------------------------------------------------------------
// CRM Type Definitions
// ---------------------------------------------------------------------------

// Type aliases
export type CrmDealStage =
  | 'lead'
  | 'qualification'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost';

export type CrmActivityType = 'email' | 'call' | 'meeting' | 'note';

export type CrmCurrency = 'PLN' | 'EUR' | 'USD';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

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
  created_at?: string | null;
  updated_at?: string | null;
  contact_count?: number | null;
  deal_count?: number | null;
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
  created_at?: string | null;
  updated_at?: string | null;
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
  created_at?: string | null;
  updated_at?: string | null;
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
  created_at?: string | null;
  creator?: { id: string; name: string; image?: string | null } | null;
}

export interface CrmDealBoard {
  id: string;
  deal_id: string;
  board_id: string;
  created_at?: string | null;
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const STAGE_PROBABILITY: Record<CrmDealStage, number> = {
  lead: 10,
  qualification: 25,
  proposal: 50,
  negotiation: 75,
  won: 100,
  lost: 0,
};

export const STAGE_ORDER: CrmDealStage[] = [
  'lead',
  'qualification',
  'proposal',
  'negotiation',
  'won',
  'lost',
];

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
