ALTER TABLE wiki_pages ADD COLUMN IF NOT EXISTS board_id uuid REFERENCES boards(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_wiki_pages_board ON wiki_pages(board_id);
