/**
 * React Hook for CERREX Calculations
 * Connects calculation engine to Context data
 * Auto-calculates costs for inventory items
 */

'use client'

import { useMemo } from 'react'
import { useCerrex, InventoryItem, UnitFactor } from '../context/CerrexContext'
import {
    vlookup,
    calculateInventoryItemCost,
    InventoryItemCost,
    LabourCostParams,
    InvestmentCostParams,
    ExpensesCostParams
} from './cerrex-formulas'

/**
 * Hook to calculate costs for a single inventory item
 * Matches Excel ISDC formulas exactly
 */
export function useInventoryItemCalculation(item: InventoryItem): InventoryItemCost | null {
    const { data } = useCerrex()

    return useMemo(() => {
        if (!item || !item.ddCategory || item.quantity === 0) {
            return null
        }

        // Lookup unit factors for this D&D category (VLOOKUP equivalent)
        const unitFactor = vlookup<UnitFactor>(
            item.ddCategory,
            data.unitFactors,
            'category',
            'category'
        )

        if (!unitFactor) {
            console.warn(`No unit factor found for category: ${item.ddCategory}`)
            return null
        }

        // Calculate total WDF (sum of all F1-F7 flags)
        const totalWDF =
            item.wdf_F1_Scaffolding +
            item.wdf_F2_ConfinedSpace +
            item.wdf_F3_Respiratory +
            item.wdf_F4_Protective +
            item.wdf_F5_Shielding +
            item.wdf_F6_Remote +
            item.wdf_F7_UserDefined

        const professionHours = data.professions.map(() => item.quantity) // Simplified: same hours for all
        const contractorRates = data.professions.map(p => p.hourRateContractor)
        const ownerRates = data.professions.map(p => p.hourRateOwner)

        // Build calculation parameters matching Excel formulas
        const labourParams: LabourCostParams = {
            quantity: item.quantity,
            manpowerUF: unitFactor.manpowerUF,
            professionHours,
            wdfEnabled: item.wdfEnabled,
            wdfMultiplier: data.wdfGlobalMultiplier,
            hasInventoryComponent: item.hasInventoryComponent || false,
            hasRadionuclideComponent: item.hasRadionuclideComponent || false,
            calculationMode: data.calculationMode,
            isContractor: item.isContractor,
            contractorRates,
            ownerRates,
            currencyInThousands: data.currencyInThousands
        }

        const investmentParams: InvestmentCostParams = {
            investmentUF: unitFactor.investmentUF,
            quantity: item.quantity,
            wdfEnabled: item.wdfEnabled,
            wdfMultiplier: data.wdfGlobalMultiplier,
            additionalInvestment: item.additionalInvestment || 0,
            currencyInThousands: data.currencyInThousands,
            hasInventoryComponent: item.hasInventoryComponent || false
        }

        const expensesParams: ExpensesCostParams = {
            ...labourParams,
            expensesUF: unitFactor.expensesUF,
            additionalExpenses: item.additionalExpenses || 0,
            expensesPercentage: item.isContractor
                ? data.expensesPercentageContractor
                : data.expensesPercentageOwner
        }

        const contingencyParams = {
            contingencyEnabled: data.contingencyEnabled,
            contingencyRate: item.contingencyRate
        }

        // Calculate using exact Excel formulas
        try {
            const costs = calculateInventoryItemCost(
                labourParams,
                investmentParams,
                expensesParams,
                contingencyParams
            )

            return costs
        } catch (error) {
            console.error('Calculation error for item:', item.id, error)
            return null
        }
    }, [item, data])
}

/**
 * Hook to calculate costs for ALL inventory items
 * Returns array of calculated items
 */
export function useAllInventoryCalculations() {
    const { data } = useCerrex()

    return useMemo(() => {
        return data.inventoryItems.map(item => ({
            item,
            costs: useInventoryItemCalculation(item)
        }))
    }, [data.inventoryItems])
}

/**
 * Hook to get ISDC aggregated totals
 * Aggregates by ISDC Level 1/2/3
 */
export function useISDCAggregation() {
    const { data } = useCerrex()

    return useMemo(() => {
        const items = data.inventoryItems

        // TODO: Implement ISDC L3 → L2 → L1 → L0 aggregation
        // This will sum all calculations by ISDC codes

        return {
            level0Total: 0,
            level1Totals: {},
            level2Totals: {},
            level3Totals: {}
        }
    }, [data.inventoryItems])
}

/**
 * Hook to calculate total project costs
 * Returns L0 grand total
 */
export function useTotalProjectCost() {
    const { data } = useCerrex()

    return useMemo(() => {
        let totalLabour = 0
        let totalInvestment = 0
        let totalExpenses = 0
        let totalContingency = 0

        // Sum all inventory items
        data.inventoryItems.forEach(item => {
            const costs = useInventoryItemCalculation(item)
            if (costs) {
                totalLabour += costs.labourCost
                totalInvestment += costs.investment
                totalExpenses += costs.expenses
                totalContingency += costs.contingency
            }
        })

        return {
            labour: totalLabour,
            investment: totalInvestment,
            expenses: totalExpenses,
            contingency: totalContingency,
            grandTotal: totalLabour + totalInvestment + totalExpenses + totalContingency
        }
    }, [data.inventoryItems])
}
