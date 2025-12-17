-- Migration: Add Board API Tokens for Public API Integration
-- Run this migration in Supabase SQL Editor

-- 1. Create board_api_tokens table
CREATE TABLE IF NOT EXISTS board_api_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,  -- SHA256 hash of the token
    token_prefix VARCHAR(16) NOT NULL,       -- First chars for identification (e.g., nkn_live_xxx)
    name VARCHAR(255),                        -- Friendly name for the token
    permissions JSONB NOT NULL DEFAULT '{"read": true, "write": false, "delete": false}'::jsonb,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,                   -- Optional expiration date
    is_active BOOLEAN DEFAULT true,
    rate_limit_per_minute INTEGER DEFAULT 60
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_board_api_tokens_hash ON board_api_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_board_api_tokens_board ON board_api_tokens(board_id);
CREATE INDEX IF NOT EXISTS idx_board_api_tokens_active ON board_api_tokens(is_active) WHERE is_active = true;

-- 3. Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_board_api_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_board_api_tokens_updated_at
    BEFORE UPDATE ON board_api_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_board_api_tokens_updated_at();

-- 4. Add RLS policies
ALTER TABLE board_api_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Board owner can manage their tokens
CREATE POLICY "Board owners can manage API tokens"
ON board_api_tokens
FOR ALL
USING (
    board_id IN (
        SELECT id FROM boards WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    board_id IN (
        SELECT id FROM boards WHERE user_id = auth.uid()
    )
);

-- 5. Add comment for documentation
COMMENT ON TABLE board_api_tokens IS 'Stores API tokens for public board integrations';
COMMENT ON COLUMN board_api_tokens.token_hash IS 'SHA256 hash of the token - never store plain text';
COMMENT ON COLUMN board_api_tokens.token_prefix IS 'First 16 chars of token for identification without exposing full token';
COMMENT ON COLUMN board_api_tokens.permissions IS 'JSON object with read, write, delete boolean permissions';
