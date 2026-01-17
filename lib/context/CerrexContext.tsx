// Global data context for CERREX Web
// Manages all application state (Lists, Inventory, ISDC, etc.)

'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// ============================================================================
// TYPE EXPORTS - All interfaces exported for use in other modules
// ============================================================================

// Types
export interface Currency {
    id: string
    code: string
    name: string
    symbol: string
    exchangeRate: number
    isReference: boolean
}

export interface DDCategory {
    id: string
    code: string
    name: string
    category: string
    description?: string
}

export interface WMCategory {
    id: string
    iaeaClass: string
    name: string
    minActivity: number
    maxActivity: number
}

export interface TechSystem {
    id: string
    techId: string
    name: string
}

export interface Profession {
    id: string
    name: string
    abbr: string
    hourRateOwner: number
    hourRateContractor: number
}

export interface UnitFactor {
    id: string
    category: string
    type: 'd_and_d' | 'waste_management'
    manpowerUF: number
    investmentUF: number
    expensesUF: number
    unit: string
}

export interface Radionuclide {
    id: string
    symbol: string
    halfLifeYears: number
    description?: string
}

export interface InventoryItem {
    id: string
    description: string
    ddCategory: string // Links to DDCategory.code for UF lookup
    quantity: number
    unit: string
    location?: string
    building?: string
    floor?: string

    // ISDC codes (Excel columns D, E, F)
    isdcL3Code?: string  // e.g. "04.02.01"
    isdcL2Code?: string  // e.g. "04.02"
    isdcL1Code?: string  // e.g. "04"

    // Work Difficulty Factors (Excel columns AS-AY) - 7 flags
    wdfEnabled: boolean           // AW: Enable/disable WDF
    wdf_F1_Scaffolding: number    // AS: Scaffolding/elevation (0 or 1)
    wdf_F2_ConfinedSpace: number  // AT: Confined space (0 or 1)
    wdf_F3_Respiratory: number    // AU: Respiratory protection (0 or 1)
    wdf_F4_Protective: number     // AV: Protective clothing (0 or 1)
    wdf_F5_Shielding: number      // AW: Radiation shielding (0 or 1)
    wdf_F6_Remote: number         // AX: Remote handling (0 or 1)
    wdf_F7_UserDefined: number    // AY: User-defined (0 or 1)

    // Contractor vs Owner flag (Excel column I)
    isContractor: boolean

    // Waste partition (must sum to 100%)
    wastePartitionILW: number
    wastePartitionLLW: number
    wastePartitionVLLW: number
    wastePartitionEW: number
    wastePartitionNonRad: number

    // Radionuclide component flags (Excel columns H, J)
    hasInventoryComponent: boolean  // H12
    hasRadionuclideComponent: boolean // J12

    // Additional investment/expenses (Excel columns R, T)
    additionalInvestment?: number
    additionalExpenses?: number

    // Contingency rate (Excel column Q) - percentage
    contingencyRate: number  // Default 20%

    // Calculated fields (auto-computed, not stored)
    calculatedManpower?: number
    calculatedLabourCost?: number
    calculatedInvestment?: number
    calculatedExpenses?: number
    calculatedContingency?: number
    calculatedTotal?: number
}

export interface CerrexData {
    projectName: string
    projectDate: string

    // Global calculation settings (from Excel General sheet)
    referenceCurrency: string        // $J$6
    currencyInThousands: boolean     // $C$7
    calculationMode: number          // $N$3 (1, 2, or 3)
    wdfGlobalMultiplier: number      // $O$3 (default 1.5)
    contingencyEnabled: boolean      // $Q$10

    // Expenses percentages (Excel AC$2, AD$2)
    expensesPercentageContractor: number  // Default 15%
    expensesPercentageOwner: number       // Default 12%

    // Lists sheet data
    currencies: Currency[]
    ddCategories: DDCategory[]
    wmCategories: WMCategory[]
    techSystems: TechSystem[]
    professions: Profession[]

    // UF sheet data
    unitFactors: UnitFactor[]

    // RND sheet data
    radionuclides: Radionuclide[]

    // INV sheet data
    inventoryItems: InventoryItem[]
}

interface CerrexContextType {
    data: CerrexData
    updateData: (updates: Partial<CerrexData>) => void

    // Currency operations
    addCurrency: (currency: Omit<Currency, 'id'>) => void
    updateCurrency: (id: string, currency: Partial<Currency>) => void
    deleteCurrency: (id: string) => void

    // DD Category operations
    addDDCategory: (category: Omit<DDCategory, 'id'>) => void
    updateDDCategory: (id: string, category: Partial<DDCategory>) => void
    deleteDDCategory: (id: string) => void

    // WM Category operations
    addWMCategory: (category: Omit<WMCategory, 'id'>) => void
    updateWMCategory: (id: string, category: Partial<WMCategory>) => void
    deleteWMCategory: (id: string) => void

    // Tech System operations
    addTechSystem: (system: Omit<TechSystem, 'id'>) => void
    updateTechSystem: (id: string, system: Partial<TechSystem>) => void
    deleteTechSystem: (id: string) => void

    // Profession operations
    addProfession: (profession: Omit<Profession, 'id'>) => void
    updateProfession: (id: string, profession: Partial<Profession>) => void
    deleteProfession: (id: string) => void

    // Unit Factor operations
    addUnitFactor: (factor: Omit<UnitFactor, 'id'>) => void
    updateUnitFactor: (id: string, factor: Partial<UnitFactor>) => void
    deleteUnitFactor: (id: string) => void

    // Radionuclide operations
    addRadionuclide: (radionuclide: Omit<Radionuclide, 'id'>) => void
    updateRadionuclide: (id: string, radionuclide: Partial<Radionuclide>) => void
    deleteRadionuclide: (id: string) => void

    // Inventory operations
    addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void
    updateInventoryItem: (id: string, item: Partial<InventoryItem>) => void
    deleteInventoryItem: (id: string) => void

    // Utility
    saveToLocalStorage: () => void
    loadFromLocalStorage: () => void
    resetToDefaults: () => void
}

// Default/sample data
const getDefaultData = (): CerrexData => ({
    projectName: 'RR-2024',
    projectDate: new Date().toISOString(),

    // Global settings (matching Excel)
    referenceCurrency: 'USD',
    currencyInThousands: true,  // Display in thousands
    calculationMode: 1,         // Mode 1 (detailed)
    wdfGlobalMultiplier: 1.5,   // 1.5x multiplier when WDF enabled
    contingencyEnabled: true,   // Enable contingency calculations
    expensesPercentageContractor: 15,  // 15% of labour
    expensesPercentageOwner: 12,       // 12% of labour

    currencies: [
        { id: '1', code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 1.0, isReference: true },
        { id: '2', code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 0.92, isReference: false },
        { id: '3', code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', exchangeRate: 15750, isReference: false },
    ],

    ddCategories: [
        { id: '1', code: 'PIPE-SS', name: 'Stainless Steel Piping', category: 'Dismantling' },
        { id: '2', code: 'CONC-ORD', name: 'Ordinary Concrete', category: 'Demolition' },
        { id: '3', code: 'EQUIP-PUMP', name: 'Pumps', category: 'Dismantling' },
    ],

    wmCategories: [
        { id: '1', iaeaClass: 'ILW', name: 'Intermediate Level Waste', minActivity: 1e6, maxActivity: 1e12 },
        { id: '2', iaeaClass: 'LLW', name: 'Low Level Waste', minActivity: 1e3, maxActivity: 1e6 },
        { id: '3', iaeaClass: 'VLLW', name: 'Very Low Level Waste', minActivity: 100, maxActivity: 1e3 },
        { id: '4', iaeaClass: 'EW', name: 'Exempt Waste', minActivity: 0, maxActivity: 100 },
    ],

    techSystems: [
        { id: '1', techId: 'BLS', name: 'Building structure, architecture' },
        { id: '2', techId: 'BSH', name: 'Biological shield' },
        { id: '3', techId: 'CVS', name: 'Confinement and ventilation system' },
        { id: '4', techId: 'RCF', name: 'Reactor core and fuel' },
    ],

    professions: [
        { id: '1', name: 'Labourer', abbr: 'LBR', hourRateOwner: 25.00, hourRateContractor: 35.00 },
        { id: '2', name: 'Skilled Worker', abbr: 'SKW', hourRateOwner: 40.00, hourRateContractor: 55.00 },
        { id: '3', name: 'Technician', abbr: 'TCN', hourRateOwner: 50.00, hourRateContractor: 70.00 },
        { id: '4', name: 'Engineer', abbr: 'ENG', hourRateOwner: 75.00, hourRateContractor: 100.00 },
        { id: '5', name: 'Manager', abbr: 'MNG', hourRateOwner: 100.00, hourRateContractor: 150.00 },
    ],

    unitFactors: [
        // D&D Category Unit Factors (matching Excel UF sheet structure)
        {
            id: '1',
            category: 'PIPE-SS',
            type: 'd_and_d',
            manpowerUF: 5.2,      // 5.2 man-hours per ton
            investmentUF: 150,    // $150 per ton
            expensesUF: 50,       // $50 per ton
            unit: 'ton'
        },
        {
            id: '2',
            category: 'CONC-ORD',
            type: 'd_and_d',
            manpowerUF: 2.1,      // 2.1 man-hours per m³
            investmentUF: 80,     // $80 per m³
            expensesUF: 30,       // $30 per m³
            unit: 'm³'
        },
        {
            id: '3',
            category: 'EQUIP-PUMP',
            type: 'd_and_d',
            manpowerUF: 8.5,      // 8.5 man-hours per item
            investmentUF: 500,    // $500 per item
            expensesUF: 120,      // $120 per item
            unit: 'item'
        },
    ],
    radionuclides: [
        // Sample radionuclides with half-lives (matching Excel RND sheet)
        { id: '1', symbol: 'Co-60', halfLifeYears: 5.27, description: 'Cobalt-60 (common activation product)' },
        { id: '2', symbol: 'Cs-137', halfLifeYears: 30.17, description: 'Cesium-137 (fission product)' },
        { id: '3', symbol: 'Sr-90', halfLifeYears: 28.79, description: 'Strontium-90 (fission product)' },
    ],
    inventoryItems: [
        // Sample inventory items for calculation demonstration
        {
            id: '1',
            description: 'Primary Cooling Pipes - Stainless Steel',
            ddCategory: 'PIPE-SS',
            quantity: 12.5,
            unit: 'ton',
            location: 'Reactor Hall',
            building: 'RH-01',
            floor: 'Ground',
            isdcL1Code: '04',
            isdcL2Code: '04.02',
            isdcL3Code: '04.02.01',
            wdfEnabled: true,
            wdf_F1_Scaffolding: 1,
            wdf_F2_ConfinedSpace: 0,
            wdf_F3_Respiratory: 1,
            wdf_F4_Protective: 1,
            wdf_F5_Shielding: 0,
            wdf_F6_Remote: 0,
            wdf_F7_UserDefined: 0,
            isContractor: false,
            wastePartitionILW: 0.1,
            wastePartitionLLW: 0.3,
            wastePartitionVLLW: 0.4,
            wastePartitionEW: 0.2,
            wastePartitionNonRad: 0,
            hasInventoryComponent: false,
            hasRadionuclideComponent: false,
            contingencyRate: 20
        },
        {
            id: '2',
            description: 'Biological Shield Concrete',
            ddCategory: 'CONC-ORD',
            quantity: 85,
            unit: 'm³',
            location: 'Reactor Core',
            building: 'RH-01',
            floor: 'Basement',
            isdcL1Code: '04',
            isdcL2Code: '04.03',
            isdcL3Code: '04.03.02',
            wdfEnabled: true,
            wdf_F1_Scaffolding: 0,
            wdf_F2_ConfinedSpace: 1,
            wdf_F3_Respiratory: 1,
            wdf_F4_Protective: 1,
            wdf_F5_Shielding: 1,
            wdf_F6_Remote: 0,
            wdf_F7_UserDefined: 0,
            isContractor: true,
            wastePartitionILW: 0.05,
            wastePartitionLLW: 0.15,
            wastePartitionVLLW: 0.3,
            wastePartitionEW: 0.3,
            wastePartitionNonRad: 0.2,
            hasInventoryComponent: false,
            hasRadionuclideComponent: false,
            contingencyRate: 25
        },
        {
            id: '3',
            description: 'Primary Coolant Pumps',
            ddCategory: 'EQUIP-PUMP',
            quantity: 4,
            unit: 'item',
            location: 'Pump Room',
            building: 'RH-01',
            floor: 'Ground',
            isdcL1Code: '04',
            isdcL2Code: '04.02',
            isdcL3Code: '04.02.03',
            wdfEnabled: false,
            wdf_F1_Scaffolding: 0,
            wdf_F2_ConfinedSpace: 0,
            wdf_F3_Respiratory: 0,
            wdf_F4_Protective: 0,
            wdf_F5_Shielding: 0,
            wdf_F6_Remote: 0,
            wdf_F7_UserDefined: 0,
            isContractor: false,
            wastePartitionILW: 0,
            wastePartitionLLW: 0.2,
            wastePartitionVLLW: 0.4,
            wastePartitionEW: 0.3,
            wastePartitionNonRad: 0.1,
            hasInventoryComponent: false,
            hasRadionuclideComponent: false,
            contingencyRate: 15
        },
        {
            id: '4',
            description: 'Secondary Piping System',
            ddCategory: 'PIPE-SS',
            quantity: 8.2,
            unit: 'ton',
            location: 'Turbine Hall',
            building: 'TH-01',
            floor: 'Ground',
            isdcL1Code: '07',
            isdcL2Code: '07.01',
            isdcL3Code: '07.01.01',
            wdfEnabled: false,
            wdf_F1_Scaffolding: 0,
            wdf_F2_ConfinedSpace: 0,
            wdf_F3_Respiratory: 0,
            wdf_F4_Protective: 0,
            wdf_F5_Shielding: 0,
            wdf_F6_Remote: 0,
            wdf_F7_UserDefined: 0,
            isContractor: true,
            wastePartitionILW: 0,
            wastePartitionLLW: 0,
            wastePartitionVLLW: 0.1,
            wastePartitionEW: 0.4,
            wastePartitionNonRad: 0.5,
            hasInventoryComponent: false,
            hasRadionuclideComponent: false,
            contingencyRate: 15
        }
    ],
})


const CerrexContext = createContext<CerrexContextType | undefined>(undefined)

export function CerrexProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<CerrexData>(getDefaultData())

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('cerrex-data')
        if (stored) {
            try {
                setData(JSON.parse(stored))
            } catch (e) {
                console.error('Failed to load from localStorage:', e)
            }
        }
    }, [])

    // Auto-save to localStorage on data change
    useEffect(() => {
        localStorage.setItem('cerrex-data', JSON.stringify(data))
    }, [data])

    const updateData = (updates: Partial<CerrexData>) => {
        setData(prev => ({ ...prev, ...updates }))
    }

    // Helper to generate ID
    const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2)

    // Currency operations
    const addCurrency = (currency: Omit<Currency, 'id'>) => {
        setData(prev => ({
            ...prev,
            currencies: [...prev.currencies, { ...currency, id: generateId() }]
        }))
    }

    const updateCurrency = (id: string, updates: Partial<Currency>) => {
        setData(prev => ({
            ...prev,
            currencies: prev.currencies.map(c => c.id === id ? { ...c, ...updates } : c)
        }))
    }

    const deleteCurrency = (id: string) => {
        setData(prev => ({
            ...prev,
            currencies: prev.currencies.filter(c => c.id !== id)
        }))
    }

    // DD Category operations
    const addDDCategory = (category: Omit<DDCategory, 'id'>) => {
        setData(prev => ({
            ...prev,
            ddCategories: [...prev.ddCategories, { ...category, id: generateId() }]
        }))
    }

    const updateDDCategory = (id: string, updates: Partial<DDCategory>) => {
        setData(prev => ({
            ...prev,
            ddCategories: prev.ddCategories.map(c => c.id === id ? { ...c, ...updates } : c)
        }))
    }

    const deleteDDCategory = (id: string) => {
        setData(prev => ({
            ...prev,
            ddCategories: prev.ddCategories.filter(c => c.id !== id)
        }))
    }

    // WM Category operations
    const addWMCategory = (category: Omit<WMCategory, 'id'>) => {
        setData(prev => ({
            ...prev,
            wmCategories: [...prev.wmCategories, { ...category, id: generateId() }]
        }))
    }

    const updateWMCategory = (id: string, updates: Partial<WMCategory>) => {
        setData(prev => ({
            ...prev,
            wmCategories: prev.wmCategories.map(c => c.id === id ? { ...c, ...updates } : c)
        }))
    }

    const deleteWMCategory = (id: string) => {
        setData(prev => ({
            ...prev,
            wmCategories: prev.wmCategories.filter(c => c.id !== id)
        }))
    }

    // Tech System operations
    const addTechSystem = (system: Omit<TechSystem, 'id'>) => {
        setData(prev => ({
            ...prev,
            techSystems: [...prev.techSystems, { ...system, id: generateId() }]
        }))
    }

    const updateTechSystem = (id: string, updates: Partial<TechSystem>) => {
        setData(prev => ({
            ...prev,
            techSystems: prev.techSystems.map(s => s.id === id ? { ...s, ...updates } : s)
        }))
    }

    const deleteTechSystem = (id: string) => {
        setData(prev => ({
            ...prev,
            techSystems: prev.techSystems.filter(s => s.id !== id)
        }))
    }

    // Profession operations
    const addProfession = (profession: Omit<Profession, 'id'>) => {
        setData(prev => ({
            ...prev,
            professions: [...prev.professions, { ...profession, id: generateId() }]
        }))
    }

    const updateProfession = (id: string, updates: Partial<Profession>) => {
        setData(prev => ({
            ...prev,
            professions: prev.professions.map(p => p.id === id ? { ...p, ...updates } : p)
        }))
    }

    const deleteProfession = (id: string) => {
        setData(prev => ({
            ...prev,
            professions: prev.professions.filter(p => p.id !== id)
        }))
    }

    // Unit Factor operations
    const addUnitFactor = (factor: Omit<UnitFactor, 'id'>) => {
        setData(prev => ({
            ...prev,
            unitFactors: [...prev.unitFactors, { ...factor, id: generateId() }]
        }))
    }

    const updateUnitFactor = (id: string, updates: Partial<UnitFactor>) => {
        setData(prev => ({
            ...prev,
            unitFactors: prev.unitFactors.map(f => f.id === id ? { ...f, ...updates } : f)
        }))
    }

    const deleteUnitFactor = (id: string) => {
        setData(prev => ({
            ...prev,
            unitFactors: prev.unitFactors.filter(f => f.id !== id)
        }))
    }

    // Radionuclide operations
    const addRadionuclide = (radionuclide: Omit<Radionuclide, 'id'>) => {
        setData(prev => ({
            ...prev,
            radionuclides: [...prev.radionuclides, { ...radionuclide, id: generateId() }]
        }))
    }

    const updateRadionuclide = (id: string, updates: Partial<Radionuclide>) => {
        setData(prev => ({
            ...prev,
            radionuclides: prev.radionuclides.map(r => r.id === id ? { ...r, ...updates } : r)
        }))
    }

    const deleteRadionuclide = (id: string) => {
        setData(prev => ({
            ...prev,
            radionuclides: prev.radionuclides.filter(r => r.id !== id)
        }))
    }

    // Inventory operations
    const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
        setData(prev => ({
            ...prev,
            inventoryItems: [...prev.inventoryItems, { ...item, id: generateId() }]
        }))
    }

    const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
        setData(prev => ({
            ...prev,
            inventoryItems: prev.inventoryItems.map(i => i.id === id ? { ...i, ...updates } : i)
        }))
    }

    const deleteInventoryItem = (id: string) => {
        setData(prev => ({
            ...prev,
            inventoryItems: prev.inventoryItems.filter(i => i.id !== id)
        }))
    }

    // Utility functions
    const saveToLocalStorage = () => {
        localStorage.setItem('cerrex-data', JSON.stringify(data))
    }

    const loadFromLocalStorage = () => {
        const stored = localStorage.getItem('cerrex-data')
        if (stored) {
            setData(JSON.parse(stored))
        }
    }

    const resetToDefaults = () => {
        setData(getDefaultData())
    }

    const value: CerrexContextType = {
        data,
        updateData,
        addCurrency,
        updateCurrency,
        deleteCurrency,
        addDDCategory,
        updateDDCategory,
        deleteDDCategory,
        addWMCategory,
        updateWMCategory,
        deleteWMCategory,
        addTechSystem,
        updateTechSystem,
        deleteTechSystem,
        addProfession,
        updateProfession,
        deleteProfession,
        addUnitFactor,
        updateUnitFactor,
        deleteUnitFactor,
        addRadionuclide,
        updateRadionuclide,
        deleteRadionuclide,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        saveToLocalStorage,
        loadFromLocalStorage,
        resetToDefaults,
    }

    return <CerrexContext.Provider value={value}>{children}</CerrexContext.Provider>
}

export function useCerrex() {
    const context = useContext(CerrexContext)
    if (!context) {
        throw new Error('useCerrex must be used within CerrexProvider')
    }
    return context
}
