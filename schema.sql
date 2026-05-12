-- =============================================
-- ENROLLIA — FULL DATABASE SCHEMA
-- Run this FIRST in Supabase SQL Editor
-- Then run seed.sql
-- =============================================

-- === ADMINS TABLE (authorization whitelist) ===
-- This table does NOT store passwords.
-- Passwords are handled by Supabase Auth (bcrypt hashed).
-- This table only lists which auth users are authorized
-- to access the admin portal.
CREATE TABLE IF NOT EXISTS admins (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL UNIQUE,
  full_name  text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- SECURITY: Each admin can ONLY read their own record
-- using auth.email() which returns the current user's email
-- from the JWT (set by Supabase Auth after login).
CREATE POLICY "Admin can read own record" ON admins
  FOR SELECT TO authenticated
  USING (auth.email() = email);

-- Only existing admins can insert new admins (via service_role or dashboard)
CREATE POLICY "Only service_role can insert" ON admins
  FOR INSERT TO authenticated
  WITH CHECK (false);

-- === STUDENTS TABLE ===
CREATE TABLE IF NOT EXISTS students (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     text NOT NULL,
  student_id    text NOT NULL UNIQUE,
  email         text NOT NULL,
  phone         text,
  year_of_study text NOT NULL DEFAULT 'Year 1'
                CHECK (year_of_study IN ('Year 1', 'Year 2', 'Year 3')),
  status        text NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'inactive', 'suspended')),
  photo_url     text,
  notes         text,
  enrolled_at   timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_students_name ON students
  USING gin(to_tsvector('english', full_name));
CREATE INDEX IF NOT EXISTS idx_students_sid  ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_year ON students(year_of_study);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access" ON students
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- === TERMS TABLE ===
CREATE TABLE IF NOT EXISTS terms (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  is_active     boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access" ON terms
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- === TERM ITEMS TABLE ===
CREATE TABLE IF NOT EXISTS term_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id       uuid NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  item_name     text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE term_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access" ON term_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- === CHECKINS TABLE ===
CREATE TABLE IF NOT EXISTS checkins (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  checked_in_at  timestamptz NOT NULL DEFAULT now(),
  session_label  text NOT NULL DEFAULT 'General'
                 CHECK (session_label IN
                   ('Morning Exam', 'Afternoon Exam', 'Evening Exam', 'General')),
  term_id        uuid REFERENCES terms(id) ON DELETE SET NULL,
  items          jsonb DEFAULT '[]'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkins_date    ON checkins(checked_in_at);
CREATE INDEX IF NOT EXISTS idx_checkins_student ON checkins(student_id);
CREATE INDEX IF NOT EXISTS idx_checkins_session ON checkins(session_label);
CREATE INDEX IF NOT EXISTS idx_checkins_term    ON checkins(term_id);

ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access" ON checkins
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- === STORAGE BUCKET ===
-- Run this separately if you want photo uploads:
-- select storage.create_bucket('student-photos', { public: true });

-- === DASHBOARD STATS RPC ===
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

-- REVOKE EXECUTE FROM PUBLIC to restrict RPC access
REVOKE EXECUTE ON FUNCTION get_dashboard_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;
