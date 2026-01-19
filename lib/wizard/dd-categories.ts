// D&D Categories Reference Data
// 52 Dismantling & Decontamination categories from CERREX Excel

export interface DDCategory {
    code: string;
    name: string;
    unit: string;
    defaultManpowerUF: number;
    defaultInvestmentUF: number;
    defaultExpensesUF: number;
}

export const DD_CATEGORIES: DDCategory[] = [
    { code: 'INV1', name: 'Work in controlled area', unit: 'm²', defaultManpowerUF: 1, defaultInvestmentUF: 0, defaultExpensesUF: 5 },
    { code: 'INV2', name: 'Technological equipment', unit: 't', defaultManpowerUF: 19, defaultInvestmentUF: 15, defaultExpensesUF: 8 },
    { code: 'INV3', name: 'Thick wall equipment', unit: 't', defaultManpowerUF: 12, defaultInvestmentUF: 15, defaultExpensesUF: 8 },
    { code: 'INV4', name: 'Thin wall equipment', unit: 't', defaultManpowerUF: 40, defaultInvestmentUF: 15, defaultExpensesUF: 8 },
    { code: 'INV5', name: 'Components (<50 kg)', unit: 't', defaultManpowerUF: 1000, defaultInvestmentUF: 200, defaultExpensesUF: 40 },
    { code: 'INV6', name: 'Components (50-200 kg)', unit: 't', defaultManpowerUF: 250, defaultInvestmentUF: 100, defaultExpensesUF: 100 },
    { code: 'INV7', name: 'Components (>200 kg)', unit: 't', defaultManpowerUF: 50, defaultInvestmentUF: 50, defaultExpensesUF: 50 },
    { code: 'INV8', name: 'Concrete in controlled area', unit: 't', defaultManpowerUF: 12, defaultInvestmentUF: 20, defaultExpensesUF: 20 },
    { code: 'INV9', name: 'Graphite elements, thermal columns', unit: 't', defaultManpowerUF: 80, defaultInvestmentUF: 15, defaultExpensesUF: 8 },
    { code: 'INV10', name: 'Specific materials', unit: 't', defaultManpowerUF: 200, defaultInvestmentUF: 30, defaultExpensesUF: 8 },
    { code: 'INV11', name: 'Materials in controlled area', unit: 't', defaultManpowerUF: 30, defaultInvestmentUF: 20, defaultExpensesUF: 20 },
    { code: 'INV12', name: 'Materials out of controlled area', unit: 't', defaultManpowerUF: 5, defaultInvestmentUF: 5, defaultExpensesUF: 5 },
    { code: 'INV13', name: 'Reserved', unit: 't', defaultManpowerUF: 0, defaultInvestmentUF: 0, defaultExpensesUF: 0 },
    { code: 'INV14', name: 'Solid waste & materials', unit: 't', defaultManpowerUF: 5, defaultInvestmentUF: 5, defaultExpensesUF: 10 },
    { code: 'INV15', name: 'Liquid waste & sludge', unit: 't', defaultManpowerUF: 5, defaultInvestmentUF: 5, defaultExpensesUF: 10 },
    { code: 'INV16', name: 'Decontamination of surfaces (light)', unit: 'm²', defaultManpowerUF: 0.5, defaultInvestmentUF: 5, defaultExpensesUF: 5 },
    { code: 'INV17', name: 'Decontamination of surfaces (deep)', unit: 'm²', defaultManpowerUF: 1, defaultInvestmentUF: 10, defaultExpensesUF: 5 },
    { code: 'INV18', name: 'Survey of buildings', unit: 'm²', defaultManpowerUF: 0.5, defaultInvestmentUF: 5, defaultExpensesUF: 5 },
    { code: 'INV19', name: 'Survey of the site', unit: 'm²', defaultManpowerUF: 0.5, defaultInvestmentUF: 5, defaultExpensesUF: 5 },
    { code: 'INV20', name: 'Reserved', unit: 't', defaultManpowerUF: 0, defaultInvestmentUF: 0, defaultExpensesUF: 0 },
    { code: 'INV21', name: 'Valves, pumps', unit: 't', defaultManpowerUF: 27, defaultInvestmentUF: 15, defaultExpensesUF: 8 },
    { code: 'INV22', name: 'Heat exchangers', unit: 't', defaultManpowerUF: 19, defaultInvestmentUF: 15, defaultExpensesUF: 8 },
    { code: 'INV23', name: 'Linings', unit: 't', defaultManpowerUF: 25, defaultInvestmentUF: 15, defaultExpensesUF: 8 },
    { code: 'INV24', name: 'Thin wall equipment (aux)', unit: 't', defaultManpowerUF: 40, defaultInvestmentUF: 15, defaultExpensesUF: 8 },
    { code: 'INV25', name: 'Equipment (general)', unit: 't', defaultManpowerUF: 25, defaultInvestmentUF: 15, defaultExpensesUF: 8 },
    { code: 'INV26', name: 'Cable trays', unit: 't', defaultManpowerUF: 25, defaultInvestmentUF: 15, defaultExpensesUF: 8 },
    { code: 'INV27', name: 'Electrical boards, cabinets', unit: 't', defaultManpowerUF: 10, defaultInvestmentUF: 15, defaultExpensesUF: 8 },
    { code: 'INV28', name: 'Structural elements', unit: 't', defaultManpowerUF: 50, defaultInvestmentUF: 15, defaultExpensesUF: 10 },
    { code: 'INV29', name: 'Insulation', unit: 't', defaultManpowerUF: 100, defaultInvestmentUF: 30, defaultExpensesUF: 8 },
    { code: 'INV30', name: 'Hazardous materials', unit: 't', defaultManpowerUF: 150, defaultInvestmentUF: 50, defaultExpensesUF: 20 },
    { code: 'INV31', name: 'Lead shielding', unit: 't', defaultManpowerUF: 20, defaultInvestmentUF: 10, defaultExpensesUF: 5 },
    { code: 'INV32', name: 'Shielding bricks & plates', unit: 't', defaultManpowerUF: 15, defaultInvestmentUF: 10, defaultExpensesUF: 5 },
    { code: 'INV33', name: 'Concrete shielding', unit: 't', defaultManpowerUF: 8, defaultInvestmentUF: 15, defaultExpensesUF: 10 },
    { code: 'INV34', name: 'Glove boxes', unit: 't', defaultManpowerUF: 200, defaultInvestmentUF: 50, defaultExpensesUF: 20 },
    { code: 'INV35', name: 'Miscellaneous items', unit: 't', defaultManpowerUF: 30, defaultInvestmentUF: 15, defaultExpensesUF: 10 },
    { code: 'INV36', name: 'Reserved', unit: 't', defaultManpowerUF: 0, defaultInvestmentUF: 0, defaultExpensesUF: 0 },
    { code: 'INV37', name: 'Equipment out of controlled area', unit: 't', defaultManpowerUF: 5, defaultInvestmentUF: 5, defaultExpensesUF: 5 },
    { code: 'INV38', name: 'Metal construction', unit: 't', defaultManpowerUF: 8, defaultInvestmentUF: 10, defaultExpensesUF: 5 },
    { code: 'INV39', name: 'Reinforced concrete', unit: 't', defaultManpowerUF: 5, defaultInvestmentUF: 15, defaultExpensesUF: 10 },
    { code: 'INV40', name: 'Plain concrete', unit: 't', defaultManpowerUF: 3, defaultInvestmentUF: 10, defaultExpensesUF: 8 },
    { code: 'INV41', name: 'Building out of controlled area', unit: 't', defaultManpowerUF: 2, defaultInvestmentUF: 5, defaultExpensesUF: 5 },
    { code: 'INV42', name: 'Site remediation', unit: 'm²', defaultManpowerUF: 0.2, defaultInvestmentUF: 2, defaultExpensesUF: 2 },
    { code: 'INV43', name: 'Reserved', unit: 't', defaultManpowerUF: 0, defaultInvestmentUF: 0, defaultExpensesUF: 0 },
    { code: 'INV44', name: 'User defined 1', unit: 't', defaultManpowerUF: 10, defaultInvestmentUF: 10, defaultExpensesUF: 10 },
    { code: 'INV45', name: 'User defined 2', unit: 't', defaultManpowerUF: 10, defaultInvestmentUF: 10, defaultExpensesUF: 10 },
    { code: 'INV46', name: 'User defined 3', unit: 't', defaultManpowerUF: 10, defaultInvestmentUF: 10, defaultExpensesUF: 10 },
    { code: 'INV47', name: 'User defined 4', unit: 't', defaultManpowerUF: 10, defaultInvestmentUF: 10, defaultExpensesUF: 10 },
    { code: 'INV48', name: 'User defined 5', unit: 't', defaultManpowerUF: 10, defaultInvestmentUF: 10, defaultExpensesUF: 10 },
    { code: 'INV49', name: 'User defined 6', unit: 't', defaultManpowerUF: 10, defaultInvestmentUF: 10, defaultExpensesUF: 10 },
    { code: 'INV50', name: 'User defined area 1', unit: 'm²', defaultManpowerUF: 0.5, defaultInvestmentUF: 5, defaultExpensesUF: 5 },
    { code: 'INV51', name: 'User defined area 2', unit: 'm²', defaultManpowerUF: 0.5, defaultInvestmentUF: 5, defaultExpensesUF: 5 },
    { code: 'INV52', name: 'Direct user inputs', unit: 't', defaultManpowerUF: 10, defaultInvestmentUF: 10, defaultExpensesUF: 10 },
];

// Work Difficulty Factors
export const WDF_OPTIONS = [
    { value: 0.5, label: '0.5 - Easy conditions' },
    { value: 0.8, label: '0.8 - Below normal' },
    { value: 1.0, label: '1.0 - Normal conditions' },
    { value: 1.25, label: '1.25 - Above normal' },
    { value: 1.5, label: '1.5 - Difficult' },
    { value: 2.0, label: '2.0 - Very difficult' },
    { value: 2.5, label: '2.5 - Severe' },
    { value: 3.0, label: '3.0 - Extreme (remote handling)' },
];

// Helper to get category by code
export function getDDCategoryByCode(code: string): DDCategory | undefined {
    return DD_CATEGORIES.find(c => c.code === code);
}

// Get categories for specific unit type
export function getDDCategoriesByUnit(unit: 't' | 'm²'): DDCategory[] {
    return DD_CATEGORIES.filter(c => c.unit === unit && c.defaultManpowerUF > 0);
}
