'use client';

import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Check, AlertCircle } from 'lucide-react';
import { ISDCItem, ISDC_L1, ISDC_L2, ISDC_L3 } from '@/lib/wizard/isdc-data';

export interface ISDCSelection {
    code: string;
    isActive: boolean;
    isContractor: boolean;
    contingencyPercent: number;
}

interface ISDCTreeProps {
    selections: Map<string, ISDCSelection>;
    onSelectionChange: (code: string, selection: Partial<ISDCSelection>) => void;
    onBulkSelect: (codes: string[], isActive: boolean) => void;
}

interface TreeNodeProps {
    item: ISDCItem;
    children: ISDCItem[];
    level: number;
    selections: Map<string, ISDCSelection>;
    onSelectionChange: (code: string, selection: Partial<ISDCSelection>) => void;
    expandedNodes: Set<string>;
    toggleExpand: (code: string) => void;
}

function TreeNode({ item, children, level, selections, onSelectionChange, expandedNodes, toggleExpand }: TreeNodeProps) {
    const selection = selections.get(item.code);
    const isActive = selection?.isActive ?? false;
    const isExpanded = expandedNodes.has(item.code);
    const hasChildren = children.length > 0;

    // Count active children
    const activeChildrenCount = children.filter(c => selections.get(c.code)?.isActive).length;
    const isPartiallySelected = activeChildrenCount > 0 && activeChildrenCount < children.length;

    // Indentation based on level
    const paddingLeft = level === 1 ? 0 : level === 2 ? 24 : 48;

    return (
        <div className="select-none">
            <div
                className={`
          flex items-center gap-2 py-2 px-3 rounded-lg transition-all cursor-pointer
          ${isActive ? 'bg-blue-50/80' : 'hover:bg-slate-50'}
          ${level === 1 ? 'border-b border-slate-100' : ''}
        `}
                style={{ paddingLeft: paddingLeft + 12 }}
            >
                {/* Expand/Collapse */}
                {hasChildren ? (
                    <button
                        onClick={() => toggleExpand(item.code)}
                        className="p-0.5 hover:bg-slate-200 rounded transition-colors"
                    >
                        {isExpanded ? (
                            <ChevronDown size={16} className="text-slate-400" />
                        ) : (
                            <ChevronRight size={16} className="text-slate-400" />
                        )}
                    </button>
                ) : (
                    <div className="w-5" />
                )}

                {/* Checkbox */}
                <button
                    onClick={() => onSelectionChange(item.code, { isActive: !isActive })}
                    className={`
            w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0
            ${isActive
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : isPartiallySelected
                                ? 'bg-blue-200 border-blue-300'
                                : 'bg-white border-slate-300 hover:border-blue-400'
                        }
          `}
                >
                    {isActive && <Check size={12} strokeWidth={3} />}
                    {isPartiallySelected && !isActive && <div className="w-2 h-0.5 bg-blue-500" />}
                </button>

                {/* Code & Name */}
                <div
                    className="flex-1 min-w-0 flex items-center gap-2"
                    onClick={() => onSelectionChange(item.code, { isActive: !isActive })}
                >
                    <span className={`
            text-xs font-mono px-1.5 py-0.5 rounded
            ${level === 1 ? 'bg-slate-800 text-white' : level === 2 ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-500'}
          `}>
                        {item.code}
                    </span>
                    <span className={`text-sm truncate ${isActive ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                        {item.name}
                    </span>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {item.isInventoryDependent && (
                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase">
                            INV
                        </span>
                    )}
                    {item.isWasteManagement && (
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">
                            WM
                        </span>
                    )}

                    {/* Contingency Input (only for active items) */}
                    {isActive && (
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                value={selection?.contingencyPercent ?? item.contingencyDefault}
                                onChange={(e) => onSelectionChange(item.code, {
                                    contingencyPercent: parseFloat(e.target.value) || 0
                                })}
                                onClick={(e) => e.stopPropagation()}
                                className="w-12 text-xs text-center px-1 py-0.5 border border-slate-200 rounded focus:border-blue-400 focus:outline-none"
                                min={0}
                                max={100}
                            />
                            <span className="text-[10px] text-slate-400">%</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Children */}
            {hasChildren && isExpanded && (
                <div className="ml-2">
                    {children.map(child => {
                        const grandchildren = level === 1
                            ? ISDC_L3.filter(l3 => l3.parentCode === child.code)
                            : [];
                        return (
                            <TreeNode
                                key={child.code}
                                item={child}
                                children={grandchildren}
                                level={level + 1}
                                selections={selections}
                                onSelectionChange={onSelectionChange}
                                expandedNodes={expandedNodes}
                                toggleExpand={toggleExpand}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export function ISDCTree({ selections, onSelectionChange, onBulkSelect }: ISDCTreeProps) {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['01', '04', '05']));
    const [filter, setFilter] = useState<'all' | 'selected' | 'inventory' | 'waste'>('all');

    const toggleExpand = (code: string) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(code)) {
                next.delete(code);
            } else {
                next.add(code);
            }
            return next;
        });
    };

    const expandAll = () => {
        const allCodes = [...ISDC_L1, ...ISDC_L2].map(i => i.code);
        setExpandedNodes(new Set(allCodes));
    };

    const collapseAll = () => {
        setExpandedNodes(new Set());
    };

    // Filter L1 items
    const filteredL1 = useMemo(() => {
        return ISDC_L1.filter(item => {
            if (filter === 'selected') return selections.get(item.code)?.isActive;
            if (filter === 'inventory') return item.isInventoryDependent;
            if (filter === 'waste') return item.isWasteManagement;
            return true;
        });
    }, [filter, selections]);

    // Stats
    const stats = useMemo(() => {
        let total = 0;
        let selected = 0;
        selections.forEach((sel) => {
            total++;
            if (sel.isActive) selected++;
        });
        return { total, selected };
    }, [selections]);

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                {/* Filter Tabs */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'selected', label: 'Selected' },
                        { key: 'inventory', label: 'Inventory-Dep.' },
                        { key: 'waste', label: 'Waste Mgt.' },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key as typeof filter)}
                            className={`
                px-3 py-1.5 text-xs font-semibold rounded-md transition-all
                ${filter === key
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }
              `}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                        {stats.selected} of {stats.total} selected
                    </span>
                    <button
                        onClick={expandAll}
                        className="text-xs text-blue-600 hover:underline"
                    >
                        Expand All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                        onClick={collapseAll}
                        className="text-xs text-blue-600 hover:underline"
                    >
                        Collapse All
                    </button>
                </div>
            </div>

            {/* Tree */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-[500px] overflow-y-auto">
                {filteredL1.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        <AlertCircle size={24} className="mx-auto mb-2" />
                        <p>No items match the filter</p>
                    </div>
                ) : (
                    filteredL1.map(l1Item => {
                        const l2Children = ISDC_L2.filter(l2 => l2.parentCode === l1Item.code);
                        return (
                            <TreeNode
                                key={l1Item.code}
                                item={l1Item}
                                children={l2Children}
                                level={1}
                                selections={selections}
                                onSelectionChange={onSelectionChange}
                                expandedNodes={expandedNodes}
                                toggleExpand={toggleExpand}
                            />
                        );
                    })
                )}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                    <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 font-bold rounded">INV</span>
                    Inventory-dependent
                </span>
                <span className="flex items-center gap-1">
                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 font-bold rounded">WM</span>
                    Waste Management
                </span>
            </div>
        </div>
    );
}
