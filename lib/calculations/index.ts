/**
 * CERREX Calculation Engine
 * Ported from Excel formulas to ensure 100% accuracy
 */

import { create, all } from 'mathjs';

const math = create(all);

// ============================================================================
// RADIOACTIVE DECAY CALCULATIONS
// ============================================================================

/**
 * Calculate radioactive decay using exponential formula
 * Formula: N(t) = N0 * exp(-λt) where λ = 0.693 / T1/2
 * 
 * Matches Excel formula:
 * =EXP(-0.693/RND!C$2*(DATEVALUE($AL$1)-DATEVALUE($V3))/365.25)
 */
export function calculateDecay(
    initialActivity: number,
    halfLifeYears: number,
    currentDate: Date,
    referenceDate: Date
): number {
    if (initialActivity === 0) return 0;
    if (halfLifeYears === 0) return initialActivity; // No decay

    // Calculate time difference in years
    const timeDiffMs = currentDate.getTime() - referenceDate.getTime();
    const timeDiffYears = timeDiffMs / (365.25 * 24 * 60 * 60 * 1000);

    // Decay constant: λ = 0.693 / T1/2
    const lambda = 0.693 / halfLifeYears;

    // N(t) = N0 * e^(-λt)
    return initialActivity * Math.exp(-lambda * timeDiffYears);
}

/**
 * Excel decay formula with VLOOKUP integration
 * Matches: =IF($T14=0,0,$T14*$I14*VLOOKUP(...)*EXP(...))
 */
export function excelDecayFormula(
    quantity: number,
    activityPerUnit: number,
    vlookupResult: number,
    halfLife: number,
    currentDate: Date,
    refDate: Date
): number {
    if (quantity === 0) return 0;

    const decayFactor = calculateDecay(1, halfLife, currentDate, refDate);
    return quantity * activityPerUnit * vlookupResult * decayFactor;
}

// ============================================================================
// ISDC COST CALCULATIONS
// ============================================================================

/**
 * Calculate activity-dependent cost
 */
export function calculateActivityCost(
    quantity: number,
    unitFactor: number,
    workDifficultyFactor: number = 1.0
): number {
    return quantity * unitFactor * workDifficultyFactor;
}

/**
 * Calculate labour cost with overheads
 */
export function calculateLabourCost(
    manpowerHours: number,
    hourRate: number,
    overheadPercent: number = 0
): number {
    const baseCost = manpowerHours * hourRate;
    const overheadCost = baseCost * (overheadPercent / 100);
    return baseCost + overheadCost;
}

/**
 * Calculate waste management cost
 */
export function calculateWMCost(
    wasteVolume: number,
    wmUnitFactor: number
): number {
    return wasteVolume * wmUnitFactor;
}

/**
 * Calculate contingency
 */
export function calculateContingency(
    labourCost: number,
    investmentCost: number,
    expenses: number,
    contingencyPercent: number
): number {
    const subtotal = labourCost + investmentCost + expenses;
    return subtotal * (contingencyPercent / 100);
}

/**
 * Calculate total cost per ISDC item
 */
export function calculateTotalCost(
    labourCost: number,
    investmentCost: number,
    expenses: number,
    contingency: number
): number {
    return labourCost + investmentCost + expenses + contingency;
}

// ============================================================================
// WASTE CATEGORIZATION LOGIC
// ============================================================================

/**
 * Categorize waste as exempt waste (EW)
 * Excel formula: =IF($H14=0,0,IF(LEFT($F14,2)="07",$H14,0))
 */
export function categorizeExemptWaste(
    quantity: number,
    categoryCode: string
): number {
    if (quantity === 0) return 0;
    if (categoryCode.substring(0, 2) === "07") return quantity;
    return 0;
}

/**
 * Multi-level waste categorization
 * Excel: =IF($H14=0,0,IF($AK14=0,$GN14,IF($AF14=0,IF(SUM(BV14:DE14)<1,$H14,0),0)))
 */
export function categorizeWasteMultiLevel(
    quantity: number,
    totalWaste: number,
    categoryValue: number,
    exemptValue: number,
    activitySum: number
): number {
    if (quantity === 0) return 0;
    if (totalWaste === 0) return categoryValue;
    if (exemptValue === 0) {
        if (activitySum < 1) return quantity;
        return 0;
    }
    return 0;
}

/**
 * Categorize waste by activity level
 */
export function categorizeWasteByActivity(
    activity: number,
    thresholds: {
        ILW: number,
        LLW: number,
        VLLW: number,
        EW: number
    }
): 'ILW' | 'LLW' | 'VLLW' | 'EW' | 'NonRadioactive' {
    if (activity >= thresholds.ILW) return 'ILW';
    if (activity >= thresholds.LLW) return 'LLW';
    if (activity >= thresholds.VLLW) return 'VLLW';
    if (activity >= thresholds.EW) return 'EW';
    return 'NonRadioactive';
}

// ============================================================================
// SENSITIVITY ANALYSIS
// ============================================================================

/**
 * Run sensitivity analysis on a parameter
 */
export function runSensitivityAnalysis(
    baseValue: number,
    variationFactors: number[],
    calculateFunction: (value: number) => number
): Array<{ factor: number; value: number; result: number; delta: number }> {
    const baseResult = calculateFunction(baseValue);

    return variationFactors.map(factor => {
        const newValue = baseValue * factor;
        const result = calculateFunction(newValue);
        return {
            factor,
            value: newValue,
            result,
            delta: result - baseResult
        };
    });
}

/**
 * Monte Carlo simulation for probabilistic contingency
 */
export function monteCarloContingency(
    baseCost: number,
    contingencyRange: { min: number; max: number },
    iterations: number = 1000
): {
    mean: number;
    median: number;
    p10: number;
    p50: number;
    p90: number;
    distribution: number[];
} {
    const results: number[] = [];

    for (let i = 0; i < iterations; i++) {
        // Random contingency percentage within range
        const randomPercent = contingencyRange.min +
            Math.random() * (contingencyRange.max - contingencyRange.min);

        const totalCost = baseCost * (1 + randomPercent / 100);
        results.push(totalCost);
    }

    // Sort for percentile calculation
    results.sort((a, b) => a - b);

    return {
        mean: results.reduce((a, b) => a + b) / results.length,
        median: results[Math.floor(results.length / 2)],
        p10: results[Math.floor(results.length * 0.1)],
        p50: results[Math.floor(results.length * 0.5)],
        p90: results[Math.floor(results.length * 0.9)],
        distribution: results
    };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * VLOOKUP equivalent for finding radionuclide data
 */
export function vlookup<T>(
    lookupValue: string,
    table: T[],
    keyField: keyof T,
    returnField: keyof T
): T[keyof T] | null {
    const found = table.find(row => row[keyField] === lookupValue);
    return found ? found[returnField] : null;
}

/**
 * Sum range of values
 */
export function sumRange(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0);
}

/**
 * Parse Excel date to JavaScript Date
 */
export function parseExcelDate(excelDate: number | string): Date {
    if (typeof excelDate === 'string') {
        return new Date(excelDate);
    }
    // Excel dates are days since 1900-01-01
    const excelEpoch = new Date(1900, 0, 1);
    return new Date(excelEpoch.getTime() + (excelDate - 2) * 86400000);
}

/**
 * Format date for calculations
 */
export function dateValue(date: Date): number {
    // Convert to Excel serial number
    const excelEpoch = new Date(1900, 0, 1);
    const diff = date.getTime() - excelEpoch.getTime();
    return Math.floor(diff / 86400000) + 2;
}
