// CERREX Wizard Constants
// Central configuration for the 10-step wizard

export const WIZARD_STEPS = [
    {
        id: 0,
        name: 'Project Context',
        path: 'step-0',
        description: 'Define project parameters and global settings',
        icon: 'Building2',
        required: true,
    },
    {
        id: 1,
        name: 'ISDC Scope',
        path: 'step-1',
        description: 'Select which ISDC items are relevant for this project',
        icon: 'ListTree',
        required: true,
    },
    {
        id: 2,
        name: 'Inventory',
        path: 'step-2',
        description: 'Build facility inventory with D&D categories',
        icon: 'Boxes',
        required: false, // Optional - can use period-only costs
    },
    {
        id: 3,
        name: 'Waste Mapping',
        path: 'step-3',
        description: 'Map inventory items to waste categories',
        icon: 'Recycle',
        required: false, // Required if inventory exists
    },
    {
        id: 4,
        name: 'Unit Factors',
        path: 'step-4',
        description: 'Configure unit factors for cost calculation',
        icon: 'Calculator',
        required: true,
    },
    {
        id: 5,
        name: 'Period Costs',
        path: 'step-5',
        description: 'Define period-dependent costs and team composition',
        icon: 'Clock',
        required: true,
    },
    {
        id: 6,
        name: 'Contingency',
        path: 'step-6',
        description: 'Set contingency percentages for risk coverage',
        icon: 'Shield',
        required: true,
    },
    {
        id: 7,
        name: 'Results',
        path: 'step-7',
        description: 'View calculated costs in ISDC L1/L2/L3 format',
        icon: 'BarChart3',
        required: true,
    },
    {
        id: 8,
        name: 'Cashflow',
        path: 'step-8',
        description: 'Generate year-by-year cashflow projection',
        icon: 'TrendingUp',
        required: false,
    },
    {
        id: 9,
        name: 'Sensitivity',
        path: 'step-9',
        description: 'Analyze impact of parameter variations',
        icon: 'Activity',
        required: false,
    },
] as const;

export const FACILITY_TYPES = [
    { value: 'POWER', label: 'Power Reactor', description: 'Commercial power generation reactor' },
    { value: 'RESEARCH', label: 'Research Reactor (TRIGA)', description: 'Research and training reactor' },
    { value: 'FUEL_CYCLE', label: 'Fuel Cycle Facility', description: 'Fuel fabrication or reprocessing' },
    { value: 'OTHER', label: 'Other Nuclear Facility', description: 'Other nuclear installation' },
] as const;

export const DECOM_STRATEGIES = [
    {
        value: 'IMMEDIATE',
        label: 'Immediate Dismantling',
        description: 'Start dismantling immediately after shutdown',
        color: 'emerald',
    },
    {
        value: 'DEFERRED',
        label: 'Deferred Dismantling (Safe Enclosure)',
        description: 'Place facility in safe storage before dismantling',
        color: 'amber',
    },
    {
        value: 'ENTOMBMENT',
        label: 'Entombment',
        description: 'Encapsulate radioactive materials in place',
        color: 'rose',
    },
] as const;

export const WORK_DIFFICULTY_FACTORS = [
    { value: 0.5, label: 'Easy conditions', description: 'Simple access, no constraints' },
    { value: 0.8, label: 'Below normal', description: 'Minor constraints' },
    { value: 1.0, label: 'Normal conditions', description: 'Standard work environment' },
    { value: 1.25, label: 'Above normal', description: 'Some access restrictions' },
    { value: 1.5, label: 'Difficult conditions', description: 'Significant constraints' },
    { value: 2.0, label: 'Very difficult', description: 'Major access or rad issues' },
    { value: 2.5, label: 'Severe conditions', description: 'Extreme constraints' },
    { value: 3.0, label: 'Extreme', description: 'Remote handling required' },
] as const;

export const DEFAULT_CURRENCIES = [
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
] as const;

export const ISDC_LEVELS = {
    L1: 'Principal Activity',
    L2: 'Activity Group',
    L3: 'Detailed Activity',
} as const;

export const WASTE_TYPES = [
    { code: 'ILW', name: 'Intermediate Level Waste', color: '#ef4444' },
    { code: 'LLW', name: 'Low Level Waste', color: '#f97316' },
    { code: 'VLLW', name: 'Very Low Level Waste', color: '#eab308' },
    { code: 'EW', name: 'Exempt Waste', color: '#22c55e' },
    { code: 'NON_RAD', name: 'Non-radioactive', color: '#64748b' },
] as const;

export const PROFESSIONS = [
    { code: 'LBR', name: 'Labourer', abbrev: 'LBR' },
    { code: 'SKW', name: 'Skilled Worker', abbrev: 'SKW' },
    { code: 'TCN', name: 'Technician', abbrev: 'TCN' },
    { code: 'ADM', name: 'Clerk/Admin', abbrev: 'ADM' },
    { code: 'ENG', name: 'Engineer', abbrev: 'ENG' },
    { code: 'SEN', name: 'Senior Engineer', abbrev: 'SEN' },
    { code: 'MNG', name: 'Manager', abbrev: 'MNG' },
    { code: 'AVW', name: 'Average Worker', abbrev: 'AVW' },
] as const;

// Sensitivity analysis multipliers
export const SENSITIVITY_FACTORS = [0.5, 0.75, 1.0, 1.25, 1.5] as const;

// Deferral scenarios (years)
export const DEFERRAL_SCENARIOS = [0, 5, 10, 30, 50] as const;

// Default values for Step 0
export const DEFAULT_PROJECT_CONTEXT = {
    facilityType: 'RESEARCH' as const,
    referenceCurrency: 'EUR',
    nationalCurrency: 'IDR',
    exchangeRate: 17500,
    referenceYear: 2026,
    strategy: 'IMMEDIATE' as const,
    deferralYears: 0,
    workingHoursPerMonth: 160,
    overheadRate: 15,
};
