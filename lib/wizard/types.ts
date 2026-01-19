// CERREX Wizard TypeScript Types
// Type definitions for wizard functionality

// ============================================
// WIZARD SESSION
// ============================================

export interface WizardSession {
    id: string;
    projectId: string;
    currentStep: number;
    status: WizardStatus;
    stepsCompleted: boolean[];
    lastSavedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export type WizardStatus = 'in_progress' | 'completed' | 'abandoned';

// ============================================
// STEP 0: PROJECT CONTEXT
// ============================================

export interface ProjectContext {
    id?: string;
    projectId: string;
    // Basic info (from projects table)
    name: string;
    description?: string;
    referenceCurrency: string;
    nationalCurrency: string;
    exchangeRate: number;
    referenceYear: number;
    // Extended context (from project_context table)
    facilityType: FacilityType;
    facilityName?: string;
    facilityLocation?: string;
    decomStartDate: string | null;
    strategy: DecomStrategy;
    deferralYears: number;
    workingHoursPerMonth: number;
    overheadRate: number;
    ownerOrganization?: string;
    regulatoryBody?: string;
    licenseNumber?: string;
    notes?: string;
}

export type FacilityType = 'POWER' | 'RESEARCH' | 'FUEL_CYCLE' | 'OTHER';
export type DecomStrategy = 'IMMEDIATE' | 'DEFERRED' | 'ENTOMBMENT';

// ============================================
// STEP 1: ISDC SCOPE
// ============================================

export interface ISDCItem {
    code: string;
    name: string;
    level: 1 | 2 | 3;
    parentCode: string | null;
    isInventoryDependent: boolean;
    isWasteManagement: boolean;
    defaultContingency: number;
}

export interface ISDCSelection {
    projectId: string;
    isdcCode: string;
    isActive: boolean;
    isContractor: boolean;
    contingencyPercent: number;
}

// ============================================
// STEP 2: INVENTORY
// ============================================

export interface InventoryItem {
    id: string;
    projectId: string;
    itemId: string;
    description: string;
    buildingCode?: string;
    floorCode?: string;
    isdcCode?: string;
    ddCategoryCode: string;
    quantity: number;
    unit: string;
    workDifficultyFactor: number;
    isContractor: boolean;
    // Radiological data (optional ADIN mode)
    hasRadiologicalData: boolean;
    specificActivity?: number;
    referenceDate?: string;
    nuclideVector?: string;
}

export interface DDCategory {
    code: string;
    name: string;
    unit: string;
    manpowerUF: number;
    investmentUF: number;
    expensesUF: number;
}

// ============================================
// STEP 3: WASTE MAPPING
// ============================================

export interface WastePartition {
    projectId: string;
    mode: 'AUTO' | 'MANUAL';
    ilwPercent: number;
    llwPercent: number;
    vllwPercent: number;
    ewPercent: number;
    nonRadPercent: number;
}

export interface WasteBreakdown {
    inventoryItemId: string;
    ilw: number;
    llw: number;
    vllw: number;
    ew: number;
    nonRad: number;
    total: number;
}

export type WasteType = 'ILW' | 'LLW' | 'VLLW' | 'EW' | 'NON_RAD';

// ============================================
// STEP 4: UNIT FACTORS
// ============================================

export interface UnitFactors {
    projectId: string;
    categoryCode: string;
    categoryType: 'DD' | 'WM';
    manpowerUF: number;
    investmentUF: number;
    expensesUF: number;
}

// ============================================
// STEP 5: PERIOD COSTS
// ============================================

export interface ProjectPhase {
    id: string;
    projectId: string;
    phaseNumber: number;
    name: string;
    durationMonths: number;
    startDate: string | null;
    endDate: string | null;
}

export interface StaffAllocation {
    phaseId: string;
    professionCode: string;
    staffCount: number;
    isContractor: boolean;
}

export interface FixedCost {
    id: string;
    phaseId: string;
    name: string;
    amount: number;
    frequency: 'ONCE' | 'YEARLY' | 'MONTHLY';
}

export interface Profession {
    code: string;
    name: string;
    abbreviation: string;
    hourlyRateOwner: number;
    hourlyRateContractor: number;
}

// ============================================
// STEP 6: CONTINGENCY
// ============================================

export interface ContingencySettings {
    projectId: string;
    mode: 'DETERMINISTIC' | 'PROBABILISTIC';
    items: ContingencyItem[];
}

export interface ContingencyItem {
    isdcCode: string;
    contingencyPercent: number;
    minPercent?: number; // For Monte Carlo
    maxPercent?: number; // For Monte Carlo
}

// ============================================
// STEP 7: RESULTS
// ============================================

export interface CalculationResult {
    projectId: string;
    calculatedAt: string;
    totals: CostBreakdown;
    totalManpower: number;
    totalWaste: number;
    isdcL1: ISDCCostItem[];
    isdcL2: ISDCCostItem[];
    isdcL3: ISDCCostItem[];
}

export interface CostBreakdown {
    labour: number;
    investment: number;
    expenses: number;
    contingency: number;
    total: number;
}

export interface ISDCCostItem {
    code: string;
    name: string;
    level: number;
    labour: number;
    investment: number;
    expenses: number;
    contingency: number;
    total: number;
    manpower: number;
}

// ============================================
// STEP 8: CASHFLOW
// ============================================

export interface CashflowSettings {
    projectId: string;
    inflationRate: number;
    discountRate: number;
}

export interface CashflowYear {
    year: number;
    nominalCost: number;
    realCost: number;
    cumulativeCost: number;
    inflationRate: number;
}

export interface CashflowResult {
    years: CashflowYear[];
    totalNominal: number;
    totalReal: number;
    npv: number;
}

// ============================================
// STEP 9: SENSITIVITY
// ============================================

export interface SensitivityResult {
    scenarioName: string;
    factorMultiplier: number;
    deferralYears: number;
    totalCost: number;
    npv: number;
    percentChange: number;
}

export interface SensitivityAnalysis {
    projectId: string;
    unitFactorSensitivity: SensitivityResult[];
    deferralSensitivity: SensitivityResult[];
}

// ============================================
// FORM VALIDATION
// ============================================

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

export interface ValidationError {
    field: string;
    message: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
    data: T | null;
    error: string | null;
    success: boolean;
}

export interface WizardState {
    session: WizardSession | null;
    context: ProjectContext | null;
    isLoading: boolean;
    error: string | null;
}
