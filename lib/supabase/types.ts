// Supabase Database Types
// Auto-generated types matching supabase_schema.sql

export interface Project {
    id: string
    user_id: string
    name: string
    description?: string
    reference_currency: string
    national_currency: string
    reference_labour_rate: number
    default_contractor_rate: number
    reference_year: number
    original_year: number
    total_bdf: number
    inflation_rate: number
    working_hours_per_year: number
    contingency_enabled: boolean
    currency_in_thousands: boolean
    wdf_global_multiplier: number
    expenses_pct_contractor: number
    expenses_pct_owner: number
    created_at: string
    updated_at: string
}

export interface Currency {
    id: string
    project_id: string
    index_no: number
    abbreviation: string
    name: string
    exchange_rate: number
    total_bdf: number
    bdf_factors: Record<string, number>
    created_at: string
}

export interface DDCategory {
    id: string
    project_id: string
    code: string
    name: string
    unit: string
    abbreviation?: string
    category_type?: string
    manpower_uf: number
    investment_uf: number
    expenses_uf: number
    sort_order?: number
    created_at: string
}

export interface WasteCategory {
    id: string
    project_id: string
    code: string
    name: string
    isdc_code_primary?: string
    isdc_code_secondary?: string
    manpower_uf: number
    investment_uf: number
    expenses_uf: number
    created_at: string
}

export interface Profession {
    id: string
    project_id: string
    index_no: number
    name: string
    abbreviation?: string
    hourly_rate_owner: number
    hourly_rate_contractor: number
    created_at: string
}

export interface Building {
    id: string
    project_id: string
    code: string
    name: string
    created_at: string
}

export interface Floor {
    id: string
    building_id: string
    elevation: string
    description: string
    created_at: string
}

export interface TechSystem {
    id: string
    project_id: string
    code: string
    name: string
    created_at: string
}

export interface Material {
    id: string
    project_id: string
    code: string
    name: string
    density_kg_m3?: number
    created_at: string
}

export interface Radionuclide {
    id: string
    project_id: string
    symbol: string
    half_life_years: number
    ew_limit_bq_g?: number
    vllw_limit_bq_g?: number
    llw_limit_bq_g?: number
    created_at: string
}

export interface RNVDefinition {
    id: string
    project_id: string
    code: string
    description: string
    total_fraction: number
    created_at: string
}

export interface RNVFraction {
    id: string
    rnv_id: string
    radionuclide_id: string
    fraction: number
    created_at: string
}

export interface ISDCCode {
    id: string
    project_id: string
    level: number
    code: string
    name: string
    parent_code?: string
    is_activated: boolean
    contingency_rate: number
    created_at: string
}

export interface InventoryItem {
    id: string
    project_id: string
    item_id: string
    description: string
    inventory_type: 'INV' | 'WMS' | 'SFS'
    isdc_l3_code?: string
    building_code?: string
    floor_code?: string
    tech_system_code?: string
    material_code?: string
    rnv_code?: string
    is_activated: boolean
    quantity: number
    unit: string
    mass_kg: number
    specific_activity_bq_g: number
    total_activity_bq: number
    basic_workforce: number
    wdf_f1: number
    wdf_f2: number
    wdf_f3: number
    wdf_f4: number
    wdf_f5: number
    wdf_f6: number
    wdf_f7: number
    is_contractor: boolean
    contingency_rate: number
    waste_ilw: number
    waste_llw: number
    waste_vllw: number
    waste_ew: number
    waste_nraw: number
    notes?: string
    created_at: string
    updated_at: string
}

export interface InventoryActivity {
    id: string
    inventory_item_id: string
    radionuclide_id: string
    activity_bq_g: number
    activity_total_bq: number
    fraction: number
    created_at: string
}

export interface WasteClassification {
    id: string
    inventory_item_id: string
    calculated_class: 'ILW' | 'LLW' | 'VLLW' | 'EW' | null
    limiting_nuclide?: string
    limiting_ratio: number
    ilw_sum: number
    llw_sum: number
    vllw_sum: number
    ew_sum: number
    created_at: string
}

export interface InventoryDDQuantity {
    id: string
    inventory_item_id: string
    dd_category_code: string
    quantity: number
}

export interface ScheduleActivity {
    id: string
    project_id: string
    isdc_l2_code: string
    description: string
    phase: string
    start_year: number
    duration_calc: number
    duration_user: number
    working_groups: number
    created_at: string
}

export interface CashflowYear {
    id: string
    project_id: string
    year: number
    inflation_rate: number
    ref_year_cost: number
    nominal_cost: number
    created_at: string
}

// Insert types (without id and timestamps)
export type ProjectInsert = Omit<Project, 'id' | 'created_at' | 'updated_at'>
export type CurrencyInsert = Omit<Currency, 'id' | 'created_at'>
export type DDCategoryInsert = Omit<DDCategory, 'id' | 'created_at'>
export type InventoryItemInsert = Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>

// Update types (all optional except id)
export type ProjectUpdate = Partial<ProjectInsert>
export type CurrencyUpdate = Partial<CurrencyInsert>
export type DDCategoryUpdate = Partial<DDCategoryInsert>
export type InventoryItemUpdate = Partial<InventoryItemInsert>
