// Reusable Modal Component
// For add/edit dialogs across all sheets

'use client'

import { ReactNode, useEffect } from 'react'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: ReactNode
    size?: 'small' | 'medium' | 'large'
}

export function Modal({ isOpen, onClose, title, children, size = 'medium' }: ModalProps) {
    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }
        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    const widthMap = {
        small: '400px',
        medium: '600px',
        large: '900px'
    }

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px'
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                style={{
                    background: 'white',
                    borderRadius: '12px',
                    width: '100%',
                    maxWidth: widthMap[size],
                    maxHeight: '90vh',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{title}</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer',
                            padding: '4px',
                            color: '#666'
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                    {children}
                </div>
            </div>
        </div>
    )
}

// Form Field Components
interface FormFieldProps {
    label: string
    required?: boolean
    error?: string
    children: ReactNode
    hint?: string
}

export function FormField({ label, required, error, children, hint }: FormFieldProps) {
    return (
        <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
                {label}
                {required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
            </label>
            {children}
            {hint && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{hint}</div>
            )}
            {error && (
                <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{error}</div>
            )}
        </div>
    )
}

// Form Row for horizontal layout
interface FormRowProps {
    children: ReactNode
    columns?: number
}

export function FormRow({ children, columns = 2 }: FormRowProps) {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: '16px'
        }}>
            {children}
        </div>
    )
}

// Section Title
export function FormSection({ title }: { title: string }) {
    return (
        <h3 style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#374151',
            marginTop: '20px',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid #e5e7eb'
        }}>
            {title}
        </h3>
    )
}

// Button styles
export const buttonStyles = {
    primary: {
        background: '#3b82f6',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer'
    },
    secondary: {
        background: 'white',
        color: '#374151',
        border: '1px solid #d1d5db',
        padding: '10px 20px',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer'
    },
    danger: {
        background: '#ef4444',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer'
    }
}

// Input styles
export const inputStyles = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none'
}

export const selectStyles = {
    ...inputStyles,
    background: 'white'
}
