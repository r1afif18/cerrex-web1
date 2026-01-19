-- CERREX Wizard Database Schema
-- Run this in Supabase SQL Editor
-- Phase 1: Foundation tables for wizard functionality

-- ============================================
-- 1. WIZARD SESSION TRACKING
-- ============================================

-- Tracks wizard progress per project
CREATE TABLE IF NOT EXISTS wizard_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  current_step INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'in_progress', -- in_progress, completed, abandoned
  step_0_completed BOOLEAN DEFAULT FALSE,
  step_1_completed BOOLEAN DEFAULT FALSE,
  step_2_completed BOOLEAN DEFAULT FALSE,
  step_3_completed BOOLEAN DEFAULT FALSE,
  step_4_completed BOOLEAN DEFAULT FALSE,
  step_5_completed BOOLEAN DEFAULT FALSE,
  step_6_completed BOOLEAN DEFAULT FALSE,
  step_7_completed BOOLEAN DEFAULT FALSE,
  step_8_completed BOOLEAN DEFAULT FALSE,
  step_9_completed BOOLEAN DEFAULT FALSE,
  last_saved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. PROJECT CONTEXT (Step 0 Data)
-- ============================================

-- Extended project context for wizard Step 0
CREATE TABLE IF NOT EXISTS project_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  facility_type VARCHAR(20) NOT NULL DEFAULT 'RESEARCH', -- POWER, RESEARCH, FUEL_CYCLE, OTHER
  facility_name VARCHAR(255),
  facility_location VARCHAR(255),
  decom_start_date DATE,
  strategy VARCHAR(20) NOT NULL DEFAULT 'IMMEDIATE', -- IMMEDIATE, DEFERRED, ENTOMBMENT
  deferral_years INTEGER DEFAULT 0,
  working_hours_per_month INTEGER DEFAULT 160,
  overhead_rate DECIMAL(5,2) DEFAULT 15.00,
  -- Additional context fields
  owner_organization VARCHAR(255),
  regulatory_body VARCHAR(255),
  license_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. ISDC SELECTION (Step 1 Data)
-- ============================================

-- Stores which ISDC items are selected for a project
CREATE TABLE IF NOT EXISTS project_isdc_selection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  isdc_code VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_contractor BOOLEAN DEFAULT FALSE,
  contingency_percent DECIMAL(5,2) DEFAULT 10.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, isdc_code)
);

-- ============================================
-- 4. WASTE PARTITION (Step 3 Data)
-- ============================================

-- Stores waste partition settings
CREATE TABLE IF NOT EXISTS waste_partitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  mode VARCHAR(10) NOT NULL DEFAULT 'MANUAL', -- AUTO or MANUAL
  ilw_percent DECIMAL(5,2) DEFAULT 5.00,
  llw_percent DECIMAL(5,2) DEFAULT 15.00,
  vllw_percent DECIMAL(5,2) DEFAULT 30.00,
  ew_percent DECIMAL(5,2) DEFAULT 20.00,
  non_rad_percent DECIMAL(5,2) DEFAULT 30.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. PROJECT PHASES (Step 5 Data)
-- ============================================

-- Stores project phases for period costs
CREATE TABLE IF NOT EXISTS project_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  duration_months INTEGER DEFAULT 12,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, phase_number)
);

-- Staff allocation per phase
CREATE TABLE IF NOT EXISTS phase_staff_allocation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID REFERENCES project_phases(id) ON DELETE CASCADE,
  profession_code VARCHAR(10) NOT NULL,
  staff_count INTEGER DEFAULT 0,
  is_contractor BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fixed costs per phase
CREATE TABLE IF NOT EXISTS phase_fixed_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID REFERENCES project_phases(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  amount DECIMAL(15,2) DEFAULT 0,
  frequency VARCHAR(20) DEFAULT 'ONCE', -- ONCE, YEARLY, MONTHLY
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. CALCULATION RESULTS (Step 7 Cache)
-- ============================================

-- Cached calculation results
CREATE TABLE IF NOT EXISTS calculation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  total_labour DECIMAL(20,2) DEFAULT 0,
  total_investment DECIMAL(20,2) DEFAULT 0,
  total_expenses DECIMAL(20,2) DEFAULT 0,
  total_contingency DECIMAL(20,2) DEFAULT 0,
  total_cost DECIMAL(20,2) DEFAULT 0,
  total_manpower DECIMAL(15,2) DEFAULT 0,
  total_waste_tonnes DECIMAL(15,4) DEFAULT 0,
  result_json JSONB,
  isdc_l1_breakdown JSONB,
  isdc_l2_breakdown JSONB,
  isdc_l3_breakdown JSONB
);

-- ============================================
-- 7. CASHFLOW (Step 8 Data)
-- ============================================

-- Cashflow settings
CREATE TABLE IF NOT EXISTS cashflow_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  inflation_rate DECIMAL(5,4) DEFAULT 0.025,
  discount_rate DECIMAL(5,4) DEFAULT 0.03,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. SENSITIVITY ANALYSIS (Step 9 Data)
-- ============================================

-- Sensitivity analysis results
CREATE TABLE IF NOT EXISTS sensitivity_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  scenario_name VARCHAR(100),
  factor_multiplier DECIMAL(5,2), -- 0.5, 0.75, 1.0, 1.25, 1.5
  deferral_years INTEGER DEFAULT 0,
  total_cost DECIMAL(20,2),
  npv DECIMAL(20,2),
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE wizard_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_isdc_selection ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_partitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_staff_allocation ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_fixed_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashflow_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensitivity_results ENABLE ROW LEVEL SECURITY;

-- Create helper function if not exists
CREATE OR REPLACE FUNCTION user_owns_project(p_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM projects WHERE id = p_project_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
CREATE POLICY "Users can manage wizard_sessions" ON wizard_sessions
  FOR ALL USING (user_owns_project(project_id));

CREATE POLICY "Users can manage project_context" ON project_context
  FOR ALL USING (user_owns_project(project_id));

CREATE POLICY "Users can manage project_isdc_selection" ON project_isdc_selection
  FOR ALL USING (user_owns_project(project_id));

CREATE POLICY "Users can manage waste_partitions" ON waste_partitions
  FOR ALL USING (user_owns_project(project_id));

CREATE POLICY "Users can manage project_phases" ON project_phases
  FOR ALL USING (user_owns_project(project_id));

CREATE POLICY "Users can manage phase_staff_allocation" ON phase_staff_allocation
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM project_phases pp 
      WHERE pp.id = phase_id AND user_owns_project(pp.project_id)
    )
  );

CREATE POLICY "Users can manage phase_fixed_costs" ON phase_fixed_costs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM project_phases pp 
      WHERE pp.id = phase_id AND user_owns_project(pp.project_id)
    )
  );

CREATE POLICY "Users can manage calculation_results" ON calculation_results
  FOR ALL USING (user_owns_project(project_id));

CREATE POLICY "Users can manage cashflow_settings" ON cashflow_settings
  FOR ALL USING (user_owns_project(project_id));

CREATE POLICY "Users can manage sensitivity_results" ON sensitivity_results
  FOR ALL USING (user_owns_project(project_id));

-- ============================================
-- 10. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_wizard_sessions_project ON wizard_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_context_project ON project_context(project_id);
CREATE INDEX IF NOT EXISTS idx_project_isdc_selection_project ON project_isdc_selection(project_id);
CREATE INDEX IF NOT EXISTS idx_project_isdc_selection_code ON project_isdc_selection(isdc_code);
CREATE INDEX IF NOT EXISTS idx_waste_partitions_project ON waste_partitions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_phases_project ON project_phases(project_id);
CREATE INDEX IF NOT EXISTS idx_calculation_results_project ON calculation_results(project_id);
CREATE INDEX IF NOT EXISTS idx_sensitivity_results_project ON sensitivity_results(project_id);

-- ============================================
-- END OF WIZARD SCHEMA
-- ============================================
