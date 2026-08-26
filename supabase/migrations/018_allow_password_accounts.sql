-- Password-based accounts (and invitees who join before ever using an OAuth
-- provider) have no Google ID, but users.google_id was created NOT NULL.
-- That constraint makes /api/auth/register and the invitation-accept fallback
-- in /api/invitations/[token]/accept fail with:
--   null value in column "google_id" of relation "users" violates not-null constraint
ALTER TABLE users ALTER COLUMN google_id DROP NOT NULL;

-- Already present in the deployed database; declared here so a fresh install
-- gets the column the credentials provider reads.
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
