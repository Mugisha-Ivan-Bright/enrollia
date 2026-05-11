-- =============================================
-- ENROLLIA — SEED DATA
-- Run this in Supabase SQL Editor AFTER creating
-- the tables (run the full schema SQL first)
-- =============================================

-- === SECURITY ARCHITECTURE ===
-- Passwords are NEVER stored in plaintext.
-- Authentication is handled ENTIRELY by Supabase Auth
-- (bcrypt hashing, built-in).
-- The `admins` table is JUST a whitelist of which
-- auth user emails are authorized to access the admin portal.
-- To create an admin, use Supabase Dashboard:
--   Authentication > Users > Add User
-- This creates the auth record with hashed password.
-- Then insert their email into the admins table below.

-- === STEP 1: Create auth user in Supabase Dashboard ===
-- Go to Authentication > Users > Add User
-- Email: info@refine.dev
-- Password: refine-supabase
-- (password is automatically bcrypt-hashed by Supabase)

-- === STEP 2: Seed admin whitelist entry ===
INSERT INTO admins (email, full_name) VALUES
  ('info@refine.dev', 'Admin Enrollia')
ON CONFLICT (email) DO NOTHING;

-- === STEP 3: Seed demo students ===
INSERT INTO students (id, full_name, student_id, email, phone, year_of_study, status, enrolled_at) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Alice Johnson',   'RCA2024001', 'alice@rca.edu',   '+1-555-0101', 'Year 1', 'active',   '2026-01-15'),
  ('a0000000-0000-0000-0000-000000000002', 'Bob Smith',       'RCA2024002', 'bob@rca.edu',     '+1-555-0102', 'Year 2', 'active',   '2026-01-20'),
  ('a0000000-0000-0000-0000-000000000003', 'Carol Williams',  'RCA2024003', 'carol@rca.edu',   '+1-555-0103', 'Year 1', 'active',   '2026-02-01'),
  ('a0000000-0000-0000-0000-000000000004', 'David Brown',     'RCA2024004', 'david@rca.edu',   '+1-555-0104', 'Year 3', 'active',   '2026-02-10'),
  ('a0000000-0000-0000-0000-000000000005', 'Eve Davis',       'RCA2024005', 'eve@rca.edu',     '+1-555-0105', 'Year 2', 'active',   '2026-02-15'),
  ('a0000000-0000-0000-0000-000000000006', 'Frank Miller',    'RCA2024006', 'frank@rca.edu',   '+1-555-0106', 'Year 1', 'inactive', '2026-03-01'),
  ('a0000000-0000-0000-0000-000000000007', 'Grace Wilson',    'RCA2024007', 'grace@rca.edu',   '+1-555-0107', 'Year 2', 'active',   '2026-03-05'),
  ('a0000000-0000-0000-0000-000000000008', 'Henry Moore',     'RCA2024008', 'henry@rca.edu',   '+1-555-0108', 'Year 3', 'suspended','2026-03-10'),
  ('a0000000-0000-0000-0000-000000000009', 'Ivy Taylor',      'RCA2024009', 'ivy@rca.edu',     '+1-555-0109', 'Year 1', 'active', '2026-03-15'),
  ('a0000000-0000-0000-0000-000000000010', 'Jack Anderson',   'RCA2024010', 'jack@rca.edu',    '+1-555-0110', 'Year 2', 'active',   '2026-04-01'),
  ('a0000000-0000-0000-0000-000000000011', 'Karen Thomas',    'RCA2024011', 'karen@rca.edu',   '+1-555-0111', 'Year 3', 'active',   '2026-04-05'),
  ('a0000000-0000-0000-0000-000000000012', 'Leo Jackson',     'RCA2024012', 'leo@rca.edu',     '+1-555-0112', 'Year 1', 'inactive', '2026-04-10'),
  ('a0000000-0000-0000-0000-000000000013', 'Mia White',       'RCA2024013', 'mia@rca.edu',     '+1-555-0113', 'Year 2', 'active',   '2026-04-15'),
  ('a0000000-0000-0000-0000-000000000014', 'Noah Harris',     'RCA2024014', 'noah@rca.edu',    '+1-555-0114', 'Year 3', 'active',   '2026-04-20'),
  ('a0000000-0000-0000-0000-000000000015', 'Olivia Martin',   'RCA2024015', 'olivia@rca.edu',  '+1-555-0115', 'Year 2', 'active',   '2026-05-01');

-- === STEP 4: Seed demo check-ins ===
INSERT INTO checkins (student_id, checked_in_at, session_label) VALUES
  ('a0000000-0000-0000-0000-000000000001', CURRENT_TIMESTAMP - INTERVAL '2 hours',  'Morning Exam'),
  ('a0000000-0000-0000-0000-000000000003', CURRENT_TIMESTAMP - INTERVAL '1 hour',   'Morning Exam'),
  ('a0000000-0000-0000-0000-000000000005', CURRENT_TIMESTAMP - INTERVAL '30 minutes', 'General'),
  ('a0000000-0000-0000-0000-000000000007', CURRENT_TIMESTAMP - INTERVAL '15 minutes', 'Afternoon Exam'),
  ('a0000000-0000-0000-0000-000000000001', '2026-05-05 09:00:00', 'Morning Exam'),
  ('a0000000-0000-0000-0000-000000000001', '2026-05-04 09:15:00', 'Morning Exam'),
  ('a0000000-0000-0000-0000-000000000002', '2026-05-05 10:00:00', 'Morning Exam'),
  ('a0000000-0000-0000-0000-000000000003', '2026-05-04 14:00:00', 'Afternoon Exam'),
  ('a0000000-0000-0000-0000-000000000004', '2026-05-03 09:30:00', 'Morning Exam'),
  ('a0000000-0000-0000-0000-000000000005', '2026-05-03 16:00:00', 'Evening Exam'),
  ('a0000000-0000-0000-0000-000000000009', '2026-05-02 09:00:00', 'Morning Exam'),
  ('a0000000-0000-0000-0000-000000000011', '2026-05-02 14:30:00', 'Afternoon Exam'),
  ('a0000000-0000-0000-0000-000000000013', '2026-05-01 09:00:00', 'Morning Exam'),
  ('a0000000-0000-0000-0000-000000000015', '2026-05-01 10:00:00', 'General');
