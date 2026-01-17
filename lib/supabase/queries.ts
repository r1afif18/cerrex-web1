import { createClient } from './client'
import type {
    Project,
    ProjectInsert,
    ProjectUpdate,
    Currency,
    CurrencyInsert,
    DDCategory,
    DDCategoryInsert,
    WasteCategory,
    Profession,
    Building,
    Floor,
    TechSystem,
    Material,
    Radionuclide,
    RNVDefinition,
    RNVFraction,
    ISDCCode,
    InventoryItem,
    InventoryItemInsert,
    InventoryItemUpdate,
    ScheduleActivity,
    CashflowYear,
} from './types'

// ============================================
// PROJECT QUERIES
// ============================================

export async function getProjects() {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw error
    return data as Project[]
}

export async function getProject(id: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

    if (error) throw error
    return data as Project
}

export async function createProject(project: ProjectInsert) {
    const supabase = createClient()
    let userId: string | undefined = undefined
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) userId = user.id
    } catch (e) {
        console.warn('Silent user check failed in queries. Proceeding...')
    }

    const { data, error } = await supabase
        .from('projects')
        .insert({ ...project, user_id: userId })
        .select()
        .single()

    if (error) throw error
    return data as Project
}

export async function updateProject(id: string, updates: ProjectUpdate) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('projects')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data as Project
}

export async function deleteProject(id: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

    if (error) throw error
}

export async function cloneProject(sourceId: string, newName: string) {
    const supabase = createClient()

    // 1. Get source project
    const { data: source, error: sourceError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', sourceId)
        .single()
    if (sourceError) throw sourceError

    // 2. Create new project
    const { data: newProject, error: createError } = await supabase
        .from('projects')
        .insert({
            name: newName,
            description: `Clone of ${source.name}. ${source.description || ''}`,
            reference_year: source.reference_year,
            reference_currency: source.reference_currency,
            national_currency: source.national_currency,
            reference_labour_rate: source.reference_labour_rate,
            default_contractor_rate: source.default_contractor_rate,
            user_id: source.user_id
        })
        .select()
        .single()
    if (createError) throw createError

    // 3. Clone Master Data (Ordered list)
    const tablesToClone = [
        'currencies',
        'dd_categories',
        'waste_categories',
        'tech_systems',
        'professions',
        'materials',
        'radionuclides',
        'isdc_codes',
        'buildings'
    ]

    for (const table of tablesToClone) {
        const { data: rows, error: fetchError } = await supabase
            .from(table)
            .select('*')
            .eq('project_id', sourceId)

        if (fetchError) throw fetchError
        if (rows && rows.length > 0) {
            const rowsToInsert = rows.map(r => {
                const { id, created_at, ...rest } = r
                return { ...rest, project_id: newProject.id }
            })
            const { error: insertError } = await supabase.from(table).insert(rowsToInsert)
            if (insertError) throw insertError
        }
    }

    return newProject as Project
}

// ============================================
// CURRENCY QUERIES
// ============================================

export async function getCurrencies(projectId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .eq('project_id', projectId)
        .order('index_no')

    if (error) throw error
    return data as Currency[]
}

export async function createCurrency(currency: CurrencyInsert) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('currencies')
        .insert(currency)
        .select()
        .single()

    if (error) throw error
    return data as Currency
}

export async function deleteCurrency(id: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from('currencies')
        .delete()
        .eq('id', id)

    if (error) throw error
}

// ============================================
// D&D CATEGORY QUERIES
// ============================================

export async function getDDCategories(projectId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('dd_categories')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order')

    if (error) throw error
    return data as DDCategory[]
}

export async function createDDCategory(category: DDCategoryInsert) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('dd_categories')
        .insert(category)
        .select()
        .single()

    if (error) throw error
    return data as DDCategory
}

export async function deleteDDCategory(id: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from('dd_categories')
        .delete()
        .eq('id', id)

    if (error) throw error
}

// ============================================
// PROFESSION QUERIES
// ============================================

export async function getProfessions(projectId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('professions')
        .select('*')
        .eq('project_id', projectId)
        .order('index_no')

    if (error) throw error
    return data as Profession[]
}

// ============================================
// BUILDING & FLOOR QUERIES
// ============================================

export async function getBuildings(projectId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .eq('project_id', projectId)

    if (error) throw error
    return data as Building[]
}

export async function getFloors(buildingId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('floors')
        .select('*')
        .eq('building_id', buildingId)

    if (error) throw error
    return data as Floor[]
}

// ============================================
// TECH SYSTEM & MATERIAL QUERIES
// ============================================

export async function getTechSystems(projectId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('tech_systems')
        .select('*')
        .eq('project_id', projectId)

    if (error) throw error
    return data as TechSystem[]
}

export async function getMaterials(projectId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('project_id', projectId)

    if (error) throw error
    return data as Material[]
}

// ============================================
// RADIONUCLIDE QUERIES
// ============================================

export async function getRadionuclides(projectId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('radionuclides')
        .select('*')
        .eq('project_id', projectId)

    if (error) throw error
    return data as Radionuclide[]
}

export async function getRadionuclideVectors(projectId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('radionuclide_vectors')
        .select('*')
        .eq('project_id', projectId)

    if (error) throw error
    return data as RNVDefinition[]
}

// ============================================
// ISDC CODE QUERIES
// ============================================

export async function getISDCCodes(projectId: string, level?: number) {
    const supabase = createClient()
    let query = supabase
        .from('isdc_codes')
        .select('*')
        .eq('project_id', projectId)

    if (level !== undefined) {
        query = query.eq('level', level)
    }

    const { data, error } = await query.order('code')

    if (error) throw error
    return data as ISDCCode[]
}

// ============================================
// INVENTORY QUERIES
// ============================================

export async function getInventoryItems(projectId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at')

    if (error) throw error
    return data as InventoryItem[]
}

export async function createInventoryItem(item: InventoryItemInsert) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('inventory_items')
        .insert(item)
        .select()
        .single()

    if (error) throw error
    return data as InventoryItem
}

export async function updateInventoryItem(id: string, updates: InventoryItemUpdate) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('inventory_items')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data as InventoryItem
}

export async function deleteInventoryItem(id: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id)

    if (error) throw error
}

// ============================================
// SCHEDULE QUERIES
// ============================================

export async function getScheduleActivities(projectId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('schedule_activities')
        .select('*')
        .eq('project_id', projectId)
        .order('start_year')

    if (error) throw error
    return data as ScheduleActivity[]
}

// ============================================
// CASHFLOW QUERIES
// ============================================

export async function getCashflowYears(projectId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('cashflow_years')
        .select('*')
        .eq('project_id', projectId)
        .order('year')

    if (error) throw error
    return data as CashflowYear[]
}

// ============================================
// WASTE CATEGORY QUERIES
// ============================================

export async function getWasteCategories(projectId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('waste_categories')
        .select('*')
        .eq('project_id', projectId)

    if (error) throw error
    return data as WasteCategory[]
}
