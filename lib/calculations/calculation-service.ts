/**
 * CERREX Calculation Service
 * Proper calculation functions that work with Context data
 * No hooks inside hooks - clean functions
 */

import {
    InventoryItem,
    UnitFactor,
    Profession,
    CerrexData
} from '../context/CerrexContext'

// ============================================================================
// TYPES
// ============================================================================

export interface CalculatedInventoryItem extends InventoryItem {
    manpowerHours: number
    labourCost: number
    investmentCost: number
    expensesCost: number
    contingency: number
    totalCost: number
    hasCalculation: boolean
}

export interface ISDCAggregation {
    code: string
    name: string
    labourCost: number
    investment: number
    expenses: number
    contingency: number
    total: number
    itemCount: number
}

export interface ProjectTotals {
    totalManpower: number
    totalLabour: number
    totalInvestment: number
    totalExpenses: number
    totalContingency: number
    grandTotal: number
    itemCount: number
}

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate costs for a single inventory item
 * Returns item with calculated fields
 */
export function calculateInventoryItem(
    item: InventoryItem,
    data: CerrexData
): CalculatedInventoryItem {
    // Find unit factor for this D&D category
    const unitFactor = data.unitFactors.find(uf => uf.category === item.ddCategory)

    // If no unit factor found, return zero costs
    if (!unitFactor) {
        return {
            ...item,
            manpowerHours: 0,
            labourCost: 0,
            investmentCost: 0,
            expensesCost: 0,
            contingency: 0,
            totalCost: 0,
            hasCalculation: false
        }
    }

    // Calculate WDF multiplier
    // If wdfEnabled and any F1-F7 flag is set, apply global multiplier
    const wdfFlagsSum =
        (item.wdf_F1_Scaffolding || 0) +
        (item.wdf_F2_ConfinedSpace || 0) +
        (item.wdf_F3_Respiratory || 0) +
        (item.wdf_F4_Protective || 0) +
        (item.wdf_F5_Shielding || 0) +
        (item.wdf_F6_Remote || 0) +
        (item.wdf_F7_UserDefined || 0)

    const wdfMultiplier = (item.wdfEnabled && wdfFlagsSum > 0)
        ? data.wdfGlobalMultiplier
        : 1.0

    // Get hourly rate based on contractor flag
    // Use average of all profession rates for simplicity
    const avgHourlyRate = data.professions.length > 0
        ? data.professions.reduce((sum, p) =>
            sum + (item.isContractor ? p.hourRateContractor : p.hourRateOwner), 0) / data.professions.length
        : 50 // Default rate

    // EXACT EXCEL FORMULA CALCULATIONS
    // ---------------------------------

    // Manpower (man-hours) = Quantity × Manpower_UF × WDF
    const manpowerHours = item.quantity * unitFactor.manpowerUF * wdfMultiplier

    // Labour Cost = Manpower × Average_Hourly_Rate
    let labourCost = manpowerHours * avgHourlyRate

    // Investment = Quantity × Investment_UF × WDF + Additional_Investment
    let investmentCost = (item.quantity * unitFactor.investmentUF * wdfMultiplier)
        + (item.additionalInvestment || 0)

    // Expenses = Quantity × Expenses_UF × WDF + Additional_Expenses
    // Plus percentage of labour (if applicable)
    const expensesPercentage = item.isContractor
        ? data.expensesPercentageContractor
        : data.expensesPercentageOwner
    let expensesCost = (item.quantity * unitFactor.expensesUF * wdfMultiplier)
        + (item.additionalExpenses || 0)
        + (labourCost * expensesPercentage / 100)

    // Apply currency in thousands conversion (if enabled)
    if (data.currencyInThousands) {
        labourCost = labourCost / 1000
        investmentCost = investmentCost / 1000
        expensesCost = expensesCost / 1000
    }

    // Contingency = (Labour + Investment + Expenses) × Contingency_Rate%
    const subtotal = labourCost + investmentCost + expensesCost
    const contingency = data.contingencyEnabled
        ? subtotal * (item.contingencyRate / 100)
        : 0

    // Total = Labour + Investment + Expenses + Contingency
    const totalCost = labourCost + investmentCost + expensesCost + contingency

    return {
        ...item,
        manpowerHours: Math.round(manpowerHours * 100) / 100,
        labourCost: Math.round(labourCost * 100) / 100,
        investmentCost: Math.round(investmentCost * 100) / 100,
        expensesCost: Math.round(expensesCost * 100) / 100,
        contingency: Math.round(contingency * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        hasCalculation: true
    }
}

/**
 * Calculate ALL inventory items
 * Returns array of items with calculated costs
 */
export function calculateAllInventoryItems(data: CerrexData): CalculatedInventoryItem[] {
    return data.inventoryItems.map(item => calculateInventoryItem(item, data))
}

/**
 * Calculate project totals (L0 level)
 */
export function calculateProjectTotals(data: CerrexData): ProjectTotals {
    const calculatedItems = calculateAllInventoryItems(data)

    return {
        totalManpower: calculatedItems.reduce((sum, item) => sum + item.manpowerHours, 0),
        totalLabour: calculatedItems.reduce((sum, item) => sum + item.labourCost, 0),
        totalInvestment: calculatedItems.reduce((sum, item) => sum + item.investmentCost, 0),
        totalExpenses: calculatedItems.reduce((sum, item) => sum + item.expensesCost, 0),
        totalContingency: calculatedItems.reduce((sum, item) => sum + item.contingency, 0),
        grandTotal: calculatedItems.reduce((sum, item) => sum + item.totalCost, 0),
        itemCount: calculatedItems.filter(i => i.hasCalculation).length
    }
}

/**
 * Aggregate by ISDC Level 1 (Principal Activities)
 */
export function aggregateByISDCL1(data: CerrexData): ISDCAggregation[] {
    const calculatedItems = calculateAllInventoryItems(data)

    // Group by L1 code
    const groups: Record<string, CalculatedInventoryItem[]> = {}

    calculatedItems.forEach(item => {
        const l1Code = item.isdcL1Code || '00'
        if (!groups[l1Code]) {
            groups[l1Code] = []
        }
        groups[l1Code].push(item)
    })

    // ISDC Level 1 names (11 principal activities)
    const l1Names: Record<string, string> = {
        '01': 'Pre-Decommissioning Actions',
        '02': 'Facility Shutdown Activities',
        '03': 'Additional Activities for Safe Enclosure',
        '04': 'Dismantling Activities Inside Controlled Area',
        '05': 'Dismantling Activities Outside Controlled Area',
        '06': 'Waste Processing, Storage and Disposal',
        '07': 'Site Infrastructure and Operation',
        '08': 'Conventional Dismantling, Demolition and Site Restoration',
        '09': 'Project Management, Engineering and Site Support',
        '10': 'Fuel and Nuclear Material',
        '11': 'Miscellaneous Expenditures'
    }

    // Convert to aggregation array
    return Object.entries(groups).map(([code, items]) => ({
        code,
        name: l1Names[code] || `Activity ${code}`,
        labourCost: items.reduce((sum, i) => sum + i.labourCost, 0),
        investment: items.reduce((sum, i) => sum + i.investmentCost, 0),
        expenses: items.reduce((sum, i) => sum + i.expensesCost, 0),
        contingency: items.reduce((sum, i) => sum + i.contingency, 0),
        total: items.reduce((sum, i) => sum + i.totalCost, 0),
        itemCount: items.length
    })).sort((a, b) => a.code.localeCompare(b.code))
}

/**
 * Aggregate by ISDC Level 2 (Activity Groups)
 */
export function aggregateByISDCL2(data: CerrexData): ISDCAggregation[] {
    const calculatedItems = calculateAllInventoryItems(data)

    // Group by L2 code
    const groups: Record<string, CalculatedInventoryItem[]> = {}

    calculatedItems.forEach(item => {
        const l2Code = item.isdcL2Code || '00.00'
        if (!groups[l2Code]) {
            groups[l2Code] = []
        }
        groups[l2Code].push(item)
    })

    return Object.entries(groups).map(([code, items]) => ({
        code,
        name: `Activity Group ${code}`,
        labourCost: items.reduce((sum, i) => sum + i.labourCost, 0),
        investment: items.reduce((sum, i) => sum + i.investmentCost, 0),
        expenses: items.reduce((sum, i) => sum + i.expensesCost, 0),
        contingency: items.reduce((sum, i) => sum + i.contingency, 0),
        total: items.reduce((sum, i) => sum + i.totalCost, 0),
        itemCount: items.length
    })).sort((a, b) => a.code.localeCompare(b.code))
}

/**
 * Aggregate by ISDC Level 3 (Typical Activities)
 */
export function aggregateByISDCL3(data: CerrexData): ISDCAggregation[] {
    const calculatedItems = calculateAllInventoryItems(data)

    // Group by L3 code
    const groups: Record<string, CalculatedInventoryItem[]> = {}

    calculatedItems.forEach(item => {
        const l3Code = item.isdcL3Code || '00.00.00'
        if (!groups[l3Code]) {
            groups[l3Code] = []
        }
        groups[l3Code].push(item)
    })

    return Object.entries(groups).map(([code, items]) => ({
        code,
        name: `Typical Activity ${code}`,
        labourCost: items.reduce((sum, i) => sum + i.labourCost, 0),
        investment: items.reduce((sum, i) => sum + i.investmentCost, 0),
        expenses: items.reduce((sum, i) => sum + i.expensesCost, 0),
        contingency: items.reduce((sum, i) => sum + i.contingency, 0),
        total: items.reduce((sum, i) => sum + i.totalCost, 0),
        itemCount: items.length
    })).sort((a, b) => a.code.localeCompare(b.code))
}
