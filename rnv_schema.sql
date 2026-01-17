-- RNV (Radionuclide Vectors) Tables
-- Run this SQL in Supabase Dashboard → SQL Editor

-- RNV Definitions (types of nuclide mixtures)
CREATE TABLE IF NOT EXISTS rnv_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL, -- RNVD01, RNVC01, RNVA01, etc.
    description TEXT NOT NULL,
    total_fraction DECIMAL(10,6) DEFAULT 0, -- Should sum to 1.0
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, code)
);

-- RNV Fractions (matrix of nuclide fractions per RNV type)
CREATE TABLE IF NOT EXISTS rnv_fractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rnv_id UUID NOT NULL REFERENCES rnv_definitions(id) ON DELETE CASCADE,
    radionuclide_id UUID NOT NULL REFERENCES radionuclides(id) ON DELETE CASCADE,
    fraction DECIMAL(10,6) DEFAULT 0, -- Value between 0 and 1
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(rnv_id, radionuclide_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rnv_definitions_project ON rnv_definitions(project_id);
CREATE INDEX IF NOT EXISTS idx_rnv_fractions_rnv ON rnv_fractions(rnv_id);

-- Enable RLS
ALTER TABLE rnv_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rnv_fractions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own RNV definitions" ON rnv_definitions
    FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own RNV fractions" ON rnv_fractions
    FOR ALL USING (rnv_id IN (SELECT id FROM rnv_definitions WHERE project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())));
