-- CERREX Web Database Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. CORE TABLES
-- ============================================

-- Projects (main entity)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  reference_currency VARCHAR(10) DEFAULT 'USD',
  national_currency VARCHAR(10) DEFAULT 'EUR',
  reference_labour_rate DECIMAL(10,2) DEFAULT 50,
  reference_year INTEGER DEFAULT 2017,
  original_year INTEGER DEFAULT 1997,
  total_bdf DECIMAL(10,6) DEFAULT 1.0,
  inflation_rate DECIMAL(5,4) DEFAULT 0.02,
  working_hours_per_year INTEGER DEFAULT 1800,
  contingency_enabled BOOLEAN DEFAULT true,
  currency_in_thousands BOOLEAN DEFAULT false,
  wdf_global_multiplier DECIMAL(5,2) DEFAULT 1.5,
  expenses_pct_contractor DECIMAL(5,2) DEFAULT 15,
  expenses_pct_owner DECIMAL(5,2) DEFAULT 12,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. MASTER DATA TABLES (Lists Sheet)
-- ============================================

-- Currencies
CREATE TABLE currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  index_no INTEGER,
  abbreviation VARCHAR(10) NOT NULL,
  name VARCHAR(100),
  exchange_rate DECIMAL(10,6) DEFAULT 1.0,
  total_bdf DECIMAL(10,6) DEFAULT 1.0,
  bdf_factors JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- D&D Categories (51 categories)
CREATE TABLE dd_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(20) DEFAULT '[t]',
  abbreviation VARCHAR(10),
  category_type VARCHAR(50),
  manpower_uf DECIMAL(10,4) DEFAULT 0,
  investment_uf DECIMAL(10,4) DEFAULT 0,
  expenses_uf DECIMAL(10,4) DEFAULT 0,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Waste Categories (WM1-WM26)
CREATE TABLE waste_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(100),
  isdc_code_primary VARCHAR(20),
  isdc_code_secondary VARCHAR(20),
  manpower_uf DECIMAL(10,4) DEFAULT 0,
  investment_uf DECIMAL(10,4) DEFAULT 0,
  expenses_uf DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Professions
CREATE TABLE professions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  index_no INTEGER,
  name VARCHAR(100) NOT NULL,
  abbreviation VARCHAR(10),
  hourly_rate_owner DECIMAL(10,2) DEFAULT 50,
  hourly_rate_contractor DECIMAL(10,2) DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. FACILITY STRUCTURE (BLD, SMHW)
-- ============================================

-- Buildings
CREATE TABLE buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Floors
CREATE TABLE floors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
  elevation VARCHAR(20),
  description VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Technological Systems
CREATE TABLE tech_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materials
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  name VARCHAR(255),
  density_kg_m3 DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. RADIONUCLIDES (RND Sheet)
-- ============================================

CREATE TABLE radionuclides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  half_life_years DECIMAL(20,6),
  ew_limit_bq_g DECIMAL(15,6),
  vllw_limit_bq_g DECIMAL(15,6),
  llw_limit_bq_g DECIMAL(15,6),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Radionuclide Vectors
CREATE TABLE radionuclide_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL,
  description TEXT,
  nuclide_fractions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. ISDC STRUCTURE
-- ============================================

CREATE TABLE isdc_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(255),
  parent_code VARCHAR(20),
  is_activated BOOLEAN DEFAULT false,
  contingency_rate DECIMAL(5,2) DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. INVENTORY (INV, ADIN Sheets)
-- ============================================

CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  item_id VARCHAR(50),
  description VARCHAR(500),
  inventory_type VARCHAR(10) DEFAULT 'INV',
  isdc_l3_code VARCHAR(20),
  building_code VARCHAR(10),
  floor_code VARCHAR(20),
  tech_system_code VARCHAR(10),
  is_activated BOOLEAN DEFAULT true,
  quantity DECIMAL(15,4) DEFAULT 0,
  unit VARCHAR(20) DEFAULT '[t]',
  basic_workforce DECIMAL(15,4) DEFAULT 0,
  wdf_f1 DECIMAL(5,2) DEFAULT 0,
  wdf_f2 DECIMAL(5,2) DEFAULT 0,
  wdf_f3 DECIMAL(5,2) DEFAULT 0,
  wdf_f4 DECIMAL(5,2) DEFAULT 0,
  wdf_f5 DECIMAL(5,2) DEFAULT 0,
  wdf_f6 DECIMAL(5,2) DEFAULT 0,
  wdf_f7 DECIMAL(5,2) DEFAULT 0,
  is_contractor BOOLEAN DEFAULT false,
  contingency_rate DECIMAL(5,2) DEFAULT 10,
  waste_ilw DECIMAL(5,2) DEFAULT 0,
  waste_llw DECIMAL(5,2) DEFAULT 0,
  waste_vllw DECIMAL(5,2) DEFAULT 0,
  waste_ew DECIMAL(5,2) DEFAULT 0,
  waste_nraw DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory D&D Quantities
CREATE TABLE inventory_dd_quantities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  dd_category_code VARCHAR(10),
  quantity DECIMAL(15,4) DEFAULT 0
);

-- ============================================
-- 7. SCHEDULE & CASHFLOW
-- ============================================

CREATE TABLE schedule_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  isdc_l2_code VARCHAR(20),
  description VARCHAR(255),
  phase VARCHAR(20),
  start_year INTEGER,
  duration_calc DECIMAL(10,2),
  duration_user DECIMAL(10,2),
  working_groups INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cashflow_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  year INTEGER,
  inflation_rate DECIMAL(5,4),
  ref_year_cost DECIMAL(15,2) DEFAULT 0,
  nominal_cost DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE dd_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE professions ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE tech_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE radionuclides ENABLE ROW LEVEL SECURITY;
ALTER TABLE radionuclide_vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE isdc_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_dd_quantities ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashflow_years ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policy helper function
CREATE OR REPLACE FUNCTION user_owns_project(p_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM projects 
    WHERE id = p_project_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply RLS to child tables (example for currencies)
CREATE POLICY "Users can manage currencies" ON currencies
  FOR ALL USING (user_owns_project(project_id));

CREATE POLICY "Users can manage dd_categories" ON dd_categories
  FOR ALL USING (user_owns_project(project_id));

CREATE POLICY "Users can manage waste_categories" ON waste_categories
  FOR ALL USING (user_owns_project(project_id));

CREATE POLICY "Users can manage professions" ON professions
  FOR ALL USING (user_owns_project(project_id));

CREATE POLICY "Users can manage buildings" ON buildings
  FOR ALL USING (user_owns_project(project_id));

CREATE POLICY "Users can manage tech_systems" ON tech_systems
  FOR ALL USING (user_owns_project(project_id));

CREATE POLICY "Users can manage materials" ON materials
  FOR ALL USING (user_owns_project(project_id));

CREATE POLICY "Users can manage radionuclides" ON radionuclides
  FOR ALL USING (user_owns_project(project_id));

CREATE POLICY "Users can manage radionuclide_vectors" ON radionuclide_vectors
  FOR ALL USING (user_owns_project(project_id));

CREATE POLICY "Users can manage isdc_codes" ON isdc_codes
  FOR ALL USING (user_owns_project(project_id));

CREATE POLICY "Users can manage inventory_items" ON inventory_items
  FOR ALL USING (user_owns_project(project_id));

CREATE POLICY "Users can manage schedule_activities" ON schedule_activities
  FOR ALL USING (user_owns_project(project_id));

CREATE POLICY "Users can manage cashflow_years" ON cashflow_years
  FOR ALL USING (user_owns_project(project_id));

-- Floors need to check through buildings
CREATE POLICY "Users can manage floors" ON floors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM buildings b 
      WHERE b.id = building_id AND user_owns_project(b.project_id)
    )
  );

-- Inventory DD quantities check through inventory_items
CREATE POLICY "Users can manage inventory_dd_quantities" ON inventory_dd_quantities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM inventory_items i 
      WHERE i.id = inventory_item_id AND user_owns_project(i.project_id)
    )
  );

-- ============================================
-- 9. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_currencies_project_id ON currencies(project_id);
CREATE INDEX idx_dd_categories_project_id ON dd_categories(project_id);
CREATE INDEX idx_inventory_items_project_id ON inventory_items(project_id);
CREATE INDEX idx_inventory_items_isdc ON inventory_items(isdc_l3_code);
CREATE INDEX idx_isdc_codes_project_level ON isdc_codes(project_id, level);
