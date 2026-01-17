-- Inventory System Updates for INV and ADIN Sheets
-- Run this SQL in Supabase Dashboard → SQL Editor

-- ============================================
-- 1. Update inventory_items table
-- Add missing columns: material_code, rnv_code
-- ============================================

ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS material_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS rnv_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS specific_activity_bq_g DECIMAL(20,6) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_activity_bq DECIMAL(20,6) DEFAULT 0,
ADD COLUMN IF NOT EXISTS mass_kg DECIMAL(15,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================
-- 2. ADIN - Activity Distribution Matrix
-- Rows = Inventory items, Columns = Radionuclides
-- ============================================

CREATE TABLE IF NOT EXISTS inventory_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    radionuclide_id UUID NOT NULL REFERENCES radionuclides(id) ON DELETE CASCADE,
    activity_bq_g DECIMAL(20,6) DEFAULT 0, -- Specific activity per gram
    activity_total_bq DECIMAL(20,6) DEFAULT 0, -- Total activity = activity_bq_g * mass
    fraction DECIMAL(10,6) DEFAULT 0, -- Fraction of total (for RNV calculation)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(inventory_item_id, radionuclide_id)
);

-- Enable RLS
ALTER TABLE inventory_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policy for inventory_activities
CREATE POLICY "Users can manage inventory_activities" ON inventory_activities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM inventory_items i 
            WHERE i.id = inventory_item_id 
            AND EXISTS (SELECT 1 FROM projects p WHERE p.id = i.project_id AND p.user_id = auth.uid())
        )
    );

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_inventory_activities_item ON inventory_activities(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_activities_nuclide ON inventory_activities(radionuclide_id);

-- ============================================
-- 3. Waste Classification Results
-- Stores calculated waste class per item
-- ============================================

CREATE TABLE IF NOT EXISTS waste_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    calculated_class VARCHAR(10), -- ILW, LLW, VLLW, EW
    limiting_nuclide VARCHAR(20), -- Which nuclide determines the class
    limiting_ratio DECIMAL(15,6), -- Activity/Limit ratio
    ilw_sum DECIMAL(15,6) DEFAULT 0, -- Sum of A/L for ILW
    llw_sum DECIMAL(15,6) DEFAULT 0,
    vllw_sum DECIMAL(15,6) DEFAULT 0,
    ew_sum DECIMAL(15,6) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(inventory_item_id)
);

ALTER TABLE waste_classifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage waste_classifications" ON waste_classifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM inventory_items i 
            WHERE i.id = inventory_item_id 
            AND EXISTS (SELECT 1 FROM projects p WHERE p.id = i.project_id AND p.user_id = auth.uid())
        )
    );
