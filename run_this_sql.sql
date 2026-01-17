-- ============================================
-- COMBINED SCHEMA UPDATE FOR CERREX WEB
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- ============================================
-- PART 1: RNV (Radionuclide Vectors) Tables
-- ============================================

-- RNV Definitions (types of nuclide mixtures)
CREATE TABLE IF NOT EXISTS rnv_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL,
    description TEXT NOT NULL,
    total_fraction DECIMAL(10,6) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, code)
);

-- RNV Fractions (matrix of nuclide fractions per RNV type)
CREATE TABLE IF NOT EXISTS rnv_fractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rnv_id UUID NOT NULL REFERENCES rnv_definitions(id) ON DELETE CASCADE,
    radionuclide_id UUID NOT NULL REFERENCES radionuclides(id) ON DELETE CASCADE,
    fraction DECIMAL(10,6) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(rnv_id, radionuclide_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rnv_definitions_project ON rnv_definitions(project_id);
CREATE INDEX IF NOT EXISTS idx_rnv_fractions_rnv ON rnv_fractions(rnv_id);

-- Enable RLS
ALTER TABLE rnv_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rnv_fractions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop if exists first to avoid conflicts)
DROP POLICY IF EXISTS "Users can manage own RNV definitions" ON rnv_definitions;
CREATE POLICY "Users can manage own RNV definitions" ON rnv_definitions
    FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage own RNV fractions" ON rnv_fractions;
CREATE POLICY "Users can manage own RNV fractions" ON rnv_fractions
    FOR ALL USING (rnv_id IN (SELECT id FROM rnv_definitions WHERE project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())));

-- ============================================
-- PART 2: Inventory Updates
-- ============================================

-- Add missing columns to inventory_items
ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS dd_primary VARCHAR(10),
ADD COLUMN IF NOT EXISTS item_no INTEGER,
ADD COLUMN IF NOT EXISTS reference INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS material_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS rnv_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS specific_activity_bq_g DECIMAL(20,6) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_activity_bq DECIMAL(20,6) DEFAULT 0,
ADD COLUMN IF NOT EXISTS mass_kg DECIMAL(15,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================
-- PART 3: ADIN - Activity Distribution Matrix
-- ============================================

CREATE TABLE IF NOT EXISTS inventory_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    radionuclide_id UUID NOT NULL REFERENCES radionuclides(id) ON DELETE CASCADE,
    activity_bq_g DECIMAL(20,6) DEFAULT 0,
    activity_total_bq DECIMAL(20,6) DEFAULT 0,
    fraction DECIMAL(10,6) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(inventory_item_id, radionuclide_id)
);

ALTER TABLE inventory_activities ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_inventory_activities_item ON inventory_activities(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_activities_nuclide ON inventory_activities(radionuclide_id);

DROP POLICY IF EXISTS "Users can manage inventory_activities" ON inventory_activities;
CREATE POLICY "Users can manage inventory_activities" ON inventory_activities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM inventory_items i 
            WHERE i.id = inventory_item_id 
            AND EXISTS (SELECT 1 FROM projects p WHERE p.id = i.project_id AND p.user_id = auth.uid())
        )
    );

-- ============================================
-- PART 4: Waste Classification Results
-- ============================================

CREATE TABLE IF NOT EXISTS waste_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    calculated_class VARCHAR(10),
    limiting_nuclide VARCHAR(20),
    limiting_ratio DECIMAL(15,6),
    ilw_sum DECIMAL(15,6) DEFAULT 0,
    llw_sum DECIMAL(15,6) DEFAULT 0,
    vllw_sum DECIMAL(15,6) DEFAULT 0,
    ew_sum DECIMAL(15,6) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(inventory_item_id)
);

ALTER TABLE waste_classifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage waste_classifications" ON waste_classifications;
CREATE POLICY "Users can manage waste_classifications" ON waste_classifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM inventory_items i 
            WHERE i.id = inventory_item_id 
            AND EXISTS (SELECT 1 FROM projects p WHERE p.id = i.project_id AND p.user_id = auth.uid())
        )
    );

-- ============================================
-- PART 5: ADIN - Equipment Activity Items
-- ============================================

CREATE TABLE IF NOT EXISTS adin_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    -- Cols 1-7: Location/ID
    building VARCHAR(20),
    floor VARCHAR(20),
    room_no VARCHAR(50),
    equipment_id VARCHAR(50) NOT NULL,
    equipment_name TEXT,
    isdc_no VARCHAR(20),
    tech_system VARCHAR(50),
    -- Cols 8-12: Dimensions
    mass_t DECIMAL(15,4) DEFAULT 0,
    inner_surface_m2 DECIMAL(15,4) DEFAULT 0,
    outer_surface_m2 DECIMAL(15,4) DEFAULT 0,
    bulk_volume_m3 DECIMAL(15,4) DEFAULT 0,
    inner_volume_m3 DECIMAL(15,4) DEFAULT 0,
    -- Cols 13-16: Classification
    cerrex_category VARCHAR(20),
    dominant_material VARCHAR(50),
    haz_mat_code VARCHAR(20),
    haz_waste_code VARCHAR(20),
    -- Cols 17-19: Original contamination
    orig_inner_cont_bq_m2 DECIMAL(20,6) DEFAULT 0,
    orig_outer_cont_bq_m2 DECIMAL(20,6) DEFAULT 0,
    orig_spec_act_bq_kg DECIMAL(20,6) DEFAULT 0,
    -- Cols 20-28: Current contamination with RNV
    inner_cont_bq_m2 DECIMAL(20,6) DEFAULT 0,
    inner_cont_rnv VARCHAR(20),
    refdate_inner DATE,
    outer_cont_bq_m2 DECIMAL(20,6) DEFAULT 0,
    outer_cont_rnv VARCHAR(20),
    refdate_outer DATE,
    spec_act_bq_kg DECIMAL(20,6) DEFAULT 0,
    spec_act_rnv VARCHAR(20),
    refdate_specact DATE,
    -- Cols 29-31: Dose rate
    equiv_dose_rate_usv_h DECIMAL(15,4) DEFAULT 0,
    rnv_dr VARCHAR(20),
    refdate_dr DATE,
    -- Cols 32-36: Waste quantities
    nraw_t DECIMAL(15,4) DEFAULT 0,
    ew_t DECIMAL(15,4) DEFAULT 0,
    vllw_t DECIMAL(15,4) DEFAULT 0,
    llw_t DECIMAL(15,4) DEFAULT 0,
    ilw_t DECIMAL(15,4) DEFAULT 0,
    -- Col 37: Activity calculation
    activity_calc_date DECIMAL(25,6) DEFAULT 0,
    ref_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, equipment_id)
);

ALTER TABLE adin_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_adin_items_project ON adin_items(project_id);

DROP POLICY IF EXISTS "Users can manage adin_items" ON adin_items;
CREATE POLICY "Users can manage adin_items" ON adin_items
    FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- ============================================
-- PART 6: ADIN - Nuclide Activities per Equipment
-- ============================================

CREATE TABLE IF NOT EXISTS adin_nuclide_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adin_item_id UUID NOT NULL REFERENCES adin_items(id) ON DELETE CASCADE,
    nuclide_symbol VARCHAR(20) NOT NULL,
    activity_bq DECIMAL(25,6) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(adin_item_id, nuclide_symbol)
);

ALTER TABLE adin_nuclide_activities ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_adin_nuclide_item ON adin_nuclide_activities(adin_item_id);

DROP POLICY IF EXISTS "Users can manage adin_nuclide_activities" ON adin_nuclide_activities;
CREATE POLICY "Users can manage adin_nuclide_activities" ON adin_nuclide_activities
    FOR ALL USING (
        adin_item_id IN (SELECT id FROM adin_items WHERE project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()))
    );

-- ============================================
-- Done! All tables created successfully.
-- ============================================
