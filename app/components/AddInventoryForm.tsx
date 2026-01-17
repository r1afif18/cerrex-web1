// Add Inventory Item Form
// Form for adding new inventory items with all Excel-exact fields

'use client'

import { useState } from 'react'
import { Modal, FormField, FormRow, FormSection, buttonStyles, inputStyles, selectStyles } from './Modal'
import { useCerrex, InventoryItem } from '@/lib/context/CerrexContext'

interface AddInventoryFormProps {
    isOpen: boolean
    onClose: () => void
    editItem?: InventoryItem // If provided, we're editing
}

export function AddInventoryForm({ isOpen, onClose, editItem }: AddInventoryFormProps) {
    const { data, addInventoryItem, updateInventoryItem } = useCerrex()
    const isEdit = !!editItem

    // Form state - initialize with editItem values or defaults
    const [formData, setFormData] = useState({
        description: editItem?.description || '',
        ddCategory: editItem?.ddCategory || '',
        quantity: editItem?.quantity || 0,
        unit: editItem?.unit || '',
        location: editItem?.location || '',
        building: editItem?.building || '',
        floor: editItem?.floor || '',
        isdcL1Code: editItem?.isdcL1Code || '04',
        isdcL2Code: editItem?.isdcL2Code || '04.02',
        isdcL3Code: editItem?.isdcL3Code || '04.02.01',
        wdfEnabled: editItem?.wdfEnabled ?? false,
        wdf_F1_Scaffolding: editItem?.wdf_F1_Scaffolding || 0,
        wdf_F2_ConfinedSpace: editItem?.wdf_F2_ConfinedSpace || 0,
        wdf_F3_Respiratory: editItem?.wdf_F3_Respiratory || 0,
        wdf_F4_Protective: editItem?.wdf_F4_Protective || 0,
        wdf_F5_Shielding: editItem?.wdf_F5_Shielding || 0,
        wdf_F6_Remote: editItem?.wdf_F6_Remote || 0,
        wdf_F7_UserDefined: editItem?.wdf_F7_UserDefined || 0,
        isContractor: editItem?.isContractor ?? false,
        wastePartitionILW: editItem?.wastePartitionILW || 0,
        wastePartitionLLW: editItem?.wastePartitionLLW || 0,
        wastePartitionVLLW: editItem?.wastePartitionVLLW || 0,
        wastePartitionEW: editItem?.wastePartitionEW || 0,
        wastePartitionNonRad: editItem?.wastePartitionNonRad || 1,
        contingencyRate: editItem?.contingencyRate || 20
    })

    const [errors, setErrors] = useState<Record<string, string>>({})

    // Calculate waste partition total
    const wasteTotal = formData.wastePartitionILW + formData.wastePartitionLLW +
        formData.wastePartitionVLLW + formData.wastePartitionEW + formData.wastePartitionNonRad

    // Validation
    const validate = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required'
        }
        if (!formData.ddCategory) {
            newErrors.ddCategory = 'D&D Category is required'
        }
        if (formData.quantity <= 0) {
            newErrors.quantity = 'Quantity must be greater than 0'
        }
        if (!formData.unit.trim()) {
            newErrors.unit = 'Unit is required'
        }
        if (Math.abs(wasteTotal - 1) > 0.001) {
            newErrors.wastePartition = 'Waste partitions must sum to 100%'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!validate()) return

        const itemData: Omit<InventoryItem, 'id'> = {
            description: formData.description,
            ddCategory: formData.ddCategory,
            quantity: Number(formData.quantity),
            unit: formData.unit,
            location: formData.location,
            building: formData.building,
            floor: formData.floor,
            isdcL1Code: formData.isdcL1Code,
            isdcL2Code: formData.isdcL2Code,
            isdcL3Code: formData.isdcL3Code,
            wdfEnabled: formData.wdfEnabled,
            wdf_F1_Scaffolding: formData.wdf_F1_Scaffolding,
            wdf_F2_ConfinedSpace: formData.wdf_F2_ConfinedSpace,
            wdf_F3_Respiratory: formData.wdf_F3_Respiratory,
            wdf_F4_Protective: formData.wdf_F4_Protective,
            wdf_F5_Shielding: formData.wdf_F5_Shielding,
            wdf_F6_Remote: formData.wdf_F6_Remote,
            wdf_F7_UserDefined: formData.wdf_F7_UserDefined,
            isContractor: formData.isContractor,
            wastePartitionILW: formData.wastePartitionILW,
            wastePartitionLLW: formData.wastePartitionLLW,
            wastePartitionVLLW: formData.wastePartitionVLLW,
            wastePartitionEW: formData.wastePartitionEW,
            wastePartitionNonRad: formData.wastePartitionNonRad,
            hasInventoryComponent: false,
            hasRadionuclideComponent: false,
            contingencyRate: formData.contingencyRate
        }

        if (isEdit && editItem) {
            updateInventoryItem(editItem.id, itemData)
        } else {
            addInventoryItem(itemData)
        }

        onClose()
    }

    // Get available D&D categories from unit factors
    const availableCategories = data.unitFactors
        .filter(uf => uf.type === 'd_and_d')
        .map(uf => uf.category)

    // ISDC Level 1 options (11 principal activities)
    const isdcL1Options = [
        { code: '01', name: 'Pre-Decommissioning Actions' },
        { code: '02', name: 'Facility Shutdown Activities' },
        { code: '03', name: 'Additional Activities for Safe Enclosure' },
        { code: '04', name: 'Dismantling Activities Inside Controlled Area' },
        { code: '05', name: 'Dismantling Activities Outside Controlled Area' },
        { code: '06', name: 'Waste Processing, Storage and Disposal' },
        { code: '07', name: 'Site Infrastructure and Operation' },
        { code: '08', name: 'Conventional Dismantling, Demolition' },
        { code: '09', name: 'Project Management, Engineering' },
        { code: '10', name: 'Fuel and Nuclear Material' },
        { code: '11', name: 'Miscellaneous Expenditures' },
    ]

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? 'Edit Inventory Item' : 'Add Inventory Item'}
            size="large"
        >
            <form onSubmit={handleSubmit}>
                {/* Basic Information */}
                <FormSection title="Basic Information" />

                <FormField label="Description" required error={errors.description}>
                    <input
                        type="text"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="e.g., Primary Cooling Pipes - Stainless Steel"
                        style={inputStyles}
                    />
                </FormField>

                <FormRow columns={3}>
                    <FormField label="D&D Category" required error={errors.ddCategory}>
                        <select
                            value={formData.ddCategory}
                            onChange={e => setFormData({ ...formData, ddCategory: e.target.value })}
                            style={selectStyles}
                        >
                            <option value="">Select category...</option>
                            {availableCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </FormField>

                    <FormField label="Quantity" required error={errors.quantity}>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.quantity}
                            onChange={e => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                            style={inputStyles}
                        />
                    </FormField>

                    <FormField label="Unit" required error={errors.unit}>
                        <input
                            type="text"
                            value={formData.unit}
                            onChange={e => setFormData({ ...formData, unit: e.target.value })}
                            placeholder="ton, m³, item"
                            style={inputStyles}
                        />
                    </FormField>
                </FormRow>

                <FormRow columns={3}>
                    <FormField label="Location">
                        <input
                            type="text"
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                            placeholder="e.g., Reactor Hall"
                            style={inputStyles}
                        />
                    </FormField>

                    <FormField label="Building">
                        <input
                            type="text"
                            value={formData.building}
                            onChange={e => setFormData({ ...formData, building: e.target.value })}
                            placeholder="e.g., RH-01"
                            style={inputStyles}
                        />
                    </FormField>

                    <FormField label="Floor">
                        <input
                            type="text"
                            value={formData.floor}
                            onChange={e => setFormData({ ...formData, floor: e.target.value })}
                            placeholder="e.g., Ground"
                            style={inputStyles}
                        />
                    </FormField>
                </FormRow>

                {/* ISDC Codes */}
                <FormSection title="ISDC Classification" />

                <FormRow columns={3}>
                    <FormField label="ISDC Level 1" hint="Principal Activity">
                        <select
                            value={formData.isdcL1Code}
                            onChange={e => setFormData({ ...formData, isdcL1Code: e.target.value })}
                            style={selectStyles}
                        >
                            {isdcL1Options.map(opt => (
                                <option key={opt.code} value={opt.code}>
                                    {opt.code} - {opt.name}
                                </option>
                            ))}
                        </select>
                    </FormField>

                    <FormField label="ISDC Level 2" hint="Activity Group">
                        <input
                            type="text"
                            value={formData.isdcL2Code}
                            onChange={e => setFormData({ ...formData, isdcL2Code: e.target.value })}
                            placeholder="e.g., 04.02"
                            style={inputStyles}
                        />
                    </FormField>

                    <FormField label="ISDC Level 3" hint="Typical Activity">
                        <input
                            type="text"
                            value={formData.isdcL3Code}
                            onChange={e => setFormData({ ...formData, isdcL3Code: e.target.value })}
                            placeholder="e.g., 04.02.01"
                            style={inputStyles}
                        />
                    </FormField>
                </FormRow>

                {/* Work Difficulty Factors */}
                <FormSection title="Work Difficulty Factors (WDF)" />

                <FormField label="Enable WDF" hint={`Applies ${data.wdfGlobalMultiplier}x multiplier when enabled`}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={formData.wdfEnabled}
                            onChange={e => setFormData({ ...formData, wdfEnabled: e.target.checked })}
                        />
                        <span>Apply Work Difficulty Factor</span>
                    </label>
                </FormField>

                {formData.wdfEnabled && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
                        {[
                            { key: 'wdf_F1_Scaffolding', label: 'F1 Scaffolding' },
                            { key: 'wdf_F2_ConfinedSpace', label: 'F2 Confined Space' },
                            { key: 'wdf_F3_Respiratory', label: 'F3 Respiratory' },
                            { key: 'wdf_F4_Protective', label: 'F4 Protective' },
                            { key: 'wdf_F5_Shielding', label: 'F5 Shielding' },
                            { key: 'wdf_F6_Remote', label: 'F6 Remote' },
                            { key: 'wdf_F7_UserDefined', label: 'F7 User Defined' },
                        ].map(wdf => (
                            <label key={wdf.key} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px',
                                background: formData[wdf.key as keyof typeof formData] ? '#fef3c7' : '#f9fafb',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={formData[wdf.key as keyof typeof formData] === 1}
                                    onChange={e => setFormData({
                                        ...formData,
                                        [wdf.key]: e.target.checked ? 1 : 0
                                    })}
                                />
                                {wdf.label}
                            </label>
                        ))}
                    </div>
                )}

                {/* Cost Settings */}
                <FormSection title="Cost Settings" />

                <FormRow columns={2}>
                    <FormField label="Work Type">
                        <select
                            value={formData.isContractor ? 'contractor' : 'owner'}
                            onChange={e => setFormData({ ...formData, isContractor: e.target.value === 'contractor' })}
                            style={selectStyles}
                        >
                            <option value="owner">Owner (in-house)</option>
                            <option value="contractor">Contractor</option>
                        </select>
                    </FormField>

                    <FormField label="Contingency Rate (%)" hint="Applied to subtotal">
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={formData.contingencyRate}
                            onChange={e => setFormData({ ...formData, contingencyRate: parseFloat(e.target.value) || 0 })}
                            style={inputStyles}
                        />
                    </FormField>
                </FormRow>

                {/* Waste Partition */}
                <FormSection title="Waste Partition (must sum to 100%)" />

                {errors.wastePartition && (
                    <div style={{ padding: '8px 12px', background: '#fef2f2', color: '#ef4444', borderRadius: '6px', marginBottom: '12px', fontSize: '13px' }}>
                        ⚠️ {errors.wastePartition} (Current: {(wasteTotal * 100).toFixed(1)}%)
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                    {[
                        { key: 'wastePartitionILW', label: 'ILW', color: '#ef4444' },
                        { key: 'wastePartitionLLW', label: 'LLW', color: '#f59e0b' },
                        { key: 'wastePartitionVLLW', label: 'VLLW', color: '#22c55e' },
                        { key: 'wastePartitionEW', label: 'EW', color: '#3b82f6' },
                        { key: 'wastePartitionNonRad', label: 'Non-Rad', color: '#6b7280' },
                    ].map(wp => (
                        <div key={wp.key}>
                            <label style={{ fontSize: '12px', fontWeight: 500, marginBottom: '4px', display: 'block' }}>
                                <span style={{ color: wp.color }}>●</span> {wp.label}
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="1"
                                value={Number(formData[wp.key as keyof typeof formData])}
                                onChange={e => setFormData({
                                    ...formData,
                                    [wp.key]: parseFloat(e.target.value) || 0
                                })}
                                style={{ ...inputStyles, textAlign: 'center' as const }}
                            />
                            <div style={{ fontSize: '11px', color: '#666', textAlign: 'center', marginTop: '2px' }}>
                                {((formData[wp.key as keyof typeof formData] as number) * 100).toFixed(0)}%
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{
                    marginTop: '12px',
                    padding: '8px',
                    background: Math.abs(wasteTotal - 1) <= 0.001 ? '#f0fdf4' : '#fef2f2',
                    borderRadius: '6px',
                    textAlign: 'center',
                    fontSize: '13px',
                    fontWeight: 500
                }}>
                    Total: {(wasteTotal * 100).toFixed(1)}%
                    {Math.abs(wasteTotal - 1) <= 0.001 ? ' ✓' : ' (must be 100%)'}
                </div>

                {/* Form Actions */}
                <div style={{
                    marginTop: '24px',
                    paddingTop: '16px',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px'
                }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={buttonStyles.secondary}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        style={buttonStyles.primary}
                    >
                        {isEdit ? 'Update Item' : 'Add Item'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
