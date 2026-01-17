// Add Currency Form
// Form for adding new currencies to the Lists sheet

'use client'

import { useState } from 'react'
import { Modal, FormField, FormRow, buttonStyles, inputStyles } from './Modal'
import { useCerrex, Currency } from '@/lib/context/CerrexContext'

interface AddCurrencyFormProps {
    isOpen: boolean
    onClose: () => void
    editItem?: Currency
}

export function AddCurrencyForm({ isOpen, onClose, editItem }: AddCurrencyFormProps) {
    const { addCurrency, updateCurrency } = useCerrex()
    const isEdit = !!editItem

    const [formData, setFormData] = useState({
        code: editItem?.code || '',
        name: editItem?.name || '',
        symbol: editItem?.symbol || '',
        exchangeRate: editItem?.exchangeRate || 1,
        isReference: editItem?.isReference ?? false
    })

    const [errors, setErrors] = useState<Record<string, string>>({})

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (!formData.code.trim()) {
            newErrors.code = 'Currency code is required'
        }
        if (formData.code.length !== 3) {
            newErrors.code = 'Currency code must be 3 characters (e.g., USD)'
        }
        if (!formData.name.trim()) {
            newErrors.name = 'Currency name is required'
        }
        if (!formData.symbol.trim()) {
            newErrors.symbol = 'Symbol is required'
        }
        if (formData.exchangeRate <= 0) {
            newErrors.exchangeRate = 'Exchange rate must be greater than 0'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!validate()) return

        const currencyData = {
            code: formData.code.toUpperCase(),
            name: formData.name,
            symbol: formData.symbol,
            exchangeRate: Number(formData.exchangeRate),
            isReference: formData.isReference
        }

        if (isEdit && editItem) {
            updateCurrency(editItem.id, currencyData)
        } else {
            addCurrency(currencyData)
        }

        onClose()
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? 'Edit Currency' : 'Add Currency'}
            size="small"
        >
            <form onSubmit={handleSubmit}>
                <FormRow columns={2}>
                    <FormField label="Currency Code" required error={errors.code}>
                        <input
                            type="text"
                            value={formData.code}
                            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            placeholder="USD"
                            maxLength={3}
                            style={{ ...inputStyles, textTransform: 'uppercase' as const }}
                        />
                    </FormField>

                    <FormField label="Symbol" required error={errors.symbol}>
                        <input
                            type="text"
                            value={formData.symbol}
                            onChange={e => setFormData({ ...formData, symbol: e.target.value })}
                            placeholder="$"
                            style={inputStyles}
                        />
                    </FormField>
                </FormRow>

                <FormField label="Currency Name" required error={errors.name}>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="US Dollar"
                        style={inputStyles}
                    />
                </FormField>

                <FormField label="Exchange Rate" required error={errors.exchangeRate} hint="Rate to reference currency">
                    <input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={formData.exchangeRate}
                        onChange={e => setFormData({ ...formData, exchangeRate: parseFloat(e.target.value) || 0 })}
                        style={inputStyles}
                    />
                </FormField>

                <FormField label="Reference Currency">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={formData.isReference}
                            onChange={e => setFormData({ ...formData, isReference: e.target.checked })}
                        />
                        <span>Set as reference currency (rate = 1.0)</span>
                    </label>
                </FormField>

                <div style={{
                    marginTop: '24px',
                    paddingTop: '16px',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px'
                }}>
                    <button type="button" onClick={onClose} style={buttonStyles.secondary}>
                        Cancel
                    </button>
                    <button type="submit" style={buttonStyles.primary}>
                        {isEdit ? 'Update Currency' : 'Add Currency'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}

// Add D&D Category Form
interface AddDDCategoryFormProps {
    isOpen: boolean
    onClose: () => void
    editItem?: { id: string; code: string; name: string; category: string; description?: string }
}

export function AddDDCategoryForm({ isOpen, onClose, editItem }: AddDDCategoryFormProps) {
    const { addDDCategory, updateDDCategory } = useCerrex()
    const isEdit = !!editItem

    const [formData, setFormData] = useState({
        code: editItem?.code || '',
        name: editItem?.name || '',
        category: editItem?.category || '',
        description: editItem?.description || ''
    })

    const [errors, setErrors] = useState<Record<string, string>>({})

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {}
        if (!formData.code.trim()) newErrors.code = 'Code is required'
        if (!formData.name.trim()) newErrors.name = 'Name is required'
        if (!formData.category.trim()) newErrors.category = 'Category is required'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return

        if (isEdit && editItem) {
            updateDDCategory(editItem.id, formData)
        } else {
            addDDCategory(formData)
        }
        onClose()
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit D&D Category' : 'Add D&D Category'} size="medium">
            <form onSubmit={handleSubmit}>
                <FormRow columns={2}>
                    <FormField label="Code" required error={errors.code}>
                        <input
                            type="text"
                            value={formData.code}
                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                            placeholder="PIPE-SS"
                            style={inputStyles}
                        />
                    </FormField>
                    <FormField label="Category" required error={errors.category}>
                        <input
                            type="text"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                            placeholder="Piping"
                            style={inputStyles}
                        />
                    </FormField>
                </FormRow>

                <FormField label="Name" required error={errors.name}>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Stainless Steel Pipes"
                        style={inputStyles}
                    />
                </FormField>

                <FormField label="Description">
                    <input
                        type="text"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Optional description..."
                        style={inputStyles}
                    />
                </FormField>

                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button type="button" onClick={onClose} style={buttonStyles.secondary}>Cancel</button>
                    <button type="submit" style={buttonStyles.primary}>{isEdit ? 'Update' : 'Add Category'}</button>
                </div>
            </form>
        </Modal>
    )
}

// Add Profession Form
interface AddProfessionFormProps {
    isOpen: boolean
    onClose: () => void
    editItem?: { id: string; name: string; abbr: string; hourRateOwner: number; hourRateContractor: number }
}

export function AddProfessionForm({ isOpen, onClose, editItem }: AddProfessionFormProps) {
    const { addProfession, updateProfession } = useCerrex()
    const isEdit = !!editItem

    const [formData, setFormData] = useState({
        name: editItem?.name || '',
        abbr: editItem?.abbr || '',
        hourRateOwner: editItem?.hourRateOwner || 0,
        hourRateContractor: editItem?.hourRateContractor || 0
    })

    const validate = () => {
        if (!formData.name.trim() || !formData.abbr.trim()) return false
        if (formData.hourRateOwner <= 0 || formData.hourRateContractor <= 0) return false
        return true
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return

        if (isEdit && editItem) {
            updateProfession(editItem.id, formData)
        } else {
            addProfession(formData)
        }
        onClose()
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Profession' : 'Add Profession'} size="medium">
            <form onSubmit={handleSubmit}>
                <FormRow columns={2}>
                    <FormField label="Name" required>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Skilled Worker"
                            style={inputStyles}
                        />
                    </FormField>
                    <FormField label="Abbreviation" required>
                        <input
                            type="text"
                            value={formData.abbr}
                            onChange={e => setFormData({ ...formData, abbr: e.target.value })}
                            placeholder="SKW"
                            style={inputStyles}
                        />
                    </FormField>
                </FormRow>

                <FormRow columns={2}>
                    <FormField label="Owner Rate ($/hr)" required>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.hourRateOwner}
                            onChange={e => setFormData({ ...formData, hourRateOwner: parseFloat(e.target.value) || 0 })}
                            style={inputStyles}
                        />
                    </FormField>
                    <FormField label="Contractor Rate ($/hr)" required>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.hourRateContractor}
                            onChange={e => setFormData({ ...formData, hourRateContractor: parseFloat(e.target.value) || 0 })}
                            style={inputStyles}
                        />
                    </FormField>
                </FormRow>

                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button type="button" onClick={onClose} style={buttonStyles.secondary}>Cancel</button>
                    <button type="submit" style={buttonStyles.primary}>{isEdit ? 'Update' : 'Add Profession'}</button>
                </div>
            </form>
        </Modal>
    )
}

// Add Unit Factor Form
interface AddUnitFactorFormProps {
    isOpen: boolean
    onClose: () => void
}

export function AddUnitFactorForm({ isOpen, onClose }: AddUnitFactorFormProps) {
    const { addUnitFactor } = useCerrex()

    const [formData, setFormData] = useState({
        category: '',
        type: 'd_and_d' as 'd_and_d' | 'waste_management',
        manpowerUF: 0,
        investmentUF: 0,
        expensesUF: 0,
        unit: ''
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.category.trim() || !formData.unit.trim()) return

        addUnitFactor(formData)
        onClose()
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Unit Factor" size="medium">
            <form onSubmit={handleSubmit}>
                <FormRow columns={2}>
                    <FormField label="Category Code" required>
                        <input
                            type="text"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                            placeholder="PIPE-SS"
                            style={inputStyles}
                        />
                    </FormField>
                    <FormField label="Type" required>
                        <select
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value as 'd_and_d' | 'waste_management' })}
                            style={inputStyles}
                        >
                            <option value="d_and_d">D&D (Dismantling)</option>
                            <option value="waste_management">Waste Management</option>
                        </select>
                    </FormField>
                </FormRow>

                <FormRow columns={3}>
                    <FormField label="Manpower UF (Mh)">
                        <input
                            type="number"
                            step="0.01"
                            value={formData.manpowerUF}
                            onChange={e => setFormData({ ...formData, manpowerUF: parseFloat(e.target.value) || 0 })}
                            style={inputStyles}
                        />
                    </FormField>
                    <FormField label="Investment UF ($)">
                        <input
                            type="number"
                            step="0.01"
                            value={formData.investmentUF}
                            onChange={e => setFormData({ ...formData, investmentUF: parseFloat(e.target.value) || 0 })}
                            style={inputStyles}
                        />
                    </FormField>
                    <FormField label="Expenses UF ($)">
                        <input
                            type="number"
                            step="0.01"
                            value={formData.expensesUF}
                            onChange={e => setFormData({ ...formData, expensesUF: parseFloat(e.target.value) || 0 })}
                            style={inputStyles}
                        />
                    </FormField>
                </FormRow>

                <FormField label="Unit" required>
                    <input
                        type="text"
                        value={formData.unit}
                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                        placeholder="ton, m³, item"
                        style={inputStyles}
                    />
                </FormField>

                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button type="button" onClick={onClose} style={buttonStyles.secondary}>Cancel</button>
                    <button type="submit" style={buttonStyles.primary}>Add Unit Factor</button>
                </div>
            </form>
        </Modal>
    )
}
