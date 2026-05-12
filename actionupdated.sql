-- =============================================
-- ENROLLIA — SCHEMA MIGRATIONS (actionupdated.sql)
-- Covers: programme→year_of_study, terms, term_items,
--         checkins term_id+items, dashboard RPC,
--         uniqueness constraint for checkins
-- Safe to run all at once. Idempotent.
-- =============================================

-- =============================================
-- 1. STUDENTS: Replace programme with year_of_study
--    (CheckinPage, TermDetailPage filter by year)
-- =============================================
ALTER TABLE students ADD COLUMN IF NOT EXISTS year_of_study text NOT NULL DEFAULT 'Year 1'
  CHECK (year_of_study IN ('Year 1', 'Year 2', 'Year 3'));

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'programme'
  ) THEN
    ALTER TABLE students DROP COLUMN programme;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_students_year ON students(year_of_study);

-- =============================================
-- 2. TERMS TABLE
--    (TermSettingsPage list/create/edit, CheckinPage term selector)
-- =============================================
CREATE TABLE IF NOT EXISTS terms (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  is_active     boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE terms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access" ON terms;
CREATE POLICY "Admin full access" ON terms
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- 3. TERM ITEMS TABLE
--    (TermSettingsPage add/delete items, CheckinPage checkbox columns,
--     TermDetailPage item chart + item filter)
-- =============================================
CREATE TABLE IF NOT EXISTS term_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id       uuid NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  item_name     text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE term_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access" ON term_items;
CREATE POLICY "Admin full access" ON term_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- 4. CHECKINS: Add term_id and items columns
--    (Term-based check-in flow, item prerequisite tracking)
-- =============================================
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS term_id uuid REFERENCES terms(id) ON DELETE SET NULL;
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS items jsonb DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_checkins_term ON checkins(term_id);

-- Enforce one checkin per student per term
-- (the app creates/updates/deletes a single record per student-term)
CREATE UNIQUE INDEX IF NOT EXISTS idx_checkins_student_term ON checkins(student_id, term_id);

-- =============================================
-- 5. DASHBOARD STATS RPC
--    (DashboardPage stat cards)
-- =============================================
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS json AS $$
DECLARE result json;
BEGIN
  SELECT json_build_object(
    'total_students',   (SELECT COUNT(*) FROM students),
    'this_month',       (SELECT COUNT(*) FROM students
                         WHERE enrolled_at >= date_trunc('month', now())),
    'checked_in_today', (SELECT COUNT(*) FROM checkins
                         WHERE checked_in_at::date = CURRENT_DATE),
    'by_year',     (SELECT json_agg(row_to_json(p)) FROM
                          (SELECT year_of_study, COUNT(*) as count
                           FROM students GROUP BY year_of_study) p)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION get_dashboard_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;
