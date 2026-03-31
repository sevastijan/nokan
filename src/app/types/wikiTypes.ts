export interface WikiPage {
  id: string;
  title: string;
  content?: unknown;
  icon?: string | null;
  parent_id?: string | null;
  sort_order: number;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
  children?: WikiPage[];
}
