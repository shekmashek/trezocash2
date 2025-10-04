import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { HandCoins, TrendingDown, Plus, Trash2, Search, Lock, Edit, ChevronDown, Loader } from 'lucide-react';
import EmptyState from './EmptyState';
import AddCategoryFlowModal from './AddCategoryFlowModal';
import { deleteEntry, saveEntry } from '../context/actions';
import { expandVatEntries } from '../utils/budgetCalculations';
import { useActiveProjectData } from '../utils/selectors.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../utils/formatting';
import CriticalityPicker from './CriticalityPicker';

const BudgetStateView = ({ searchTerm }) => {
    const { dataState, dataDispatch } = useData();
    const { uiState, uiDispatch } = useUI();
    const { projects, categories, settings, tiers } = dataState;
    
    const { activeProject, budgetEntries, isConsolidated } = useActiveProjectData(dataState, uiState);
    
    const [isAddCategoryFlowModalOpen, setIsAddCategoryFlowModalOpen] = useState(false);
    const [addCategoryFlowType, setAddCategoryFlowType] = useState(null);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const dropdownRef = useRef(null);

    const toggleDropdown = (mainCatId) => {
        setOpenDropdownId(prevId => (prevId === mainCatId ? null : mainCatId));
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const expandedEntries = useMemo(() => {
        return expandVatEntries(budgetEntries, categories);
    }, [budgetEntries, categories]);

    const filteredBudgetEntries = useMemo(() => {
        if (!searchTerm) {
            return expandedEntries;
        }
        return expandedEntries.filter(entry => 
            entry.supplier.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [expandedEntries, searchTerm]);

    const handleAddEntry = (categoryName, mainCategoryType, mainCategoryId) => {
        const onSave = (entryData) => {
            if (!activeProject) {
                uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Erreur: Le projet actif n\'est pas défini.', type: 'error' } });
                return;
            }
            saveEntry({ dataDispatch, uiDispatch, dataState }, {
                entryData,
                editingEntry: null,
                user: dataState.session.user,
                tiers: dataState.tiers,
                cashAccounts: dataState.allCashAccounts[activeProject.id] || [],
                exchangeRates: dataState.exchangeRates,
                activeProjectId: activeProject.id
            });
        };
        uiDispatch({ type: 'OPEN_BUDGET_DRAWER', payload: { 
            entry: { category: categoryName, type: mainCategoryType, mainCategoryId }, 
            onSave 
        }});
    };

    const handleEditEntry = (entry) => {
        if (!activeProject) {
            uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Erreur: Le projet actif n\'est pas défini.', type: 'error' } });
            return;
        }
        const originalEntryId = entry.is_vat_child ? entry.id.replace('_vat', '') : entry.id;
        const originalEntry = budgetEntries.find(e => e.id === originalEntryId);
        if (!originalEntry) return;

        const onSave = (entryData) => {
            saveEntry({ dataDispatch, uiDispatch, dataState }, {
                entryData,
                editingEntry: originalEntry,
                user: dataState.session.user,
                tiers: dataState.tiers,
                cashAccounts: dataState.allCashAccounts[activeProject.id] || [],
                exchangeRates: dataState.exchangeRates,
                activeProjectId: activeProject.id
            });
        };
        const onDelete = () => {
            deleteEntry({ dataDispatch, uiDispatch }, { entryId: originalEntry.id, entryProjectId: activeProject.id });
        };
        uiDispatch({ type: 'OPEN_BUDGET_DRAWER', payload: { entry: originalEntry, onSave, onDelete } });
    };

    const handleDeleteEntry = (entry) => {
        if (!activeProject) {
            uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Erreur: Le projet actif n\'est pas défini.', type: 'error' } });
            return;
        }
        const originalEntryId = entry.is_vat_child ? entry.id.replace('_vat', '') : entry.id;
        const originalEntry = budgetEntries.find(e => e.id === originalEntryId);
        if (originalEntry) {
            deleteEntry({dataDispatch, uiDispatch}, { entryId: originalEntry.id, entryProjectId: activeProject.id });
        }
    };

    const handleCategorySelectedForNewEntry = (mainCategoryId) => {
        setIsAddCategoryFlowModalOpen(false);
        const onSave = (entryData) => {
            if (!activeProject) {
                uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Erreur: Le projet actif n\'est pas défini.', type: 'error' } });
                return;
            }
            saveEntry({ dataDispatch, uiDispatch, dataState }, {
                entryData,
                editingEntry: null,
                user: dataState.session.user,
                tiers: dataState.tiers,
                cashAccounts: dataState.allCashAccounts[activeProject.id] || [],
                exchangeRates: dataState.exchangeRates,
                activeProjectId: activeProject.id
            });
        };
        uiDispatch({ type: 'OPEN_BUDGET_DRAWER', payload: { 
            entry: { type: addCategoryFlowType, mainCategoryId }, 
            onSave 
        }});
    };

    const handleOpenDetailDrawer = (entry) => {
        uiDispatch({ type: 'OPEN_BUDGET_ENTRY_DETAIL_DRAWER', payload: entry });
    };

    if (isConsolidated) {
        return <div className="text-center p-8 text-gray-500">L'état des lieux est disponible uniquement pour les projets individuels.</div>;
    }

    if (!activeProject) {
        return (
            <div className="flex justify-center items-center p-12">
                <Loader className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    const renderSection = (type) => {
        const isRevenue = type === 'revenu';
        const title = isRevenue ? 'Entrées' : 'Sorties';
        const Icon = isRevenue ? HandCoins : TrendingDown;
        const mainCategories = isRevenue ? categories.revenue : categories.expense;

        const sectionEntries = filteredBudgetEntries.filter(e => e.type === type);
        
        const projectCurrency = activeProject?.currency || settings.currency;
        const currencySettingsForProject = { ...settings, currency: projectCurrency };

        return (
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${isRevenue ? 'text-green-500' : 'text-red-500'}`} />
                    {title}
                </h2>
                
                <div className="space-y-1">
                    {mainCategories.map(mainCat => {
                        const entriesForMainCat = sectionEntries.filter(entry => 
                            mainCat.subCategories.some(sc => sc && sc.name === entry.category) || (entry.is_vat_child && (entry.category === 'TVA collectée' || entry.category === 'TVA déductible') && mainCat.name === 'IMPÔTS & CONTRIBUTIONS')
                        );
                        if (entriesForMainCat.length === 0) return null;

                        return (
                            <div key={mainCat.id} className="py-2">
                                <div className="flex items-center bg-gray-100 rounded-md p-2">
                                    <div className="relative" ref={openDropdownId === mainCat.id ? dropdownRef : null}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleDropdown(mainCat.id); }}
                                            className="flex items-center justify-center w-6 h-6 rounded bg-gray-300 hover:bg-blue-200 text-gray-600 hover:text-blue-700 transition-colors"
                                            title="Ajouter une écriture"
                                        >
                                            <Plus size={16} />
                                        </button>
                                        <AnimatePresence>
                                            {openDropdownId === mainCat.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    className="absolute left-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border z-20"
                                                >
                                                    <ul className="p-1 max-h-60 overflow-y-auto">
                                                        {mainCat.subCategories.filter(sc => !sc.isFixed).map(sc => (
                                                            <li key={sc.id}>
                                                                <button
                                                                    onClick={() => {
                                                                        handleAddEntry(sc.name, type, mainCat.id);
                                                                        setOpenDropdownId(null);
                                                                    }}
                                                                    className="w-full text-left px-3 py-1.5 text-sm rounded-md text-gray-700 hover:bg-gray-100"
                                                                >
                                                                    {sc.name}
                                                                </button>
                                                            </li>
                                                        ))}
                                                        {mainCat.subCategories.filter(sc => !sc.isFixed).length > 0 && <hr className="my-1" />}
                                                        <li>
                                                            <button
                                                                onClick={() => {
                                                                    handleAddEntry(null, type, mainCat.id);
                                                                    setOpenDropdownId(null);
                                                                }}
                                                                className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm rounded-md font-semibold text-blue-600 hover:bg-blue-50"
                                                            >
                                                                <Plus size={14} />
                                                                Nouvelle sous-catégorie
                                                            </button>
                                                        </li>
                                                    </ul>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <span className="font-bold text-gray-700 ml-3">{mainCat.name}</span>
                                </div>
                                
                                <div className="pl-8 mt-1">
                                    {entriesForMainCat.map(entry => {
                                        const subCat = mainCat.subCategories.find(sc => sc.name === entry.category);
                                        const criticality = subCat?.criticality;
                                        return (
                                            <div key={entry.id} onClick={() => handleOpenDetailDrawer(entry)} className="flex items-center border-b hover:bg-gray-50 group cursor-pointer py-3">
                                                <div className="w-[25%] flex items-center gap-2 pr-4">
                                                    {criticality && entry.type === 'depense' && <CriticalityPicker value={criticality} onSelect={() => {}} />}
                                                    <span className="text-gray-600 truncate">{entry.category}</span>
                                                </div>
                                                <div className="w-[20%] text-gray-600 truncate pr-4">{entry.supplier}</div>
                                                <div className="w-[15%] text-gray-600 truncate pr-4">{entry.frequency}</div>
                                                <div className="w-[15%] text-gray-600 truncate pr-4">{entry.startDate ? new Date(entry.startDate).toLocaleDateString('fr-FR') : (entry.date ? new Date(entry.date).toLocaleDateString('fr-FR') : '-')}</div>
                                                <div className="w-[20%] text-right text-gray-700 font-medium pr-4">
                                                    {formatCurrency(entry.original_amount ?? entry.amount, { ...settings, currency: entry.currency || projectCurrency })}
                                                </div>
                                                <div className="w-[5%] flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={(e) => { e.stopPropagation(); handleEditEntry(entry); }} className="p-1 text-blue-500 hover:text-blue-700" title="Modifier">
                                                        <Edit size={14} />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteEntry(entry); }} className="p-1 text-red-500 hover:text-red-700" title="Supprimer">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                    <div className="text-center mt-4">
                        <button onClick={() => { setAddCategoryFlowType(type); setIsAddCategoryFlowModalOpen(true); }} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-normal mx-auto">
                            <Plus size={16} /> Ajouter une écriture dans une autre catégorie
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    
    return (
        <div>
            {searchTerm && filteredBudgetEntries.length === 0 ? (
                <EmptyState 
                    icon={Search} 
                    title="Aucun résultat" 
                    message={`Aucune entrée trouvée pour le tiers "${searchTerm}".`} 
                />
            ) : (
                <>
                    {renderSection('revenu')}
                    {renderSection('depense')}
                </>
            )}
            
            <AddCategoryFlowModal 
                isOpen={isAddCategoryFlowModalOpen}
                onClose={() => setIsAddCategoryFlowModalOpen(false)}
                type={addCategoryFlowType}
                onCategorySelected={handleCategorySelectedForNewEntry}
            />
        </div>
    );
};

export default BudgetStateView;
