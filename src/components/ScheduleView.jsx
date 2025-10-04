import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { ChevronLeft, ChevronRight, Calendar, ArrowUp, ArrowDown, ChevronDown } from 'lucide-react';
import { getTodayInTimezone } from '../utils/budgetCalculations';
import { useActiveProjectData, useScheduleData } from '../utils/selectors.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../utils/formatting';
import { saveEntry } from '../context/actions';

const DayCell = ({ day, transactions, isToday, isCurrentMonth, currencySettings, todayDate, viewMode, onTransactionClick, onDayClick }) => {
    const dayNumber = day.getDate();
    const maxVisibleItems = viewMode === 'week' ? transactions.length : 3;
    const visibleTransactions = transactions.slice(0, maxVisibleItems);
    const hiddenCount = transactions.length - maxVisibleItems;

    const totalPayable = useMemo(() => transactions.filter(tx => tx.type === 'payable').reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0), [transactions]);
    const totalReceivable = useMemo(() => transactions.filter(tx => tx.type === 'receivable').reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0), [transactions]);

    const getTransactionStyle = (tx) => {
        if (tx.isSettled) {
            return 'bg-gray-100 text-gray-400 line-through cursor-default';
        }
        
        const dueDate = new Date(tx.date);
        dueDate.setHours(0, 0, 0, 0);
        
        const isPayable = tx.type === 'payable';
        
        if (dueDate < todayDate) { // Overdue
            return isPayable ? 'bg-red-100 text-red-800 cursor-pointer hover:bg-red-200' : 'bg-green-100 text-green-800 cursor-pointer hover:bg-green-200';
        }
        if (dueDate.getTime() === todayDate.getTime()) { // Due Today
            return isPayable ? 'bg-red-200 text-red-900 font-bold cursor-pointer hover:bg-red-300' : 'bg-green-200 text-green-900 font-bold cursor-pointer hover:bg-green-300';
        }
        // Upcoming
        return isPayable ? 'bg-red-50 text-red-700 cursor-pointer hover:bg-red-100' : 'bg-green-50 text-green-700 cursor-pointer hover:bg-green-100';
    };
    
    const cellHeightClass = viewMode === 'week' ? 'h-[calc(100vh-22rem)]' : 'h-48';

    return (
        <div 
            onClick={() => onDayClick(day)}
            className={`border-t border-r border-gray-200 p-1 flex flex-col ${cellHeightClass} ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'} cursor-pointer hover:bg-blue-50/50 transition-colors`}
        >
            <div className="flex justify-between items-start">
                <div className="text-left flex-grow space-y-0.5 pr-1">
                    {totalReceivable > 0 && (
                        <div className="text-xs font-semibold text-green-600" title={`Entrées: ${formatCurrency(totalReceivable, { ...currencySettings, displayUnit: 'standard' })}`}>
                            +{formatCurrency(totalReceivable, { ...currencySettings, displayUnit: 'standard' })}
                        </div>
                    )}
                    {totalPayable > 0 && (
                        <div className="text-xs font-semibold text-red-600" title={`Sorties: ${formatCurrency(totalPayable, { ...currencySettings, displayUnit: 'standard' })}`}>
                            -{formatCurrency(totalPayable, { ...currencySettings, displayUnit: 'standard' })}
                        </div>
                    )}
                </div>
                <div className={`flex-shrink-0 text-sm font-medium ${isCurrentMonth ? 'text-gray-700' : 'text-gray-400'}`}>
                    <span className={`w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : ''}`}>
                        {dayNumber}
                    </span>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto space-y-1 mt-1 pr-1 custom-scrollbar">
                {visibleTransactions.map(tx => {
                    const amountToDisplay = tx.original_amount != null ? tx.original_amount : tx.amount;
                    const currencyToUse = tx.currency || currencySettings.currency;
                    const customCurrencySettings = { ...currencySettings, currency: currencyToUse, displayUnit: 'standard' };

                    return (
                        <button 
                            key={tx.id} 
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!tx.isSettled) onTransactionClick(e, tx);
                            }}
                            disabled={tx.isSettled}
                            className={`p-1.5 rounded-md text-xs w-full text-left transition-colors ${getTransactionStyle(tx)}`}
                        >
                            <div className="flex justify-between items-center">
                                <span className="font-semibold truncate flex-1" title={tx.thirdParty}>{tx.thirdParty}</span>
                                <span className="font-mono ml-2 whitespace-nowrap">{formatCurrency(amountToDisplay, customCurrencySettings)}</span>
                            </div>
                        </button>
                    );
                })}
                {hiddenCount > 0 && (
                    <div className="text-xs text-center text-gray-500 pt-1">
                        + {hiddenCount} de plus
                    </div>
                )}
            </div>
        </div>
    );
};

const ScheduleView = ({ isFocusMode = false, currentDate: propCurrentDate, viewMode: propViewMode }) => {
    const { dataState, dataDispatch } = useData();
    const { uiState, uiDispatch } = useUI();
    const { settings, projects, tiers } = dataState;

    const [isViewModeMenuOpen, setIsViewModeMenuOpen] = useState(false);
    const viewModeMenuRef = useRef(null);

    const currentDate = isFocusMode ? new Date(propCurrentDate) : new Date(uiState.scheduleCurrentDate);
    const viewMode = isFocusMode ? propViewMode : uiState.scheduleViewMode;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (viewModeMenuRef.current && !viewModeMenuRef.current.contains(event.target)) {
                setIsViewModeMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    
    const today = getTodayInTimezone(settings.timezoneOffset);

    const { actualTransactions, activeProject, isConsolidated, isCustomConsolidated } = useActiveProjectData(dataState, uiState);
    const { transactionsByDate } = useScheduleData(actualTransactions, settings);

    const currencySettingsForView = useMemo(() => {
        const projectCurrency = activeProject?.currency || settings.currency;
        const projectDisplayUnit = activeProject?.display_unit || settings.displayUnit;
        const projectDecimalPlaces = activeProject?.decimal_places ?? settings.decimalPlaces;
        return { ...settings, currency: projectCurrency, displayUnit: projectDisplayUnit, decimalPlaces: projectDecimalPlaces };
    }, [activeProject, settings]);

    const calendarGrid = useMemo(() => {
        const grid = [];
        if (viewMode === 'month') {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const firstDayOfMonth = new Date(year, month, 1);
            const firstDayOfWeek = firstDayOfMonth.getDay(); // 0=Sun, 1=Mon
            const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
            const gridStartDate = new Date(firstDayOfMonth);
            gridStartDate.setDate(gridStartDate.getDate() - startOffset);
            for (let i = 0; i < 35; i++) { // 5 rows
                const day = new Date(gridStartDate);
                day.setDate(day.getDate() + i);
                grid.push(day);
            }
        } else { // week view
            const currentDayOfWeek = currentDate.getDay();
            const startOffset = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
            const weekStartDate = new Date(currentDate);
            weekStartDate.setDate(weekStartDate.getDate() - startOffset);
            for (let i = 0; i < 7; i++) {
                const day = new Date(weekStartDate);
                day.setDate(day.getDate() + i);
                grid.push(day);
            }
        }
        return grid;
    }, [currentDate, viewMode]);

    const headerLabel = useMemo(() => {
        if (viewMode === 'month') {
            const label = currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
            return label.charAt(0).toUpperCase() + label.slice(1);
        } else {
            if (calendarGrid.length === 0) return '';
            const startOfWeek = new Date(calendarGrid[0]);
            const endOfWeek = new Date(calendarGrid[6]);
            const startFormatted = startOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
            const endFormatted = endOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
            return `Semaine du ${startFormatted} au ${endFormatted}`;
        }
    }, [currentDate, viewMode, calendarGrid]);

    const goToPrevious = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else {
            newDate.setDate(newDate.getDate() - 7);
        }
        uiDispatch({ type: 'SET_SCHEDULE_CURRENT_DATE', payload: newDate.toISOString() });
    };

    const goToNext = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') {
            newDate.setMonth(newDate.getMonth() + 1);
        } else {
            newDate.setDate(newDate.getDate() + 7);
        }
        uiDispatch({ type: 'SET_SCHEDULE_CURRENT_DATE', payload: newDate.toISOString() });
    };
    
    const goToToday = () => {
        uiDispatch({ type: 'SET_SCHEDULE_CURRENT_DATE', payload: new Date().toISOString() });
    };

    const handleSetViewMode = (mode) => {
        uiDispatch({ type: 'SET_SCHEDULE_VIEW_MODE', payload: mode });
    };

    const handleTransactionClick = (e, tx) => {
        e.preventDefault();
        e.stopPropagation();
        uiDispatch({
            type: 'OPEN_TRANSACTION_ACTION_MENU',
            payload: {
                x: e.clientX,
                y: e.clientY,
                transaction: tx,
            }
        });
    };

    const handleDayClick = (date) => {
        if (isConsolidated || isCustomConsolidated) {
            uiDispatch({ type: 'ADD_TOAST', payload: { message: "L'ajout d'écritures n'est pas disponible en vue consolidée.", type: 'info' } });
            return;
        }
        const onSave = (entryData) => {
            saveEntry({ dataDispatch, uiDispatch, dataState }, {
                entryData,
                editingEntry: null,
                user: dataState.session.user,
                tiers,
                cashAccounts: dataState.allCashAccounts[activeProject.id] || [],
                exchangeRates: dataState.exchangeRates,
                activeProjectId: activeProject.id
            });
        };
        uiDispatch({
            type: 'OPEN_BUDGET_DRAWER',
            payload: {
                entry: {
                    frequency: 'ponctuel',
                    date: date.toISOString().split('T')[0],
                },
                onSave
            }
        });
    };

    const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    return (
        <div className={isFocusMode ? "h-full" : "container mx-auto p-6 max-w-full"}>
            <div className="flex flex-col h-full">
                {!isFocusMode && (
                    <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                            <div>
                                <p className="text-xl font-semibold text-gray-800">{headerLabel}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative" ref={viewModeMenuRef}>
                                <button 
                                    onClick={() => setIsViewModeMenuOpen(p => !p)} 
                                    className="flex items-center gap-2 px-3 h-9 rounded-md bg-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-300 transition-colors"
                                >
                                    <span>{viewMode === 'month' ? 'Mois' : 'Semaine'}</span>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${isViewModeMenuOpen ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {isViewModeMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                            className="absolute right-0 top-full mt-2 w-40 bg-white rounded-lg shadow-lg border z-20"
                                        >
                                            <ul className="p-1">
                                                <li>
                                                    <button
                                                        onClick={() => { handleSetViewMode('month'); setIsViewModeMenuOpen(false); }}
                                                        className={`w-full text-left px-3 py-1.5 text-sm rounded-md ${viewMode === 'month' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
                                                    >
                                                        Mois
                                                    </button>
                                                </li>
                                                <li>
                                                    <button
                                                        onClick={() => { handleSetViewMode('week'); setIsViewModeMenuOpen(false); }}
                                                        className={`w-full text-left px-3 py-1.5 text-sm rounded-md ${viewMode === 'week' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
                                                    >
                                                        Semaine
                                                    </button>
                                                </li>
                                            </ul>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={goToToday} className="px-3 py-1.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                    Aujourd'hui
                                </button>
                                <button onClick={goToPrevious} className="p-2 rounded-full hover:bg-gray-100">
                                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                                </button>
                                <button onClick={goToNext} className="p-2 rounded-full hover:bg-gray-100">
                                    <ChevronRight className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-md border overflow-hidden flex flex-col flex-grow">
                    <div className="grid grid-cols-7 border-b">
                        {daysOfWeek.map(day => (
                            <div key={day} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 flex-grow">
                        {calendarGrid.map((day, index) => {
                            const dateKey = day.toISOString().split('T')[0];
                            const isTodayCell = dateKey === today.toISOString().split('T')[0];
                            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                            return (
                                <DayCell
                                    key={index}
                                    day={day}
                                    transactions={transactionsByDate.get(dateKey) || []}
                                    isToday={isTodayCell}
                                    isCurrentMonth={isCurrentMonth}
                                    currencySettings={currencySettingsForView}
                                    todayDate={today}
                                    viewMode={viewMode}
                                    onTransactionClick={handleTransactionClick}
                                    onDayClick={handleDayClick}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScheduleView;
