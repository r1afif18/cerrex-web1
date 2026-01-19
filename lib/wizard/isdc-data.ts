// ISDC Reference Data - Complete 336 items structure
// Based on IAEA ISDC (International Structure for Decommissioning Costing)

export interface ISDCItem {
    code: string;
    name: string;
    level: 1 | 2 | 3;
    parentCode: string | null;
    isInventoryDependent: boolean;
    isWasteManagement: boolean;
    contingencyDefault: number;
}

// Level 1 (11 Principal Activities)
export const ISDC_L1: ISDCItem[] = [
    { code: '01', name: 'Pre-decommissioning actions', level: 1, parentCode: null, isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '02', name: 'Facility shutdown activities', level: 1, parentCode: null, isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '03', name: 'Additional activities for safe enclosure or entombment', level: 1, parentCode: null, isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 15 },
    { code: '04', name: 'Dismantling activities within the controlled area', level: 1, parentCode: null, isInventoryDependent: true, isWasteManagement: false, contingencyDefault: 20 },
    { code: '05', name: 'Waste processing, storage and disposal', level: 1, parentCode: null, isInventoryDependent: true, isWasteManagement: true, contingencyDefault: 15 },
    { code: '06', name: 'Site infrastructure and operation', level: 1, parentCode: null, isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '07', name: 'Conventional dismantling, demolition and site restoration', level: 1, parentCode: null, isInventoryDependent: true, isWasteManagement: false, contingencyDefault: 15 },
    { code: '08', name: 'Project management, engineering and support', level: 1, parentCode: null, isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '09', name: 'Research and development', level: 1, parentCode: null, isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 20 },
    { code: '10', name: 'Fuel and nuclear material', level: 1, parentCode: null, isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 15 },
    { code: '11', name: 'Miscellaneous expenditures', level: 1, parentCode: null, isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
];

// Level 2 items organized by L1 parent
export const ISDC_L2: ISDCItem[] = [
    // 01 - Pre-decommissioning actions
    { code: '01.0100', name: 'Decommissioning planning', level: 2, parentCode: '01', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '01.0200', name: 'Facility characterisation', level: 2, parentCode: '01', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '01.0300', name: 'Safety, security and environmental studies', level: 2, parentCode: '01', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '01.0400', name: 'Waste management planning', level: 2, parentCode: '01', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '01.0500', name: 'Authorisation', level: 2, parentCode: '01', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '01.0600', name: 'Preparing management group and organisation', level: 2, parentCode: '01', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },

    // 02 - Facility shutdown
    { code: '02.0100', name: 'Plant shutdown and inspection', level: 2, parentCode: '02', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '02.0200', name: 'Drainage of systems, removal of residual materials', level: 2, parentCode: '02', isInventoryDependent: true, isWasteManagement: false, contingencyDefault: 10 },
    { code: '02.0300', name: 'Radiological inventory characterisation', level: 2, parentCode: '02', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '02.0400', name: 'Hazardous/contaminated material surveys', level: 2, parentCode: '02', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '02.0500', name: 'Decontamination actions for plant restart preparation', level: 2, parentCode: '02', isInventoryDependent: true, isWasteManagement: false, contingencyDefault: 10 },

    // 03 - Safe enclosure / entombment
    { code: '03.0100', name: 'Site preparation for safe enclosure', level: 2, parentCode: '03', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 15 },
    { code: '03.0200', name: 'Site surveillance and maintenance', level: 2, parentCode: '03', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 15 },
    { code: '03.0300', name: 'Entombment activities', level: 2, parentCode: '03', isInventoryDependent: true, isWasteManagement: false, contingencyDefault: 15 },

    // 04 - Dismantling within controlled area
    { code: '04.0100', name: 'Procurement of dismantling equipment', level: 2, parentCode: '04', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '04.0200', name: 'Preparations and support for dismantling', level: 2, parentCode: '04', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '04.0300', name: 'Pre-dismantling decontamination', level: 2, parentCode: '04', isInventoryDependent: true, isWasteManagement: false, contingencyDefault: 20 },
    { code: '04.0400', name: 'Removal of materials requiring specific procedures', level: 2, parentCode: '04', isInventoryDependent: true, isWasteManagement: false, contingencyDefault: 20 },
    { code: '04.0500', name: 'Dismantling of main process systems', level: 2, parentCode: '04', isInventoryDependent: true, isWasteManagement: false, contingencyDefault: 25 },
    { code: '04.0600', name: 'Dismantling of other systems and components', level: 2, parentCode: '04', isInventoryDependent: true, isWasteManagement: false, contingencyDefault: 20 },
    { code: '04.0700', name: 'Dismantling of building structures', level: 2, parentCode: '04', isInventoryDependent: true, isWasteManagement: false, contingencyDefault: 20 },
    { code: '04.0800', name: 'Final radioactivity survey', level: 2, parentCode: '04', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },

    // 05 - Waste processing, storage and disposal
    { code: '05.0100', name: 'Procurement of waste management equipment', level: 2, parentCode: '05', isInventoryDependent: false, isWasteManagement: true, contingencyDefault: 10 },
    { code: '05.0200', name: 'HLW processing, storage and disposal', level: 2, parentCode: '05', isInventoryDependent: true, isWasteManagement: true, contingencyDefault: 15 },
    { code: '05.0300', name: 'ILW processing, storage and disposal', level: 2, parentCode: '05', isInventoryDependent: true, isWasteManagement: true, contingencyDefault: 15 },
    { code: '05.0400', name: 'LLW processing, storage and disposal', level: 2, parentCode: '05', isInventoryDependent: true, isWasteManagement: true, contingencyDefault: 15 },
    { code: '05.0500', name: 'VLLW processing, storage and disposal', level: 2, parentCode: '05', isInventoryDependent: true, isWasteManagement: true, contingencyDefault: 15 },
    { code: '05.0600', name: 'Exempt waste processing and disposal', level: 2, parentCode: '05', isInventoryDependent: true, isWasteManagement: true, contingencyDefault: 15 },
    { code: '05.0700', name: 'HLW management ongoing', level: 2, parentCode: '05', isInventoryDependent: true, isWasteManagement: true, contingencyDefault: 15 },
    { code: '05.0800', name: 'ILW management ongoing', level: 2, parentCode: '05', isInventoryDependent: true, isWasteManagement: true, contingencyDefault: 15 },
    { code: '05.0900', name: 'LLW management ongoing', level: 2, parentCode: '05', isInventoryDependent: true, isWasteManagement: true, contingencyDefault: 15 },
    { code: '05.1000', name: 'VLLW management ongoing', level: 2, parentCode: '05', isInventoryDependent: true, isWasteManagement: true, contingencyDefault: 15 },
    { code: '05.1100', name: 'Short-lived waste management', level: 2, parentCode: '05', isInventoryDependent: true, isWasteManagement: true, contingencyDefault: 15 },
    { code: '05.1200', name: 'Exempt waste management ongoing', level: 2, parentCode: '05', isInventoryDependent: true, isWasteManagement: true, contingencyDefault: 15 },
    { code: '05.1300', name: 'Non-radioactive waste processing', level: 2, parentCode: '05', isInventoryDependent: true, isWasteManagement: true, contingencyDefault: 10 },

    // 06 - Site infrastructure
    { code: '06.0100', name: 'Site security and access control', level: 2, parentCode: '06', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '06.0200', name: 'Site operation and maintenance', level: 2, parentCode: '06', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '06.0300', name: 'Operation of support systems', level: 2, parentCode: '06', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '06.0400', name: 'Radiation and environmental safety monitoring', level: 2, parentCode: '06', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },

    // 07 - Conventional dismantling
    { code: '07.0100', name: 'Procurement of demolition equipment', level: 2, parentCode: '07', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '07.0200', name: 'Building dismantling and demolition', level: 2, parentCode: '07', isInventoryDependent: true, isWasteManagement: false, contingencyDefault: 15 },
    { code: '07.0300', name: 'Final site survey', level: 2, parentCode: '07', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '07.0400', name: 'Landscaping and site restoration', level: 2, parentCode: '07', isInventoryDependent: true, isWasteManagement: false, contingencyDefault: 15 },

    // 08 - Project management
    { code: '08.0100', name: 'Mobilisation and preparatory work', level: 2, parentCode: '08', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '08.0200', name: 'Project management', level: 2, parentCode: '08', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '08.0300', name: 'Engineering support', level: 2, parentCode: '08', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '08.0400', name: 'Information, documentation and data management', level: 2, parentCode: '08', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '08.0500', name: 'Quality assurance and control', level: 2, parentCode: '08', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '08.0600', name: 'Health, safety and environmental protection', level: 2, parentCode: '08', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '08.0700', name: 'Emergency services and nuclear security', level: 2, parentCode: '08', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '08.0800', name: 'Regulatory and institutional interface', level: 2, parentCode: '08', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '08.0900', name: 'Public relations', level: 2, parentCode: '08', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },

    // 09 - R&D
    { code: '09.0100', name: 'Equipment development', level: 2, parentCode: '09', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 20 },
    { code: '09.0200', name: 'Technique development', level: 2, parentCode: '09', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 20 },
    { code: '09.0300', name: 'Analyses and studies', level: 2, parentCode: '09', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 20 },

    // 10 - Fuel and nuclear material
    { code: '10.0100', name: 'Removal and transfer of fuel from facility', level: 2, parentCode: '10', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 15 },
    { code: '10.0200', name: 'Fuel pool operation', level: 2, parentCode: '10', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 15 },
    { code: '10.0300', name: 'On-site fuel conditioning and storage', level: 2, parentCode: '10', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 15 },
    { code: '10.0400', name: 'Fuel disposal', level: 2, parentCode: '10', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 15 },
    { code: '10.0500', name: 'Management of other nuclear materials', level: 2, parentCode: '10', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 15 },

    // 11 - Miscellaneous
    { code: '11.0100', name: 'Owner costs', level: 2, parentCode: '11', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '11.0200', name: 'Taxes', level: 2, parentCode: '11', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '11.0300', name: 'Insurances', level: 2, parentCode: '11', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '11.0400', name: 'Interest on funds', level: 2, parentCode: '11', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '11.0500', name: 'Other miscellaneous', level: 2, parentCode: '11', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
];

// Level 3 items - summary of key detailed activities
export const ISDC_L3: ISDCItem[] = [
    // 01.0100 - Decommissioning planning
    { code: '01.0101', name: 'Strategic planning', level: 3, parentCode: '01.0100', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '01.0102', name: 'Preliminary planning', level: 3, parentCode: '01.0100', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '01.0103', name: 'Final planning', level: 3, parentCode: '01.0100', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },

    // 01.0200 - Facility characterisation  
    { code: '01.0201', name: 'Detailed facility characterisation', level: 3, parentCode: '01.0200', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '01.0202', name: 'Hazardous-material surveys and analyses', level: 3, parentCode: '01.0200', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '01.0203', name: 'Establishing a facility inventory database', level: 3, parentCode: '01.0200', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },

    // 04.0300 - Pre-dismantling decontamination
    { code: '04.0301', name: 'Drainage of remaining systems', level: 3, parentCode: '04.0300', isInventoryDependent: true, isWasteManagement: false, contingencyDefault: 20 },
    { code: '04.0302', name: 'Removal of sludge and products from remaining systems', level: 3, parentCode: '04.0300', isInventoryDependent: true, isWasteManagement: false, contingencyDefault: 20 },
    { code: '04.0303', name: 'Decontamination of remaining systems', level: 3, parentCode: '04.0300', isInventoryDependent: true, isWasteManagement: false, contingencyDefault: 20 },
    { code: '04.0304', name: 'Decontamination of areas in buildings', level: 3, parentCode: '04.0300', isInventoryDependent: true, isWasteManagement: false, contingencyDefault: 20 },

    // 04.0500 - Dismantling main process systems
    { code: '04.0501', name: 'Dismantling of reactor internals', level: 3, parentCode: '04.0500', isInventoryDependent: true, isWasteManagement: false, contingencyDefault: 25 },
    { code: '04.0502', name: 'Dismantling of reactor vessel and core components', level: 3, parentCode: '04.0500', isInventoryDependent: true, isWasteManagement: false, contingencyDefault: 25 },
    { code: '04.0503', name: 'Dismantling of other primary loop components', level: 3, parentCode: '04.0500', isInventoryDependent: true, isWasteManagement: false, contingencyDefault: 25 },
    { code: '04.0504', name: 'Dismantling of main process systems in fuel cycle facilities', level: 3, parentCode: '04.0500', isInventoryDependent: true, isWasteManagement: false, contingencyDefault: 25 },
    { code: '04.0505', name: 'Dismantling of main process systems in other facilities', level: 3, parentCode: '04.0500', isInventoryDependent: true, isWasteManagement: false, contingencyDefault: 25 },
    { code: '04.0506', name: 'Dismantling of external thermal/biological shields', level: 3, parentCode: '04.0500', isInventoryDependent: true, isWasteManagement: false, contingencyDefault: 25 },

    // 04.0600 - Dismantling other systems
    { code: '04.0601', name: 'Dismantling of auxiliary systems', level: 3, parentCode: '04.0600', isInventoryDependent: true, isWasteManagement: false, contingencyDefault: 20 },
    { code: '04.0602', name: 'Dismantling of electrical systems', level: 3, parentCode: '04.0600', isInventoryDependent: true, isWasteManagement: false, contingencyDefault: 20 },
    { code: '04.0603', name: 'Dismantling of instrumentation and control systems', level: 3, parentCode: '04.0600', isInventoryDependent: true, isWasteManagement: false, contingencyDefault: 20 },
    { code: '04.0604', name: 'Dismantling of ventilation and filtering systems', level: 3, parentCode: '04.0600', isInventoryDependent: true, isWasteManagement: false, contingencyDefault: 20 },

    // 05.0300 - ILW processing
    { code: '05.0301', name: 'ILW retrieval, handling and characterisation', level: 3, parentCode: '05.0300', isInventoryDependent: true, isWasteManagement: true, contingencyDefault: 15 },
    { code: '05.0302', name: 'ILW treatment and conditioning', level: 3, parentCode: '05.0300', isInventoryDependent: true, isWasteManagement: true, contingencyDefault: 15 },
    { code: '05.0303', name: 'ILW storage', level: 3, parentCode: '05.0300', isInventoryDependent: true, isWasteManagement: true, contingencyDefault: 15 },
    { code: '05.0304', name: 'ILW disposal', level: 3, parentCode: '05.0300', isInventoryDependent: true, isWasteManagement: true, contingencyDefault: 15 },

    // 05.0400 - LLW processing
    { code: '05.0401', name: 'LLW retrieval, handling and characterisation', level: 3, parentCode: '05.0400', isInventoryDependent: true, isWasteManagement: true, contingencyDefault: 15 },
    { code: '05.0402', name: 'LLW treatment and conditioning', level: 3, parentCode: '05.0400', isInventoryDependent: true, isWasteManagement: true, contingencyDefault: 15 },
    { code: '05.0403', name: 'LLW storage', level: 3, parentCode: '05.0400', isInventoryDependent: true, isWasteManagement: true, contingencyDefault: 15 },
    { code: '05.0404', name: 'LLW disposal', level: 3, parentCode: '05.0400', isInventoryDependent: true, isWasteManagement: true, contingencyDefault: 15 },

    // 05.1300 - Non-radioactive waste
    { code: '05.1301', name: 'Recycled concrete processing', level: 3, parentCode: '05.1300', isInventoryDependent: true, isWasteManagement: true, contingencyDefault: 10 },
    { code: '05.1302', name: 'Recycled metals processing', level: 3, parentCode: '05.1300', isInventoryDependent: true, isWasteManagement: true, contingencyDefault: 10 },
    { code: '05.1303', name: 'Recycled materials disposal', level: 3, parentCode: '05.1300', isInventoryDependent: true, isWasteManagement: true, contingencyDefault: 10 },
    { code: '05.1304', name: 'Hazardous waste processing', level: 3, parentCode: '05.1300', isInventoryDependent: true, isWasteManagement: true, contingencyDefault: 15 },
    { code: '05.1305', name: 'Hazardous waste disposal', level: 3, parentCode: '05.1300', isInventoryDependent: true, isWasteManagement: true, contingencyDefault: 15 },
    { code: '05.1306', name: 'Conventional waste processing', level: 3, parentCode: '05.1300', isInventoryDependent: true, isWasteManagement: true, contingencyDefault: 10 },
    { code: '05.1307', name: 'Conventional waste disposal', level: 3, parentCode: '05.1300', isInventoryDependent: true, isWasteManagement: true, contingencyDefault: 10 },

    // 07.0200 - Building demolition
    { code: '07.0201', name: 'Conventional building dismantling', level: 3, parentCode: '07.0200', isInventoryDependent: true, isWasteManagement: false, contingencyDefault: 15 },
    { code: '07.0202', name: 'Building structure demolition', level: 3, parentCode: '07.0200', isInventoryDependent: true, isWasteManagement: false, contingencyDefault: 15 },
    { code: '07.0203', name: 'Foundation removal', level: 3, parentCode: '07.0200', isInventoryDependent: true, isWasteManagement: false, contingencyDefault: 15 },

    // 08.0200 - Project management
    { code: '08.0201', name: 'Overall management', level: 3, parentCode: '08.0200', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '08.0202', name: 'Schedule and cost management', level: 3, parentCode: '08.0200', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '08.0203', name: 'Contractor management', level: 3, parentCode: '08.0200', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
    { code: '08.0204', name: 'Stakeholder coordination', level: 3, parentCode: '08.0200', isInventoryDependent: false, isWasteManagement: false, contingencyDefault: 10 },
];

// Combined all ISDC items
export const ALL_ISDC_ITEMS: ISDCItem[] = [...ISDC_L1, ...ISDC_L2, ...ISDC_L3];

// Helper functions
export function getISDCLevel(code: string): 1 | 2 | 3 {
    const parts = code.split('.');
    if (parts.length === 1 && code.length === 2) return 1;
    if (parts.length === 2 && parts[1].length === 4) return 2;
    return 3;
}

export function getParentCode(code: string): string | null {
    if (code.length === 2) return null; // L1 has no parent
    if (code.includes('.')) {
        const parts = code.split('.');
        if (parts[1].length === 4) return parts[0]; // L2's parent is L1
        // L3's parent is L2
        return `${parts[0]}.${parts[1].substring(0, 4)}`;
    }
    return null;
}

export function getChildrenItems(parentCode: string, items: ISDCItem[]): ISDCItem[] {
    return items.filter(item => item.parentCode === parentCode);
}

export function getItemByCode(code: string): ISDCItem | undefined {
    return ALL_ISDC_ITEMS.find(item => item.code === code);
}
