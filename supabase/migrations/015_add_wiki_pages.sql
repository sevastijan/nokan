CREATE TABLE IF NOT EXISTS wiki_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Nowa strona',
  content jsonb,
  icon text,
  parent_id uuid REFERENCES wiki_pages(id) ON DELETE CASCADE,
  sort_order integer DEFAULT 0,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wiki_pages_parent ON wiki_pages(parent_id);
