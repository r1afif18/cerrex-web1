-- RESTORE CRUD FUNCTIONALITY FOR PASSCODE-ONLY FLOW
-- Run this in your Supabase SQL Editor if you are using the passcode gate only.
-- This disables RLS for all project-related tables to allow access without a Supabase User session.

-- 1. Disable RLS for all relevant tables
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE currencies DISABLE ROW LEVEL SECURITY;
ALTER TABLE dd_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE waste_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE professions DISABLE ROW LEVEL SECURITY;
ALTER TABLE buildings DISABLE ROW LEVEL SECURITY;
ALTER TABLE floors DISABLE ROW LEVEL SECURITY;
ALTER TABLE tech_systems DISABLE ROW LEVEL SECURITY;
ALTER TABLE materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE radionuclides DISABLE ROW LEVEL SECURITY;
ALTER TABLE radionuclide_vectors DISABLE ROW LEVEL SECURITY;
ALTER TABLE isdc_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_dd_quantities DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE cashflow_years DISABLE ROW LEVEL SECURITY;
ALTER TABLE rnv_definitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE rnv_fractions DISABLE ROW LEVEL SECURITY;

-- 2. Ensure user_id in projects is nullable or just ignore it in code
-- (The schema already allows null user_id if we don't pass it, 
-- but we'll modify the code to not require it).

-- 3. (Optional) If you want to keep RLS but allow anonymous access:
/*
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Public can view projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Public can insert projects" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update projects" ON projects FOR UPDATE USING (true);
CREATE POLICY "Public can delete projects" ON projects FOR DELETE USING (true);
-- ... repeat for all tables
*/
