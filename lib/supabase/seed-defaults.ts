import { SupabaseClient } from '@supabase/supabase-js'

// Auto-seed all default master data when a project is created
export async function seedProjectDefaults(supabase: SupabaseClient, projectId: string) {
    // ============================================
    // 1. Professions (8 standard)
    // ============================================
    const professions = [
        { index_no: 1, name: 'Scientist / Senior Engineer', abbreviation: 'SSE', hourly_rate_owner: 60, hourly_rate_contractor: 75 },
        { index_no: 2, name: 'Junior Engineer', abbreviation: 'JE', hourly_rate_owner: 45, hourly_rate_contractor: 55 },
        { index_no: 3, name: 'Health Physicist', abbreviation: 'HP', hourly_rate_owner: 55, hourly_rate_contractor: 70 },
        { index_no: 4, name: 'Technician', abbreviation: 'TN', hourly_rate_owner: 35, hourly_rate_contractor: 45 },
        { index_no: 5, name: 'Craftsman', abbreviation: 'CM', hourly_rate_owner: 30, hourly_rate_contractor: 40 },
        { index_no: 6, name: 'Labourer', abbreviation: 'LB', hourly_rate_owner: 25, hourly_rate_contractor: 30 },
        { index_no: 7, name: 'Admin / Clerical', abbreviation: 'AC', hourly_rate_owner: 28, hourly_rate_contractor: 35 },
        { index_no: 8, name: 'Security', abbreviation: 'SC', hourly_rate_owner: 30, hourly_rate_contractor: 38 },
    ]
    await supabase.from('professions').insert(professions.map(p => ({ project_id: projectId, ...p })))

    // ============================================
    // 2. D&D Categories (51 standard from PRD)
    // ============================================
    const ddCategories = [
        { code: 'INV1', name: 'Workforce in controlled area', unit: '[man.h]', abbreviation: 'WFCA', category_type: 'workforce', manpower_uf: 1, investment_uf: 0, expenses_uf: 5, sort_order: 1 },
        { code: 'INV2', name: 'General technological equipment', unit: '[t]', abbreviation: 'GNEQ', category_type: 'general', manpower_uf: 19, investment_uf: 15, expenses_uf: 8, sort_order: 2 },
        { code: 'INV3', name: 'Massive & thick wall equipment', unit: '[t]', abbreviation: 'MTHE', category_type: 'general', manpower_uf: 12, investment_uf: 15, expenses_uf: 8, sort_order: 3 },
        { code: 'INV4', name: 'Auxiliary & thin wall equipment', unit: '[t]', abbreviation: 'ATHE', category_type: 'general', manpower_uf: 40, investment_uf: 15, expenses_uf: 8, sort_order: 4 },
        { code: 'INV5', name: 'Small core components (<50 kg)', unit: '[t]', abbreviation: 'SCRC', category_type: 'general', manpower_uf: 1000, investment_uf: 200, expenses_uf: 40, sort_order: 5 },
        { code: 'INV6', name: 'Medium core components (50-200 kg)', unit: '[t]', abbreviation: 'MCRC', category_type: 'general', manpower_uf: 250, investment_uf: 100, expenses_uf: 100, sort_order: 6 },
        { code: 'INV7', name: 'Large reactor components (>200 kg)', unit: '[t]', abbreviation: 'LRCP', category_type: 'general', manpower_uf: 50, investment_uf: 50, expenses_uf: 50, sort_order: 7 },
        { code: 'INV8', name: 'Massive concrete in controlled area', unit: '[t]', abbreviation: 'MCCA', category_type: 'general', manpower_uf: 5, investment_uf: 0, expenses_uf: 8, sort_order: 8 },
        { code: 'INV9', name: 'Graphite elements, thermal columns', unit: '[t]', abbreviation: 'GRPH', category_type: 'general', manpower_uf: 100, investment_uf: 200, expenses_uf: 50, sort_order: 9 },
        { code: 'INV10', name: 'Low density & specific materials', unit: '[t]', abbreviation: 'LDSM', category_type: 'general', manpower_uf: 10, investment_uf: 10, expenses_uf: 10, sort_order: 10 },
        { code: 'INV11', name: 'Other materials in controlled area', unit: '[t]', abbreviation: 'OMCA', category_type: 'general', manpower_uf: 5, investment_uf: 5, expenses_uf: 5, sort_order: 11 },
        { code: 'INV12', name: 'Contam. material out of controlled area', unit: '[t]', abbreviation: 'CMOC', category_type: 'general', manpower_uf: 2, investment_uf: 2, expenses_uf: 2, sort_order: 12 },
        { code: 'INV13', name: 'Reserve', unit: '[t]', abbreviation: 'RSV1', category_type: 'general', manpower_uf: 0, investment_uf: 0, expenses_uf: 0, sort_order: 13 },
        { code: 'INV14', name: 'Removal solid waste & materials', unit: '[t]', abbreviation: 'RSWM', category_type: 'additional', manpower_uf: 5, investment_uf: 0, expenses_uf: 8, sort_order: 14 },
        { code: 'INV15', name: 'Removal liquid waste & sludge', unit: '[t]', abbreviation: 'RLWS', category_type: 'additional', manpower_uf: 10, investment_uf: 5, expenses_uf: 15, sort_order: 15 },
        { code: 'INV16', name: 'Chemical decontamination of surfaces', unit: '[m2]', abbreviation: 'CDCS', category_type: 'additional', manpower_uf: 0.2, investment_uf: 0.1, expenses_uf: 0.5, sort_order: 16 },
        { code: 'INV17', name: 'Mechanical decontamination of surfaces', unit: '[m2]', abbreviation: 'MDCS', category_type: 'additional', manpower_uf: 0.5, investment_uf: 0.2, expenses_uf: 0.3, sort_order: 17 },
        { code: 'INV18', name: 'Radiological survey of buildings', unit: '[m2]', abbreviation: 'RSBL', category_type: 'additional', manpower_uf: 0.1, investment_uf: 0, expenses_uf: 0.05, sort_order: 18 },
        { code: 'INV19', name: 'Radiological survey of the site', unit: '[m2]', abbreviation: 'RSST', category_type: 'additional', manpower_uf: 0.05, investment_uf: 0, expenses_uf: 0.02, sort_order: 19 },
        { code: 'INV20', name: 'Reserve', unit: '[t]', abbreviation: 'RSV2', category_type: 'additional', manpower_uf: 0, investment_uf: 0, expenses_uf: 0, sort_order: 20 },
        { code: 'INV21', name: 'Piping, valves, pumps', unit: '[t]', abbreviation: 'PIVA', category_type: 'specific', manpower_uf: 25, investment_uf: 15, expenses_uf: 10, sort_order: 21 },
        { code: 'INV22', name: 'Tanks, heat exchangers', unit: '[t]', abbreviation: 'THEX', category_type: 'specific', manpower_uf: 15, investment_uf: 10, expenses_uf: 8, sort_order: 22 },
        { code: 'INV23', name: 'Steel linings', unit: '[t]', abbreviation: 'STLN', category_type: 'specific', manpower_uf: 20, investment_uf: 10, expenses_uf: 5, sort_order: 23 },
        { code: 'INV24', name: 'Ventilation & thin wall equipment', unit: '[t]', abbreviation: 'VTNE', category_type: 'specific', manpower_uf: 40, investment_uf: 15, expenses_uf: 8, sort_order: 24 },
        { code: 'INV25', name: 'Handling equipment', unit: '[t]', abbreviation: 'HNDE', category_type: 'specific', manpower_uf: 20, investment_uf: 20, expenses_uf: 10, sort_order: 25 },
        { code: 'INV26', name: 'Cables & cable trays', unit: '[t]', abbreviation: 'CBLT', category_type: 'specific', manpower_uf: 30, investment_uf: 5, expenses_uf: 5, sort_order: 26 },
        { code: 'INV27', name: 'Switchboards, electrical cabinets', unit: '[t]', abbreviation: 'SWBC', category_type: 'specific', manpower_uf: 25, investment_uf: 10, expenses_uf: 8, sort_order: 27 },
        { code: 'INV28', name: 'Embedded elements', unit: '[t]', abbreviation: 'EMBE', category_type: 'specific', manpower_uf: 15, investment_uf: 5, expenses_uf: 5, sort_order: 28 },
        { code: 'INV29', name: 'Thermal insulation', unit: '[t]', abbreviation: 'TINS', category_type: 'specific', manpower_uf: 20, investment_uf: 2, expenses_uf: 5, sort_order: 29 },
        { code: 'INV30', name: 'Asbestos & hazardous materials', unit: '[t]', abbreviation: 'ASHM', category_type: 'specific', manpower_uf: 50, investment_uf: 20, expenses_uf: 30, sort_order: 30 },
        { code: 'INV31', name: 'Massive lead shielding', unit: '[t]', abbreviation: 'MLDS', category_type: 'specific', manpower_uf: 30, investment_uf: 50, expenses_uf: 20, sort_order: 31 },
        { code: 'INV32', name: 'Lead shielding bricks & plates', unit: '[t]', abbreviation: 'LSBP', category_type: 'specific', manpower_uf: 40, investment_uf: 30, expenses_uf: 15, sort_order: 32 },
        { code: 'INV33', name: 'Other shielding', unit: '[t]', abbreviation: 'OTHS', category_type: 'specific', manpower_uf: 20, investment_uf: 20, expenses_uf: 10, sort_order: 33 },
        { code: 'INV34', name: 'Glove boxes', unit: '[t]', abbreviation: 'GLVB', category_type: 'specific', manpower_uf: 100, investment_uf: 50, expenses_uf: 30, sort_order: 34 },
        { code: 'INV35', name: 'Miscellaneous items', unit: '[t]', abbreviation: 'MISC', category_type: 'specific', manpower_uf: 10, investment_uf: 5, expenses_uf: 5, sort_order: 35 },
        { code: 'INV36', name: 'Reserve', unit: '[t]', abbreviation: 'RSV3', category_type: 'specific', manpower_uf: 0, investment_uf: 0, expenses_uf: 0, sort_order: 36 },
        { code: 'INV37', name: 'General equipment out of controlled area', unit: '[t]', abbreviation: 'GEOC', category_type: 'out_of_ca', manpower_uf: 5, investment_uf: 5, expenses_uf: 3, sort_order: 37 },
        { code: 'INV38', name: 'Structural metal construction', unit: '[t]', abbreviation: 'STMC', category_type: 'out_of_ca', manpower_uf: 8, investment_uf: 5, expenses_uf: 3, sort_order: 38 },
        { code: 'INV39', name: 'Massive reinforced concrete', unit: '[t]', abbreviation: 'MRCN', category_type: 'out_of_ca', manpower_uf: 3, investment_uf: 0, expenses_uf: 5, sort_order: 39 },
        { code: 'INV40', name: 'Masonry, plain concrete', unit: '[t]', abbreviation: 'MSNR', category_type: 'out_of_ca', manpower_uf: 2, investment_uf: 0, expenses_uf: 3, sort_order: 40 },
        { code: 'INV41', name: 'Other material out of controlled area', unit: '[t]', abbreviation: 'OMOC', category_type: 'out_of_ca', manpower_uf: 3, investment_uf: 2, expenses_uf: 2, sort_order: 41 },
        { code: 'INV42', name: 'Final site remediation', unit: '[m2]', abbreviation: 'FSRM', category_type: 'out_of_ca', manpower_uf: 0.1, investment_uf: 0, expenses_uf: 0.05, sort_order: 42 },
        { code: 'INV43', name: 'Reserve', unit: '[t]', abbreviation: 'RSV4', category_type: 'out_of_ca', manpower_uf: 0, investment_uf: 0, expenses_uf: 0, sort_order: 43 },
        { code: 'INV44', name: 'D&D44 user defined', unit: '[t]', abbreviation: 'UD44', category_type: 'user_defined', manpower_uf: 0, investment_uf: 0, expenses_uf: 0, sort_order: 44 },
        { code: 'INV45', name: 'D&D45 user defined', unit: '[t]', abbreviation: 'UD45', category_type: 'user_defined', manpower_uf: 0, investment_uf: 0, expenses_uf: 0, sort_order: 45 },
        { code: 'INV46', name: 'D&D46 user defined', unit: '[t]', abbreviation: 'UD46', category_type: 'user_defined', manpower_uf: 0, investment_uf: 0, expenses_uf: 0, sort_order: 46 },
        { code: 'INV47', name: 'D&D47 user defined', unit: '[t]', abbreviation: 'UD47', category_type: 'user_defined', manpower_uf: 0, investment_uf: 0, expenses_uf: 0, sort_order: 47 },
        { code: 'INV48', name: 'D&D48 user defined', unit: '[t]', abbreviation: 'UD48', category_type: 'user_defined', manpower_uf: 0, investment_uf: 0, expenses_uf: 0, sort_order: 48 },
        { code: 'INV49', name: 'D&D49 user defined', unit: '[t]', abbreviation: 'UD49', category_type: 'user_defined', manpower_uf: 0, investment_uf: 0, expenses_uf: 0, sort_order: 49 },
        { code: 'INV50', name: 'D&D50 user defined areas', unit: '[m2]', abbreviation: 'UD50', category_type: 'user_defined', manpower_uf: 0, investment_uf: 0, expenses_uf: 0, sort_order: 50 },
        { code: 'INV51', name: 'D&D51 user defined areas', unit: '[m2]', abbreviation: 'UD51', category_type: 'user_defined', manpower_uf: 0, investment_uf: 0, expenses_uf: 0, sort_order: 51 },
    ]
    await supabase.from('dd_categories').insert(ddCategories.map(c => ({ project_id: projectId, ...c })))

    // ============================================
    // 3. Tech Systems (19 standard)
    // ============================================
    const techSystems = [
        { code: 'BLS', name: 'Building structure, architecture' },
        { code: 'BSH', name: 'Biological shield' },
        { code: 'CVS', name: 'Confinement and ventilation system' },
        { code: 'EES', name: 'Electrical and emergency supply' },
        { code: 'EVE', name: 'Exhausting ventilation' },
        { code: 'EXP', name: 'Experimental equipment' },
        { code: 'HEQ', name: 'Handling equipment' },
        { code: 'HES', name: 'Heating system' },
        { code: 'OTH', name: 'Others' },
        { code: 'PCC', name: 'Primary coolant circuit' },
        { code: 'PUC', name: 'Purification circuit' },
        { code: 'RCF', name: 'Reactor core and fuel' },
        { code: 'RCM', name: 'Reactor and components' },
        { code: 'RPS', name: 'Radiation protection system' },
        { code: 'RSC', name: 'Reactor safety and control' },
        { code: 'RWT', name: 'Radioactive waste treatment' },
        { code: 'SCC', name: 'Secondary coolant circuit' },
        { code: 'SFS', name: 'Spent fuel system' },
        { code: 'TCO', name: 'Thermal column' },
    ]
    await supabase.from('tech_systems').insert(techSystems.map(s => ({ project_id: projectId, ...s })))

    // ============================================
    // 4. Materials (17 standard)
    // ============================================
    const materials = [
        { code: 'ALUM', name: 'Aluminium, B+Al', density_kg_m3: 2650 },
        { code: 'ASBS', name: 'Asbestos', density_kg_m3: 1800 },
        { code: 'BACN', name: 'Barite concrete', density_kg_m3: 3500 },
        { code: 'BERM', name: 'Beryllium', density_kg_m3: 1850 },
        { code: 'CAST', name: 'Carbon steel', density_kg_m3: 7860 },
        { code: 'COPP', name: 'Copper', density_kg_m3: 8960 },
        { code: 'GRAP', name: 'Graphite', density_kg_m3: 1620 },
        { code: 'HRCN', name: 'Heavy reinforced concrete', density_kg_m3: 5600 },
        { code: 'LEAD', name: 'Lead', density_kg_m3: 11350 },
        { code: 'MASO', name: 'Masonry', density_kg_m3: 1600 },
        { code: 'PLCN', name: 'Plain concrete', density_kg_m3: 1600 },
        { code: 'PLST', name: 'Plastic', density_kg_m3: 950 },
        { code: 'PRCE', name: 'Prefabricated concrete elements', density_kg_m3: 2400 },
        { code: 'RECN', name: 'Reinforced concrete', density_kg_m3: 2400 },
        { code: 'STST', name: 'Stainless steel', density_kg_m3: 7860 },
        { code: 'THIN', name: 'Thermal insulation', density_kg_m3: 40 },
        { code: 'ZIAL', name: 'Zircalloy', density_kg_m3: 6550 },
    ]
    await supabase.from('materials').insert(materials.map(m => ({ project_id: projectId, ...m })))

    // ============================================
    // 5. Buildings (5 standard)
    // ============================================
    const buildings = [
        { code: 'RB', name: 'Reactor Building' },
        { code: 'SB', name: 'Service Building' },
        { code: 'CT', name: 'Cooling Towers' },
        { code: 'WB', name: 'Waste Building' },
        { code: 'AB', name: 'Auxiliary Building' },
    ]
    const { data: insertedBuildings } = await supabase.from('buildings').insert(buildings.map(b => ({ project_id: projectId, ...b }))).select()

    // Add floors for Reactor Building
    if (insertedBuildings) {
        const rb = insertedBuildings.find(b => b.code === 'RB')
        if (rb) {
            const floors = [
                { building_id: rb.id, elevation: '-6.5', description: 'Underground - primary cooling' },
                { building_id: rb.id, elevation: '+0.0', description: 'Ground floor - reactor hall' },
                { building_id: rb.id, elevation: '+6.0', description: 'Reactor pool level' },
                { building_id: rb.id, elevation: 'VF1', description: 'Virtual floor - summaries' },
            ]
            await supabase.from('floors').insert(floors)
        }
    }

    // ============================================
    // 6. Radionuclides (31 standard with RAW limits)
    // ============================================
    const radionuclides = [
        { symbol: 'Ag-108m', half_life_years: 130, ew_limit_bq_g: 0.1, vllw_limit_bq_g: 10, llw_limit_bq_g: 100 },
        { symbol: 'Ag-110m', half_life_years: 0.684, ew_limit_bq_g: 0.1, vllw_limit_bq_g: 10, llw_limit_bq_g: 100000 },
        { symbol: 'Am-241', half_life_years: 432.7, ew_limit_bq_g: 0.1, vllw_limit_bq_g: 1, llw_limit_bq_g: 1000 },
        { symbol: 'Ba-133', half_life_years: 10.5, ew_limit_bq_g: 1, vllw_limit_bq_g: 10, llw_limit_bq_g: 10000 },
        { symbol: 'C-14', half_life_years: 5700, ew_limit_bq_g: 1, vllw_limit_bq_g: 1000, llw_limit_bq_g: 10000 },
        { symbol: 'Ca-41', half_life_years: 102000, ew_limit_bq_g: 10, vllw_limit_bq_g: 10, llw_limit_bq_g: 10000 },
        { symbol: 'Cd-113m', half_life_years: 14.1, ew_limit_bq_g: 0.1, vllw_limit_bq_g: 10, llw_limit_bq_g: 10000 },
        { symbol: 'Ce-144', half_life_years: 0.78, ew_limit_bq_g: 1, vllw_limit_bq_g: 100, llw_limit_bq_g: 10000 },
        { symbol: 'Cl-36', half_life_years: 301000, ew_limit_bq_g: 1, vllw_limit_bq_g: 1000, llw_limit_bq_g: 10000 },
        { symbol: 'Co-57', half_life_years: 0.744, ew_limit_bq_g: 1, vllw_limit_bq_g: 100, llw_limit_bq_g: 100000 },
        { symbol: 'Co-60', half_life_years: 5.27, ew_limit_bq_g: 0.1, vllw_limit_bq_g: 10, llw_limit_bq_g: 10000 },
        { symbol: 'Cs-134', half_life_years: 2.06, ew_limit_bq_g: 0.1, vllw_limit_bq_g: 10, llw_limit_bq_g: 10000 },
        { symbol: 'Cs-137', half_life_years: 30.1, ew_limit_bq_g: 0.1, vllw_limit_bq_g: 10, llw_limit_bq_g: 10000 },
        { symbol: 'Eu-152', half_life_years: 13.5, ew_limit_bq_g: 0.1, vllw_limit_bq_g: 10, llw_limit_bq_g: 10000 },
        { symbol: 'Eu-154', half_life_years: 8.59, ew_limit_bq_g: 0.1, vllw_limit_bq_g: 10, llw_limit_bq_g: 10000 },
        { symbol: 'Eu-155', half_life_years: 4.76, ew_limit_bq_g: 1, vllw_limit_bq_g: 100, llw_limit_bq_g: 100000 },
        { symbol: 'Fe-55', half_life_years: 2.74, ew_limit_bq_g: 100, vllw_limit_bq_g: 10000, llw_limit_bq_g: 1000000 },
        { symbol: 'H-3', half_life_years: 12.3, ew_limit_bq_g: 100, vllw_limit_bq_g: 100000, llw_limit_bq_g: 10000000 },
        { symbol: 'K-40', half_life_years: 1280000000, ew_limit_bq_g: 10, vllw_limit_bq_g: 100, llw_limit_bq_g: 10000 },
        { symbol: 'Mn-54', half_life_years: 0.855, ew_limit_bq_g: 0.1, vllw_limit_bq_g: 100, llw_limit_bq_g: 100000 },
        { symbol: 'Nb-94', half_life_years: 20300, ew_limit_bq_g: 0.1, vllw_limit_bq_g: 10, llw_limit_bq_g: 1000 },
        { symbol: 'Ni-59', half_life_years: 76000, ew_limit_bq_g: 100, vllw_limit_bq_g: 10000, llw_limit_bq_g: 1000000 },
        { symbol: 'Ni-63', half_life_years: 100, ew_limit_bq_g: 100, vllw_limit_bq_g: 10000, llw_limit_bq_g: 1000000 },
        { symbol: 'Pu-238', half_life_years: 87.7, ew_limit_bq_g: 0.1, vllw_limit_bq_g: 1, llw_limit_bq_g: 100 },
        { symbol: 'Pu-239', half_life_years: 24100, ew_limit_bq_g: 0.1, vllw_limit_bq_g: 1, llw_limit_bq_g: 100 },
        { symbol: 'Pu-241', half_life_years: 14.4, ew_limit_bq_g: 10, vllw_limit_bq_g: 100, llw_limit_bq_g: 10000 },
        { symbol: 'Sb-125', half_life_years: 2.76, ew_limit_bq_g: 1, vllw_limit_bq_g: 100, llw_limit_bq_g: 100000 },
        { symbol: 'Sr-90', half_life_years: 28.8, ew_limit_bq_g: 1, vllw_limit_bq_g: 100, llw_limit_bq_g: 10000 },
        { symbol: 'Tc-99', half_life_years: 211000, ew_limit_bq_g: 1, vllw_limit_bq_g: 1000, llw_limit_bq_g: 10000 },
        { symbol: 'Zn-65', half_life_years: 0.668, ew_limit_bq_g: 0.1, vllw_limit_bq_g: 100, llw_limit_bq_g: 100000 },
        { symbol: 'Zr-93', half_life_years: 1530000, ew_limit_bq_g: 10, vllw_limit_bq_g: 100, llw_limit_bq_g: 10000 },
    ]
    await supabase.from('radionuclides').insert(radionuclides.map(r => ({ project_id: projectId, ...r })))

    // ============================================
    // 7. Currencies (reference + national)
    // ============================================
    const currencies = [
        { index_no: 1, abbreviation: 'USD', name: 'US Dollar', exchange_rate: 1.0, total_bdf: 1.0 },
        { index_no: 2, abbreviation: 'EUR', name: 'Euro', exchange_rate: 0.92, total_bdf: 1.0 },
    ]
    await supabase.from('currencies').insert(currencies.map(c => ({ project_id: projectId, ...c, bdf_factors: {} })))

    // ============================================
    // 8. Waste Management Categories (26 standard)
    // ============================================
    const wasteCategories = [
        { code: 'WMS1', name: 'Spent fuel management', isdc_code_primary: '05.0000', manpower_uf: 100, investment_uf: 200, expenses_uf: 50 },
        { code: 'WMS2', name: 'Spent fuel transport', isdc_code_primary: '05.0100', manpower_uf: 50, investment_uf: 100, expenses_uf: 30 },
        { code: 'WMS3', name: 'ILW treatment - compaction', isdc_code_primary: '06.0100', manpower_uf: 20, investment_uf: 50, expenses_uf: 20 },
        { code: 'WMS4', name: 'ILW treatment - incineration', isdc_code_primary: '06.0100', manpower_uf: 30, investment_uf: 80, expenses_uf: 40 },
        { code: 'WMS5', name: 'ILW treatment - melting', isdc_code_primary: '06.0100', manpower_uf: 40, investment_uf: 100, expenses_uf: 50 },
        { code: 'WMS6', name: 'ILW conditioning - cementation', isdc_code_primary: '06.0200', manpower_uf: 15, investment_uf: 30, expenses_uf: 25 },
        { code: 'WMS7', name: 'ILW conditioning - bituminization', isdc_code_primary: '06.0200', manpower_uf: 20, investment_uf: 40, expenses_uf: 30 },
        { code: 'WMS8', name: 'ILW storage', isdc_code_primary: '06.0300', manpower_uf: 5, investment_uf: 20, expenses_uf: 10 },
        { code: 'WMS9', name: 'ILW disposal', isdc_code_primary: '06.0400', manpower_uf: 10, investment_uf: 50, expenses_uf: 100 },
        { code: 'WMS10', name: 'LLW treatment - compaction', isdc_code_primary: '07.0100', manpower_uf: 15, investment_uf: 30, expenses_uf: 15 },
        { code: 'WMS11', name: 'LLW treatment - incineration', isdc_code_primary: '07.0100', manpower_uf: 20, investment_uf: 50, expenses_uf: 30 },
        { code: 'WMS12', name: 'LLW treatment - melting', isdc_code_primary: '07.0100', manpower_uf: 30, investment_uf: 70, expenses_uf: 40 },
        { code: 'WMS13', name: 'LLW conditioning', isdc_code_primary: '07.0200', manpower_uf: 10, investment_uf: 20, expenses_uf: 15 },
        { code: 'WMS14', name: 'LLW storage', isdc_code_primary: '07.0300', manpower_uf: 3, investment_uf: 15, expenses_uf: 8 },
        { code: 'WMS15', name: 'LLW disposal', isdc_code_primary: '07.0400', manpower_uf: 5, investment_uf: 30, expenses_uf: 50 },
        { code: 'WMS16', name: 'VLLW treatment', isdc_code_primary: '08.0100', manpower_uf: 5, investment_uf: 10, expenses_uf: 8 },
        { code: 'WMS17', name: 'VLLW conditioning', isdc_code_primary: '08.0200', manpower_uf: 3, investment_uf: 8, expenses_uf: 5 },
        { code: 'WMS18', name: 'VLLW disposal', isdc_code_primary: '08.0400', manpower_uf: 2, investment_uf: 15, expenses_uf: 20 },
        { code: 'WMS19', name: 'EW clearance measurement', isdc_code_primary: '09.0100', manpower_uf: 1, investment_uf: 2, expenses_uf: 1 },
        { code: 'WMS20', name: 'EW free release', isdc_code_primary: '09.0200', manpower_uf: 0.5, investment_uf: 0, expenses_uf: 0.5 },
        { code: 'WMS21', name: 'EW restricted release/recycle', isdc_code_primary: '09.0300', manpower_uf: 1, investment_uf: 0, expenses_uf: 1 },
        { code: 'WMS22', name: 'NRAW conventional disposal', isdc_code_primary: '10.0100', manpower_uf: 0.5, investment_uf: 0, expenses_uf: 2 },
        { code: 'WMS23', name: 'Liquid waste treatment', isdc_code_primary: '06.0500', manpower_uf: 25, investment_uf: 60, expenses_uf: 35 },
        { code: 'WMS24', name: 'User defined WM24', isdc_code_primary: '', manpower_uf: 0, investment_uf: 0, expenses_uf: 0 },
        { code: 'WMS25', name: 'User defined WM25', isdc_code_primary: '', manpower_uf: 0, investment_uf: 0, expenses_uf: 0 },
    ]
    await supabase.from('waste_categories').insert(wasteCategories.map(w => ({ project_id: projectId, ...w })))

    // ============================================
    // 9. RNV Definitions (13 standard)
    // Radionuclide vectors for activity distribution
    // ============================================
    const rnvDefinitions = [
        { code: 'RNVD01', description: 'Dose rate in reactor building', total_fraction: 0 },
        { code: 'RNVC01', description: 'Contamination in RB - walls', total_fraction: 1 },
        { code: 'RNVC02', description: 'Contamination - primary circuit water', total_fraction: 1 },
        { code: 'RNVC03', description: 'Contamination - spent fuel system', total_fraction: 0 },
        { code: 'RNVA01', description: 'Activation - reactor core', total_fraction: 0 },
        { code: 'RNVA02', description: 'Activation - Al parts', total_fraction: 0 },
        { code: 'RNVA03', description: 'Activation - barite concrete', total_fraction: 0 },
        { code: 'RNVA04', description: 'Activation - graphite', total_fraction: 1 },
        { code: 'RNVA05', description: 'Activation - steel tank', total_fraction: 0 },
        { code: 'RNVA06', description: 'Activation - steel shot concrete', total_fraction: 0 },
        { code: 'RNVA07', description: 'Activation - lead', total_fraction: 0 },
        { code: 'RNVA08', description: 'Activation - concrete', total_fraction: 0 },
        { code: 'RNVxxx', description: 'User defined', total_fraction: 0 },
    ]
    const { data: insertedRNV } = await supabase.from('rnv_definitions').insert(rnvDefinitions.map(r => ({ project_id: projectId, ...r }))).select()

    // Add RNV fractions for the active vectors (requires radionuclide IDs)
    // Fraction mapping based on Excel data:
    // RNVC01: Co-60=0.99, Cs-137=0.01
    // RNVC02: Co-60=0.80, H-3=0.05, Ni-63=0.15
    // RNVA04: C-14=0.000898, Co-60=0.09, Cs-134=0.000451, Eu-152=0.0083, Fe-55=0.90
    if (insertedRNV) {
        const { data: nuclides } = await supabase.from('radionuclides').select('id, symbol').eq('project_id', projectId)
        if (nuclides && nuclides.length > 0) {
            const getNuclideId = (symbol: string) => nuclides.find(n => n.symbol === symbol)?.id
            const fractions: Array<{ rnv_id: string, radionuclide_id: string, fraction: number }> = []

            // RNVC01 fractions
            const rnvc01 = insertedRNV.find(r => r.code === 'RNVC01')
            if (rnvc01) {
                const co60 = getNuclideId('Co-60')
                const cs137 = getNuclideId('Cs-137')
                if (co60) fractions.push({ rnv_id: rnvc01.id, radionuclide_id: co60, fraction: 0.99 })
                if (cs137) fractions.push({ rnv_id: rnvc01.id, radionuclide_id: cs137, fraction: 0.01 })
            }

            // RNVC02 fractions
            const rnvc02 = insertedRNV.find(r => r.code === 'RNVC02')
            if (rnvc02) {
                const co60 = getNuclideId('Co-60')
                const h3 = getNuclideId('H-3')
                const ni63 = getNuclideId('Ni-63')
                if (co60) fractions.push({ rnv_id: rnvc02.id, radionuclide_id: co60, fraction: 0.80 })
                if (h3) fractions.push({ rnv_id: rnvc02.id, radionuclide_id: h3, fraction: 0.05 })
                if (ni63) fractions.push({ rnv_id: rnvc02.id, radionuclide_id: ni63, fraction: 0.15 })
            }

            // RNVA04 fractions (graphite activation)
            const rnva04 = insertedRNV.find(r => r.code === 'RNVA04')
            if (rnva04) {
                const c14 = getNuclideId('C-14')
                const co60 = getNuclideId('Co-60')
                const cs134 = getNuclideId('Cs-134')
                const eu152 = getNuclideId('Eu-152')
                const fe55 = getNuclideId('Fe-55')
                if (c14) fractions.push({ rnv_id: rnva04.id, radionuclide_id: c14, fraction: 0.000898 })
                if (co60) fractions.push({ rnv_id: rnva04.id, radionuclide_id: co60, fraction: 0.09 })
                if (cs134) fractions.push({ rnv_id: rnva04.id, radionuclide_id: cs134, fraction: 0.000451 })
                if (eu152) fractions.push({ rnv_id: rnva04.id, radionuclide_id: eu152, fraction: 0.0083 })
                if (fe55) fractions.push({ rnv_id: rnva04.id, radionuclide_id: fe55, fraction: 0.90 })
            }

            if (fractions.length > 0) {
                await supabase.from('rnv_fractions').insert(fractions)
            }
        }
    }

    // ============================================
    // 10. Sample Inventory Items (4 examples from Excel)
    // ============================================
    const inventoryItems = [
        {
            item_id: 'R001',
            description: 'Example 1 - Activated item (graphite)',
            inventory_type: 'INV',
            isdc_l3_code: '04.0501',
            building_code: '01',
            is_activated: true,
            quantity: 1,
            unit: '[t]',
            mass_kg: 1000,
            basic_workforce: 80,
            wdf_f1: 30, wdf_f2: 15, wdf_f3: 20, wdf_f4: 25, wdf_f5: 10, wdf_f6: 0, wdf_f7: 0,
            is_contractor: false,
            contingency_rate: 10,
            waste_ilw: 100, waste_llw: 0, waste_vllw: 0, waste_ew: 0, waste_nraw: 0,
            rnv_code: 'RNVA04',
        },
        {
            item_id: 'R002',
            description: 'Example 2 - Externally contaminated item',
            inventory_type: 'INV',
            isdc_l3_code: '04.0601',
            building_code: '01',
            is_activated: true,
            quantity: 1,
            unit: '[t]',
            mass_kg: 10000,
            basic_workforce: 120,
            wdf_f1: 30, wdf_f2: 15, wdf_f3: 20, wdf_f4: 25, wdf_f5: 10, wdf_f6: 0, wdf_f7: 0,
            is_contractor: false,
            contingency_rate: 10,
            waste_ilw: 0, waste_llw: 0, waste_vllw: 0, waste_ew: 100, waste_nraw: 0,
            rnv_code: 'RNVC01',
        },
        {
            item_id: 'R003',
            description: 'Example 3 - Internally contaminated item (piping)',
            inventory_type: 'INV',
            isdc_l3_code: '04.0503',
            building_code: '01',
            is_activated: true,
            quantity: 1,
            unit: '[t]',
            mass_kg: 5000,
            basic_workforce: 135,
            wdf_f1: 30, wdf_f2: 15, wdf_f3: 20, wdf_f4: 25, wdf_f5: 10, wdf_f6: 0, wdf_f7: 0,
            is_contractor: false,
            contingency_rate: 10,
            waste_ilw: 0, waste_llw: 0, waste_vllw: 100, waste_ew: 0, waste_nraw: 0,
            rnv_code: 'RNVC02',
        },
        {
            item_id: 'S001',
            description: 'Example 4 - Non-contaminated item',
            inventory_type: 'INV',
            isdc_l3_code: '04.0601',
            building_code: '01.0100',
            is_activated: true,
            quantity: 1,
            unit: '[t]',
            mass_kg: 10000,
            basic_workforce: 190,
            wdf_f1: 30, wdf_f2: 15, wdf_f3: 20, wdf_f4: 25, wdf_f5: 10, wdf_f6: 0, wdf_f7: 0,
            is_contractor: false,
            contingency_rate: 10,
            waste_ilw: 0, waste_llw: 0, waste_vllw: 0, waste_ew: 100, waste_nraw: 0,
            rnv_code: '',
        },
    ]
    const { data: insertedItems } = await supabase.from('inventory_items').insert(
        inventoryItems.map(item => ({ project_id: projectId, ...item }))
    ).select()

    // Add D&D quantities for each item
    if (insertedItems && insertedItems.length > 0) {
        const ddQuantities: Array<{ inventory_item_id: string, dd_category_code: string, quantity: number }> = []

        // R001 -> INV9 (Graphite) = 1.0 ton
        const r001 = insertedItems.find(i => i.item_id === 'R001')
        if (r001) ddQuantities.push({ inventory_item_id: r001.id, dd_category_code: 'INV9', quantity: 1.0 })

        // R002 -> INV3 (Massive equip) = 10.0 ton
        const r002 = insertedItems.find(i => i.item_id === 'R002')
        if (r002) ddQuantities.push({ inventory_item_id: r002.id, dd_category_code: 'INV3', quantity: 10.0 })

        // R003 -> INV21 (Piping) = 5.0 ton
        const r003 = insertedItems.find(i => i.item_id === 'R003')
        if (r003) ddQuantities.push({ inventory_item_id: r003.id, dd_category_code: 'INV21', quantity: 5.0 })

        // S001 -> INV2 (General equip) = 10.0 ton
        const s001 = insertedItems.find(i => i.item_id === 'S001')
        if (s001) ddQuantities.push({ inventory_item_id: s001.id, dd_category_code: 'INV2', quantity: 10.0 })

        if (ddQuantities.length > 0) {
            await supabase.from('inventory_dd_quantities').insert(ddQuantities)
        }
    }

    console.log('Project defaults seeded successfully')
}


