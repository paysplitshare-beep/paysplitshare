-- ============================================================
--  PaySplit – Production Database Schema
--  Version: 2.0.0
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fast ILIKE search

-- ────────────────────────────────────────────────────────────
--  USERS (synced from auth.users via trigger)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name        TEXT,
  email       TEXT UNIQUE NOT NULL,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users USING gin (email gin_trgm_ops);

-- ────────────────────────────────────────────────────────────
--  EXPENSE CATEGORIES (system + user-defined)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  icon        TEXT NOT NULL,           -- emoji
  color       TEXT NOT NULL,           -- hex color
  is_system   BOOLEAN NOT NULL DEFAULT FALSE,
  created_by  UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_system_or_user CHECK (
    is_system = TRUE OR created_by IS NOT NULL
  )
);

-- Seed system categories
INSERT INTO public.expense_categories (id, name, icon, color, is_system) VALUES
  (uuid_generate_v4(), 'Food & Drink',    '🍕', '#F97316', TRUE),
  (uuid_generate_v4(), 'Transport',       '🚗', '#3B82F6', TRUE),
  (uuid_generate_v4(), 'Entertainment',   '🎬', '#8B5CF6', TRUE),
  (uuid_generate_v4(), 'Housing',         '🏠', '#06B6D4', TRUE),
  (uuid_generate_v4(), 'Shopping',        '🛒', '#EC4899', TRUE),
  (uuid_generate_v4(), 'Travel',          '✈️', '#10B981', TRUE),
  (uuid_generate_v4(), 'Health',          '💊', '#EF4444', TRUE),
  (uuid_generate_v4(), 'Education',       '🎓', '#F59E0B', TRUE),
  (uuid_generate_v4(), 'Utilities',       '📱', '#6366F1', TRUE),
  (uuid_generate_v4(), 'Gifts',           '🎁', '#14B8A6', TRUE),
  (uuid_generate_v4(), 'Sports',          '⚽', '#84CC16', TRUE),
  (uuid_generate_v4(), 'Other',           '💰', '#9CA3AF', TRUE)
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────
--  GROUPS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.groups (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  type             TEXT NOT NULL DEFAULT 'general'
                     CHECK (type IN ('general', 'trip', 'home', 'event')),
  description      TEXT,
  cover_image_url  TEXT,
  default_currency TEXT NOT NULL DEFAULT 'INR',
  invite_code      TEXT UNIQUE NOT NULL,
  invite_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
  created_by       UUID REFERENCES public.users(id) ON DELETE SET NULL,
  archived_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_groups_invite_code ON public.groups (invite_code);
CREATE INDEX IF NOT EXISTS idx_groups_created_by  ON public.groups (created_by);

-- Function: generate a unique 9-char alphanumeric invite code (A-Z, 0-9)
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- no confusable chars
  code  TEXT := '';
  i     INT;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..9 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::INT, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.groups WHERE invite_code = code);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────
--  GROUP MEMBERS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.group_members (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id  UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role      TEXT NOT NULL DEFAULT 'member'
              CHECK (role IN ('admin', 'member')),
  nickname  TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user  ON public.group_members (user_id);

-- ────────────────────────────────────────────────────────────
--  GUESTS (non-registered participants)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.guests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  email        TEXT,
  phone        TEXT,
  avatar_color TEXT DEFAULT '#6366F1',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guests_created_by ON public.guests (created_by);

-- ────────────────────────────────────────────────────────────
--  EXPENSES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expenses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id        UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  amount          NUMERIC(15, 4) NOT NULL CHECK (amount > 0),
  currency        TEXT NOT NULL DEFAULT 'INR',
  exchange_rate   NUMERIC(15, 6) NOT NULL DEFAULT 1.0, -- rate to group default_currency
  category_id     UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  paid_by         UUID REFERENCES public.users(id) ON DELETE SET NULL,
  split_method    TEXT NOT NULL DEFAULT 'equal'
                    CHECK (split_method IN ('equal', 'exact', 'percentage', 'shares')),
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  notes           TEXT,
  receipt_url     TEXT,   -- future: Supabase Storage
  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE, -- soft delete
  created_by      UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_group     ON public.expenses (group_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by   ON public.expenses (paid_by);
CREATE INDEX IF NOT EXISTS idx_expenses_category  ON public.expenses (category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_deleted   ON public.expenses (group_id) WHERE is_deleted = FALSE;

-- ────────────────────────────────────────────────────────────
--  EXPENSE SPLITS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expense_splits (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id   UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES public.users(id) ON DELETE CASCADE,
  guest_id     UUID REFERENCES public.guests(id) ON DELETE CASCADE,
  amount_owed  NUMERIC(15, 4) NOT NULL,
  percentage   NUMERIC(5, 2),    -- for percentage splits
  shares       INTEGER,           -- for shares-based splits
  settled_at   TIMESTAMPTZ,       -- when this split was settled
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_user_or_guest CHECK (
    user_id IS NOT NULL OR guest_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_expense_splits_expense ON public.expense_splits (expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_user    ON public.expense_splits (user_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_unsettled ON public.expense_splits (user_id)
  WHERE settled_at IS NULL;

-- ────────────────────────────────────────────────────────────
--  SETTLEMENTS (track who paid whom)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.settlements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id    UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  payer_id    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  payee_id    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  amount      NUMERIC(15, 4) NOT NULL CHECK (amount > 0),
  currency    TEXT NOT NULL DEFAULT 'INR',
  note        TEXT,
  settled_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settlements_group ON public.settlements (group_id);
CREATE INDEX IF NOT EXISTS idx_settlements_payer ON public.settlements (payer_id);

-- ────────────────────────────────────────────────────────────
--  FRIENDS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.friends (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  friend_id  UUID REFERENCES public.users(id) ON DELETE CASCADE,
  guest_id   UUID REFERENCES public.guests(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'active'
               CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, friend_id),
  CONSTRAINT check_friend_or_guest CHECK (
    friend_id IS NOT NULL OR guest_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_friends_user   ON public.friends (user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend ON public.friends (friend_id);

-- ────────────────────────────────────────────────────────────
--  ACTIVITY LOGS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id    UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,          -- e.g. 'group_created', 'expense_added'
  actor_id    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  target_id   UUID,                   -- flexible: expense_id, user_id, etc.
  target_type TEXT,                   -- 'expense' | 'member' | 'group' | 'settlement'
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_group ON public.activity_logs (group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor ON public.activity_logs (actor_id);

-- ────────────────────────────────────────────────────────────
--  ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs      ENABLE ROW LEVEL SECURITY;

-- ── users ──
CREATE POLICY "users_select_own"   ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own"   ON public.users FOR UPDATE USING (auth.uid() = id);
-- Allow searching other users (for friends/group invites)
CREATE POLICY "users_select_search" ON public.users FOR SELECT USING (TRUE);

-- ── expense_categories ──
CREATE POLICY "categories_select_all"       ON public.expense_categories FOR SELECT USING (TRUE);
CREATE POLICY "categories_insert_own"       ON public.expense_categories FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "categories_update_own"       ON public.expense_categories FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "categories_delete_own"       ON public.expense_categories FOR DELETE USING (auth.uid() = created_by);

-- Helper function: is user a member of a group?
CREATE OR REPLACE FUNCTION public.is_group_member(gid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = gid AND user_id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function: is user an admin of a group?
CREATE OR REPLACE FUNCTION public.is_group_admin(gid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = gid AND user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ── groups ──
CREATE POLICY "groups_select_member"  ON public.groups FOR SELECT USING (public.is_group_member(id) OR auth.uid() = created_by);
CREATE POLICY "groups_insert_auth"    ON public.groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "groups_update_admin"   ON public.groups FOR UPDATE USING (public.is_group_admin(id));
CREATE POLICY "groups_delete_admin"   ON public.groups FOR DELETE USING (public.is_group_admin(id));

-- ── group_members ──
CREATE POLICY "gm_select_member"  ON public.group_members FOR SELECT USING (public.is_group_member(group_id));
CREATE POLICY "gm_insert_member"  ON public.group_members FOR INSERT WITH CHECK (
  auth.uid() = user_id OR public.is_group_admin(group_id)
);
CREATE POLICY "gm_delete_admin"   ON public.group_members FOR DELETE USING (
  auth.uid() = user_id OR public.is_group_admin(group_id)
);
CREATE POLICY "gm_update_admin"   ON public.group_members FOR UPDATE USING (public.is_group_admin(group_id));

-- ── guests ──
CREATE POLICY "guests_select_own"  ON public.guests FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "guests_insert_own"  ON public.guests FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "guests_update_own"  ON public.guests FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "guests_delete_own"  ON public.guests FOR DELETE USING (auth.uid() = created_by);

-- ── expenses ──
CREATE POLICY "expenses_select_member" ON public.expenses FOR SELECT
  USING (public.is_group_member(group_id) AND is_deleted = FALSE);
CREATE POLICY "expenses_insert_member" ON public.expenses FOR INSERT
  WITH CHECK (public.is_group_member(group_id) AND auth.uid() = created_by);
CREATE POLICY "expenses_update_member" ON public.expenses FOR UPDATE
  USING (public.is_group_member(group_id) AND (auth.uid() = created_by OR public.is_group_admin(group_id)));
CREATE POLICY "expenses_delete_member" ON public.expenses FOR DELETE
  USING (auth.uid() = created_by OR public.is_group_admin(group_id));

-- ── expense_splits ──
CREATE POLICY "splits_select_member" ON public.expense_splits FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.expenses e
    WHERE e.id = expense_id AND public.is_group_member(e.group_id)
  ));
CREATE POLICY "splits_insert_member" ON public.expense_splits FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.expenses e
    WHERE e.id = expense_id AND public.is_group_member(e.group_id)
  ));
CREATE POLICY "splits_update_member" ON public.expense_splits FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.expenses e
    WHERE e.id = expense_id AND public.is_group_member(e.group_id)
  ));

-- ── settlements ──
CREATE POLICY "settlements_select_member" ON public.settlements FOR SELECT
  USING (public.is_group_member(group_id));
CREATE POLICY "settlements_insert_member" ON public.settlements FOR INSERT
  WITH CHECK (public.is_group_member(group_id) AND auth.uid() = payer_id);

-- ── friends ──
CREATE POLICY "friends_select_own"  ON public.friends FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "friends_insert_own"  ON public.friends FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "friends_update_own"  ON public.friends FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "friends_delete_own"  ON public.friends FOR DELETE USING (auth.uid() = user_id);

-- ── activity_logs ──
CREATE POLICY "logs_select_member" ON public.activity_logs FOR SELECT
  USING (public.is_group_member(group_id));
CREATE POLICY "logs_insert_member" ON public.activity_logs FOR INSERT
  WITH CHECK (public.is_group_member(group_id));

-- ────────────────────────────────────────────────────────────
--  TRIGGERS & FUNCTIONS
-- ────────────────────────────────────────────────────────────

-- Auto-create user profile from Google OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
