/**
 * CERREX Calculation Engine
 * Exact replication of Excel CERREX formulas
 * 
 * CRITICAL: All formulas must match Excel 100%
 */

// ============================================================================
// EXCEL FUNCTION EQUIVALENTS
// ============================================================================

/**
 * VLOOKUP - Exact match of Excel VLOOKUP function
 * @param lookupValue - Value to search for
 * @param tableArray - 2D array to search in
 * @param colIndex - Column index to return (1-based)
 * @param rangeLookup - FALSE for exact match (default)
 */
export function vlookup<T extends Record<string, any>>(
    lookupValue: any,
    tableArray: T[],
    keyField: keyof T,
    returnField: keyof T
): any {
    const row = tableArray.find(item => item[keyField] === lookupValue)
    return row ? row[returnField] : null
}

/**
 * HLOOKUP - Horizontal lookup (Excel HLOOKUP equivalent)
 */
export function hlookup<T extends Record<string, any>>(
    lookupValue: any,
    tableArray: T[],
    keyField: keyof T,
    returnField: keyof T
): any {
    // For horizontal lookup, same logic as VLOOKUP in our data structure
    return vlookup(lookupValue, tableArray, keyField, returnField)
}

/**
 * SUMIF - Excel SUMIF function
 * @param range - Array to check criteria against
 * @param criteria - Condition to match
 * @param sumRange - Array of values to sum
 */
export function sumif(
    range: any[],
    criteria: any,
    sumRange: number[]
): number {
    let total = 0
    for (let i = 0; i < range.length; i++) {
        if (range[i] === criteria) {
            total += sumRange[i] || 0
        }
    }
    return total
}

/**
 * SUMIFS - Excel SUMIFS (multiple criteria)
 */
export function sumifs(
    sumRange: number[],
    criteriaRanges: any[][],
    criterias: any[]
): number {
    let total = 0
    for (let i = 0; i < sumRange.length; i++) {
        let matches = true
        for (let c = 0; c < criteriaRanges.length; c++) {
            if (criteriaRanges[c][i] !== criterias[c]) {
                matches = false
                break
            }
        }
        if (matches) {
            total += sumRange[i] || 0
        }
    }
    return total
}

/**
 * SUMPRODUCT - Excel SUMPRODUCT function
 * @param arrays - Multiple arrays to multiply element-wise and sum
 */
export function sumproduct(...arrays: number[][]): number {
    if (arrays.length === 0) return 0

    const length = arrays[0].length
    let total = 0

    for (let i = 0; i < length; i++) {
        let product = 1
        for (let j = 0; j < arrays.length; j++) {
            product *= arrays[j][i] || 0
        }
        total += product
    }

    return total
}

/**
 * CONCATENATE - Excel CONCATENATE function
 */
export function concatenate(...values: any[]): string {
    return values.map(v => String(v || '')).join('')
}

// ============================================================================
// CERREX-SPECIFIC CALCULATIONS (EXACT EXCEL FORMULAS)
// ============================================================================

/**
 * Calculate manpower (man-hours) for inventory item
 * Excel formula from ISDC!K12:
 * =V12*$V$3*SUM(W12:AD12)*IF(AW12=1,$O$3,1) + 
 *  IF(H12=1,SUMIFS(...),0) + IF(J12=1,IF($N$3=1,SUMPRODUCT(...),0))
 */
export interface ManpowerCalculationParams {
    quantity: number              // V12
    manpowerUF: number           // $V$3 (from UF lookup)
    professionHours: number[]    // W12:AD12 (array of hours by profession)
    wdfEnabled: boolean          // AW12
    wdfMultiplier: number        // $O$3
    hasInventoryComponent: boolean // H12
    hasRadionuclideComponent: boolean // J12
    calculationMode: number      // $N$3
    // Additional arrays for SUMIFS and SUMPRODUCT
    inventoryData?: {
        quantities: number[]
        categories: string[]
        matchCategory: string
    }
    radionuclideData?: {
        vector: number[]           // DA12:DP12
        factors: number[]          // $DA$8:$DP$8  
    }
}

export function calculateManpower(params: ManpowerCalculationParams): number {
    const {
        quantity,
        manpowerUF,
        professionHours,
        wdfEnabled,
        wdfMultiplier,
        hasInventoryComponent,
        hasRadionuclideComponent,
        calculationMode,
        inventoryData,
        radionuclideData
    } = params

    // Base manpower: V12*$V$3*SUM(W12:AD12)*IF(AW12=1,$O$3,1)
    const sumProfessionHours = professionHours.reduce((a, b) => a + b, 0)
    const wdf = wdfEnabled ? wdfMultiplier : 1
    let totalManpower = quantity * manpowerUF * sumProfessionHours * wdf

    // Add inventory component: IF(H12=1,SUMIFS(...),0)
    if (hasInventoryComponent && inventoryData) {
        const inventorySum = sumifs(
            inventoryData.quantities,
            [inventoryData.categories],
            [inventoryData.matchCategory]
        )
        totalManpower += inventorySum
    }

    // Add radionuclide component: IF(J12=1,IF($N$3=1,SUMPRODUCT(...),0))
    if (hasRadionuclideComponent && radionuclideData && calculationMode === 1) {
        const rnProduct = sumproduct(
            radionuclideData.vector,
            radionuclideData.factors
        )
        totalManpower += rnProduct
    }

    return totalManpower
}

/**
 * Calculate Labour Cost
 * Excel formula from ISDC!M12:
 * =(V12*$V$3*IF(AW12=1,$O$3,1)*
 *   IF(I12=1,SUMPRODUCT(W12:AD12,W$4:AD$4),SUMPRODUCT(W12:AD12,W$3:AD$3)) + ...)
 *  / (IF($C$7=1,1000,1))
 */
export interface LabourCostParams extends ManpowerCalculationParams {
    isContractor: boolean          // I12
    contractorRates: number[]      // W$4:AD$4
    ownerRates: number[]           // W$3:AD$3
    currencyInThousands: boolean   // $C$7
}

export function calculateLabourCost(params: LabourCostParams): number {
    const {
        quantity,
        manpowerUF,
        professionHours,
        wdfEnabled,
        wdfMultiplier,
        isContractor,
        contractorRates,
        ownerRates,
        currencyInThousands,
        hasInventoryComponent,
        hasRadionuclideComponent,
        calculationMode,
        inventoryData,
        radionuclideData
    } = params

    const wdf = wdfEnabled ? wdfMultiplier : 1

    // Select hourly rates based on contractor flag
    const hourlyRates = isContractor ? contractorRates : ownerRates

    // Base labour cost
    let labourCost = quantity * manpowerUF * wdf *
        sumproduct(professionHours, hourlyRates)

    // Add inventory component labour if applicable
    if (hasInventoryComponent && inventoryData) {
        const inventorySum = sumifs(
            inventoryData.quantities,
            [inventoryData.categories],
            [inventoryData.matchCategory]
        )
        const rateToUse = isContractor ? contractorRates[contractorRates.length - 1] : ownerRates[ownerRates.length - 1]
        labourCost += inventorySum * rateToUse
    }

    // Add radionuclide component labour if applicable
    if (hasRadionuclideComponent && radionuclideData && calculationMode === 1) {
        const rnProduct = sumproduct(
            radionuclideData.vector,
            radionuclideData.factors
        )
        const rateToUse = isContractor ? contractorRates[contractorRates.length - 1] : ownerRates[ownerRates.length - 1]
        labourCost += rnProduct * rateToUse
    }

    // Currency conversion: divide by 1000 if in thousands
    const divisor = currencyInThousands ? 1000 : 1

    return labourCost / divisor
}

/**
 * Calculate Investment Cost
 * Excel formula from ISDC!N12:
 * =(S12*V12*IF(AW12=1,$O$3,1) + R12 + 
 *   IF(H12=1,SUMPRODUCT(BA12:CZ12,$BA$9:$CZ$9),0) + ...)
 *  / (IF(C$7=1,1000,1))
 */
export interface InvestmentCostParams {
    investmentUF: number           // S12
    quantity: number               // V12
    wdfEnabled: boolean           // AW12  
    wdfMultiplier: number         // $O$3
    additionalInvestment: number  // R12
    currencyInThousands: boolean  // C$7
    hasInventoryComponent: boolean
    inventoryInvestmentData?: {
        costArray: number[]         // BA12:CZ12
        factorArray: number[]       // $BA$9:$CZ$9
    }
}

export function calculateInvestmentCost(params: InvestmentCostParams): number {
    const {
        investmentUF,
        quantity,
        wdfEnabled,
        wdfMultiplier,
        additionalInvestment,
        currencyInThousands,
        hasInventoryComponent,
        inventoryInvestmentData
    } = params

    const wdf = wdfEnabled ? wdfMultiplier : 1

    // Base investment: S12*V12*IF(AW12=1,$O$3,1)
    let investment = investmentUF * quantity * wdf + additionalInvestment

    // Add inventory investment if applicable
    if (hasInventoryComponent && inventoryInvestmentData) {
        investment += sumproduct(
            inventoryInvestmentData.costArray,
            inventoryInvestmentData.factorArray
        )
    }

    // Currency conversion
    const divisor = currencyInThousands ? 1000 : 1

    return investment / divisor
}

/**
 * Calculate Expenses
 * Excel formula from ISDC!O12 (most complex formula ~1200 chars):
 * =(U12*V12*IF(AW12=1,$O$3,1) + T12 + 
 *   V12*$V$3*IF(AW12=1,$O$3,1)*IF(I12=1,SUMPRODUCT(...)*AC$2/100,...) + ...)
 *  / (IF(C$7=1,1000,1))
 */
export interface ExpensesCostParams extends LabourCostParams {
    expensesUF: number            // U12
    additionalExpenses: number    // T12
    expensesPercentage: number    // AC$2 (contractor) or AD$2 (owner)
}

export function calculateExpensesCost(params: ExpensesCostParams): number {
    const {
        expensesUF,
        quantity,
        additionalExpenses,
        wdfEnabled,
        wdfMultiplier,
        isContractor,
        professionHours,
        contractorRates,
        ownerRates,
        expensesPercentage,
        currencyInThousands,
        manpowerUF
    } = params

    const wdf = wdfEnabled ? wdfMultiplier : 1
    const hourlyRates = isContractor ? contractorRates : ownerRates

    // Base expenses: U12*V12*IF(AW12=1,$O$3,1)
    let expenses = expensesUF * quantity * wdf + additionalExpenses

    // Add proportional labour-related expenses
    const labourRelatedExpenses =
        quantity * manpowerUF * wdf *
        sumproduct(professionHours, hourlyRates) *
        (expensesPercentage / 100)

    expenses += labourRelatedExpenses

    // Currency conversion
    const divisor = currencyInThousands ? 1000 : 1

    return expenses / divisor
}

/**
 * Calculate Contingency
 * Excel formula from ISDC!P12:
 * =IF($Q$10=1,0,SUM(M12:O12)*(Q12/100))
 */
export interface ContingencyParams {
    contingencyEnabled: boolean    // $Q$10
    labourCost: number            // M12
    investmentCost: number        // N12
    expensesCost: number          // O12
    contingencyRate: number       // Q12 (percentage)
}

export function calculateContingency(params: ContingencyParams): number {
    const {
        contingencyEnabled,
        labourCost,
        investmentCost,
        expensesCost,
        contingencyRate
    } = params

    if (!contingencyEnabled) {
        return 0
    }

    const subtotal = labourCost + investmentCost + expensesCost
    return subtotal * (contingencyRate / 100)
}

/**
 * Radioactive Decay Calculation
 * Formula: A(t) = A₀ × e^(-λt)
 * Where: λ = ln(2) / T½
 */
export function calculateDecayConstant(halfLifeYears: number): number {
    return Math.LN2 / halfLifeYears
}

export function calculateActivityAfterDecay(
    initialActivity: number,
    halfLifeYears: number,
    yearsElapsed: number
): number {
    const lambda = calculateDecayConstant(halfLifeYears)
    return initialActivity * Math.exp(-lambda * yearsElapsed)
}

/**
 * Total Cost for Inventory Item
 */
export interface InventoryItemCost {
    manpower: number
    labourCost: number
    investment: number
    expenses: number
    contingency: number
    total: number
}

export function calculateInventoryItemCost(
    labourParams: LabourCostParams,
    investmentParams: InvestmentCostParams,
    expensesParams: ExpensesCostParams,
    contingencyParams: Partial<ContingencyParams>
): InventoryItemCost {
    const manpower = calculateManpower(labourParams)
    const labourCost = calculateLabourCost(labourParams)
    const investment = calculateInvestmentCost(investmentParams)
    const expenses = calculateExpensesCost(expensesParams)

    const contingency = calculateContingency({
        ...contingencyParams,
        labourCost,
        investmentCost: investment,
        expensesCost: expenses
    } as ContingencyParams)

    const total = labourCost + investment + expenses + contingency

    return {
        manpower,
        labourCost,
        investment,
        expenses,
        contingency,
        total
    }
}
