import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Layers, Eye, EyeOff, Archive, ChevronLeft, ChevronRight, List, ChevronDown } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import EmptyState from './EmptyState';
import { getTodayInTimezone, getStartOfWeek, getEntryAmountForPeriod, getActualAmountForPeriod, expandVatEntries, generateVatPaymentEntries, getDeclarationPeriods, generateTaxPaymentEntries } from '../utils/budgetCalculations';
import { useActiveProjectData } from '../utils/selectors';
import ScenarioEntriesDrawer from './ScenarioEntriesDrawer';
import { supabase } from '../utils/supabase';
import { v4 as uuidv4 } from 'uuid';
import { saveScenario, deleteScenarioEntry } from '../context/actions';
import { motion, AnimatePresence } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import { formatCurrency } from '../utils/formatting';
import { resolveScenarioEntries } from '../utils/scenarioCalculations';

const colorMap = {
  '#8b5cf6': { bg: 'bg-violet-50', text: 'text-violet-800', button: 'bg-violet-200 hover:bg-violet-300', line: '#8b5cf6' },
  '#f97316': { bg: 'bg-orange-50', text: 'text-orange-800', button: 'bg-orange-200 hover:bg-orange-300', line: '#f97316' },
  '#d946ef': { bg: 'bg-fuchsia-50', text: 'text-fuchsia-800', button: 'bg-fuchsia-200 hover:bg-fuchsia-300', line: '#d946ef' },
};
const defaultColors = colorMap['#8b5cf6'];

// --- Helper functions for chart data calculation (re-implemented to be self-contained) ---
const calculateMainCategoryTotals = (entries, period, actualTransactions) => {
    const budget = entries.reduce((sum, entry) => sum + getEntryAmountForPeriod(entry, period.startDate, period.endDate), 0);
    const actual = entries.reduce((sum, entry) => sum + getActualAmountForPeriod(entry, actualTransactions, period.startDate, period.endDate), 0);
    return { budget, actual };
};

const calculateOffBudgetTotalsForPeriod = (type, period, entries, actualTransactions) => {
    const offBudgetEntries = entries.filter(e => e.isOffBudget && e.type === type);
    const budget = offBudgetEntries.reduce((sum, entry) => sum + getEntryAmountForPeriod(entry, period.startDate, period.endDate), 0);
    const actual = offBudgetEntries.reduce((sum, entry) => sum + getActualAmountForPeriod(entry, actualTransactions, period.startDate, period.endDate), 0);
    return { budget, actual };
};

const calculateGeneralTotals = (mainCategories, period, type, allEntriesForCalc, actualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses) => {
    const totals = (mainCategories || []).reduce((acc, mainCategory) => {
      const categoryTotals = calculateMainCategoryTotals(mainCategory.entries, period, actualTransactions);
      acc.budget += categoryTotals.budget;
      acc.actual += categoryTotals.actual;
      return acc;
    }, { budget: 0, actual: 0 });

    if (type === 'entree' && hasOffBudgetRevenues) {
        const offBudgetTotals = calculateOffBudgetTotalsForPeriod('revenu', period, allEntriesForCalc, actualTransactions);
        totals.budget += offBudgetTotals.budget;
        totals.actual += offBudgetTotals.actual;
    } else if (type === 'sortie' && hasOffBudgetExpenses) {
        const offBudgetTotals = calculateOffBudgetTotalsForPeriod('depense', period, allEntriesForCalc, actualTransactions);
        totals.budget += offBudgetTotals.budget;
        totals.actual += offBudgetTotals.actual;
    }
    return totals;
};

const calculatePeriodPositions = (periods, cashAccounts, actualTransactions, groupedData, hasOffBudgetRevenues, hasOffBudgetExpenses, settings, allEntries) => {
    if (!periods || periods.length === 0 || !settings) return [];
    
    const today = getTodayInTimezone(settings.timezoneOffset);
    let todayIndex = periods.findIndex(p => today >= p.startDate && today < p.endDate);
    if (todayIndex === -1) {
        if (periods.length > 0 && today < periods[0].startDate) todayIndex = -1;
        else if (periods.length > 0 && today >= periods[periods.length - 1].endDate) todayIndex = periods.length - 1;
    }
    
    const firstPeriodStart = periods[0].startDate;
    const initialBalanceSum = cashAccounts.reduce((sum, acc) => sum + (parseFloat(acc.initialBalance) || 0), 0);
    
    const netFlowBeforeFirstPeriod = actualTransactions
      .flatMap(actual => actual.payments || [])
      .filter(p => new Date(p.paymentDate) < firstPeriodStart)
      .reduce((sum, p) => {
        const actual = actualTransactions.find(a => (a.payments || []).some(payment => payment.id === p.id));
        if (!actual) return sum;
        return actual.type === 'receivable' ? sum + p.paidAmount : sum - p.paidAmount;
      }, 0);
    
    const startingBalance = initialBalanceSum + netFlowBeforeFirstPeriod;

    const positions = [];
    let lastPeriodFinalPosition = startingBalance;
    
    for (let i = 0; i <= todayIndex; i++) {
        if (!periods[i]) continue;
        const period = periods[i];
        const revenueTotals = calculateGeneralTotals(groupedData.entree, period, 'entree', allEntries, actualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses);
        const expenseTotals = calculateGeneralTotals(groupedData.sortie, period, 'sortie', allEntries, actualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses);
        const netActual = revenueTotals.actual - expenseTotals.actual;
        const initialPosition = lastPeriodFinalPosition;
        const finalPosition = initialPosition + netActual;
        positions.push({ initial: initialPosition, final: finalPosition });
        lastPeriodFinalPosition = finalPosition;
    }
    
    if (todayIndex < periods.length - 1) {
        const unpaidStatuses = ['pending', 'partially_paid', 'partially_received'];
        const impayes = actualTransactions.filter(a => new Date(a.date) < today && unpaidStatuses.includes(a.status));
        const netImpayes = impayes.reduce((sum, actual) => {
            const totalPaid = (actual.payments || []).reduce((pSum, p) => pSum + p.paidAmount, 0);
            const remaining = actual.amount - totalPaid;
            return actual.type === 'receivable' ? sum + remaining : sum - remaining;
        }, 0);
        lastPeriodFinalPosition += netImpayes;
        
        for (let i = todayIndex + 1; i < periods.length; i++) {
            if (!periods[i]) continue;
            const period = periods[i];
            const revenueTotals = calculateGeneralTotals(groupedData.entree || [], period, 'entree', allEntries, actualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses);
            const expenseTotals = calculateGeneralTotals(groupedData.sortie, period, 'sortie', allEntries, actualTransactions, hasOffBudgetRevenues, hasOffBudgetExpenses);
            const netPlanned = revenueTotals.budget - expenseTotals.budget;
            const initialPosition = lastPeriodFinalPosition;
            const finalPosition = initialPosition + netPlanned;
            positions.push({ initial: initialPosition, final: finalPosition });
            lastPeriodFinalPosition = finalPosition;
        }
    }
    return positions;
};


const ScenarioView = ({ isFocusMode = false }) => {
  const { dataState, dataDispatch } = useData();
  const { uiState, uiDispatch } = useUI();
  const { projects, scenarios, settings, session, categories, scenarioEntries, vatRegimes, taxConfigs } = dataState;
  const { activeProjectId, timeUnit, horizonLength, periodOffset, activeQuickSelect } = uiState;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const periodMenuRef = useRef(null);

  const { budgetEntries, actualTransactions, cashAccounts, isConsolidated, isCustomConsolidated } = useActiveProjectData(dataState, uiState);

  const projectScenarios = useMemo(() => {
    if (isConsolidated) {
      const activeProjectIds = projects.filter(p => !p.isArchived).map(p => p.id);
      return scenarios
        .filter(s => activeProjectIds.includes(s.projectId) && !s.isArchived)
        .map(s => {
            const project = projects.find(p => p.id === s.projectId);
            return { ...s, displayName: `${s.name} (${project?.name || 'N/A'})` };
        });
    }
    return scenarios
      .filter(s => s.projectId === activeProjectId && !s.isArchived)
      .map(s => ({ ...s, displayName: s.name }));
  }, [scenarios, activeProjectId, isConsolidated, projects]);

  useEffect(() => {
    const handleClickOutside = (event) => {
        if (periodMenuRef.current && !periodMenuRef.current.contains(event.target)) {
            setIsPeriodMenuOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handlePeriodChange = (direction) => uiDispatch({ type: 'SET_PERIOD_OFFSET', payload: periodOffset + direction });
  
  const handleQuickPeriodSelect = (quickSelectType) => {
    const today = getTodayInTimezone(settings.timezoneOffset);
    let payload;
    switch (quickSelectType) {
      case 'today': payload = { timeUnit: 'day', horizonLength: 1, periodOffset: 0, activeQuickSelect: 'today' }; break;
      case 'week': { const dayOfWeek = today.getDay(); const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; payload = { timeUnit: 'day', horizonLength: 7, periodOffset: 0, activeQuickSelect: 'week' }; break; }
      case 'month': { payload = { timeUnit: 'month', horizonLength: 12, periodOffset: 0, activeQuickSelect: 'month' }; break; }
      case 'quarter': { payload = { timeUnit: 'quarterly', horizonLength: 4, periodOffset: 0, activeQuickSelect: 'quarter' }; break; }
      case 'year': { payload = { timeUnit: 'annually', horizonLength: 1, periodOffset: 0, activeQuickSelect: 'year' }; break; }
      case 'short_term': { payload = { timeUnit: 'annually', horizonLength: 3, periodOffset: 0, activeQuickSelect: 'short_term' }; break; }
      case 'medium_term': { payload = { timeUnit: 'annually', horizonLength: 5, periodOffset: 0, activeQuickSelect: 'medium_term' }; break; }
      case 'long_term': { payload = { timeUnit: 'annually', horizonLength: 10, periodOffset: 0, activeQuickSelect: 'long_term' }; break; }
      default: return;
    }
    uiDispatch({ type: 'SET_QUICK_PERIOD', payload });
  };

  const periods = useMemo(() => {
    const today = getTodayInTimezone(settings.timezoneOffset);
    let baseDate;
    switch (timeUnit) {
        case 'day': baseDate = new Date(today); baseDate.setHours(0,0,0,0); break;
        case 'week': baseDate = getStartOfWeek(today); break;
        case 'fortnightly': const day = today.getDate(); baseDate = new Date(today.getFullYear(), today.getMonth(), day <= 15 ? 1 : 16); break;
        case 'month': baseDate = new Date(today.getFullYear(), today.getMonth(), 1); break;
        case 'bimonthly': const bimonthStartMonth = Math.floor(today.getMonth() / 2) * 2; baseDate = new Date(today.getFullYear(), bimonthStartMonth, 1); break;
        case 'quarterly': const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3; baseDate = new Date(today.getFullYear(), quarterStartMonth, 1); break;
        case 'semiannually': const semiAnnualStartMonth = Math.floor(today.getMonth() / 6) * 6; baseDate = new Date(today.getFullYear(), semiAnnualStartMonth, 1); break;
        case 'annually': baseDate = new Date(today.getFullYear(), 0, 1); break;
        default: baseDate = getStartOfWeek(today);
    }
    const periodList = [];
    for (let i = 0; i < horizonLength; i++) {
        const periodIndex = i + periodOffset;
        const periodStart = new Date(baseDate);
        switch (timeUnit) {
            case 'day': periodStart.setDate(periodStart.getDate() + periodIndex); break;
            case 'week': periodStart.setDate(periodStart.getDate() + periodIndex * 7); break;
            case 'fortnightly': { const d = new Date(baseDate); let numFortnights = periodIndex; let currentMonth = d.getMonth(); let isFirstHalf = d.getDate() === 1; const monthsToAdd = Math.floor(((isFirstHalf ? 0 : 1) + numFortnights) / 2); d.setMonth(currentMonth + monthsToAdd); const newIsFirstHalf = (((isFirstHalf ? 0 : 1) + numFortnights) % 2 + 2) % 2 === 0; d.setDate(newIsFirstHalf ? 1 : 16); periodStart.setTime(d.getTime()); break; }
            case 'month': periodStart.setMonth(periodStart.getMonth() + periodIndex); break;
            case 'bimonthly': periodStart.setMonth(periodStart.getMonth() + periodIndex * 2); break;
            case 'quarterly': periodStart.setMonth(periodStart.getMonth() + periodIndex * 3); break;
            case 'semiannually': periodStart.setMonth(periodStart.getMonth() + periodIndex * 6); break;
            case 'annually': periodStart.setFullYear(periodStart.getFullYear() + periodIndex); break;
        }
        periodList.push(periodStart);
    }
    return periodList.map((periodStart) => {
        const periodEnd = new Date(periodStart);
        switch (timeUnit) {
            case 'day': periodEnd.setDate(periodEnd.getDate() + 1); break;
            case 'week': periodEnd.setDate(periodEnd.getDate() + 7); break;
            case 'fortnightly': if (periodStart.getDate() === 1) { periodEnd.setDate(16); } else { periodEnd.setMonth(periodEnd.getMonth() + 1); periodEnd.setDate(1); } break;
            case 'month': periodEnd.setMonth(periodEnd.getMonth() + 1); break;
            case 'bimonthly': periodEnd.setMonth(periodEnd.getMonth() + 2); break;
            case 'quarterly': periodEnd.setMonth(periodEnd.getMonth() + 3); break;
            case 'semiannually': periodEnd.setMonth(periodEnd.getMonth() + 6); break;
            case 'annually': periodEnd.setFullYear(periodEnd.getFullYear() + 1); break;
        }
        const year = periodStart.toLocaleDateString('fr-FR', { year: '2-digit' });
        const monthsShort = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        let label = '';
        switch (timeUnit) {
            case 'day': const dayLabel = periodStart.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' }); label = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1); break;
            case 'week': label = `S ${periodStart.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}`; break;
            case 'fortnightly': const fortnightNum = periodStart.getDate() === 1 ? '1' : '2'; label = `${fortnightNum}Q-${monthsShort[periodStart.getMonth()]}'${year}`; break;
            case 'month': label = `${periodStart.toLocaleString('fr-FR', { month: 'short' })} '${year}`; break;
            case 'bimonthly': const startMonthB = monthsShort[periodStart.getMonth()]; const endMonthB = monthsShort[(periodStart.getMonth() + 1) % 12]; label = `${startMonthB}-${endMonthB}`; break;
            case 'quarterly': const quarter = Math.floor(periodStart.getMonth() / 3) + 1; label = `T${quarter} '${year}`; break;
            case 'semiannually': const semester = Math.floor(periodStart.getMonth() / 6) + 1; label = `S${semester} '${year}`; break;
            case 'annually': label = String(periodStart.getFullYear()); break;
        }
        return { label, startDate: periodStart, endDate: periodEnd };
    });
  }, [timeUnit, horizonLength, periodOffset, settings.timezoneOffset]);
  
  const chartData = useMemo(() => {
    if (!periods || periods.length === 0 || !categories || isConsolidated || isCustomConsolidated) {
      return { labels: [], series: [] };
    }
    const calculateProjectionForEntries = (currentEntries) => {
        let processedEntries = expandVatEntries(currentEntries, categories);
        const vatRegime = vatRegimes[activeProjectId];
        if (vatRegime) {
            const dynamicVatEntries = periods.flatMap(period => generateVatPaymentEntries(processedEntries, period, vatRegime));
            processedEntries.push(...dynamicVatEntries);
        }
        if (taxConfigs && taxConfigs.length > 0) {
            const currentYear = periods[0].startDate.getFullYear();
            const dynamicTaxEntries = taxConfigs.flatMap(taxConfig => {
                const taxPeriods = getDeclarationPeriods(currentYear, taxConfig.declaration_periodicity);
                return taxPeriods.flatMap(taxPeriod => {
                    const overlaps = periods.some(p => p.startDate < taxPeriod.endDate && p.endDate > taxPeriod.startDate);
                    return overlaps ? generateTaxPaymentEntries(actualTransactions, taxPeriod, taxConfig) : [];
                });
            });
            processedEntries.push(...dynamicTaxEntries);
        }
        const isRowVisibleInPeriods = (entry) => {
            for (const period of periods) {
                if (getEntryAmountForPeriod(entry, period.startDate, period.endDate) > 0 || getActualAmountForPeriod(entry, actualTransactions, period.startDate, period.endDate) > 0) return true;
            }
            return false;
        };
        const groupByType = (type) => {
            const catType = type === 'entree' ? 'revenue' : 'expense';
            const entriesForType = processedEntries.filter(e => e.type === (type === 'entree' ? 'revenu' : 'depense'));
            return categories[catType].map(mainCat => {
                if (!mainCat || !Array.isArray(mainCat.subCategories)) return null;
                const entriesForMainCat = entriesForType.filter(entry => mainCat.subCategories.some(sc => sc && sc.name === entry.category) || ((entry.is_vat_child || entry.is_vat_payment || entry.is_tax_payment) && mainCat.name === 'Impôts & Contributions'));
                if (entriesForMainCat.length === 0) return null;
                const visibleEntries = entriesForMainCat.filter(isRowVisibleInPeriods);
                if (visibleEntries.length === 0) return null;
                return { ...mainCat, entries: visibleEntries };
            }).filter(Boolean);
        };
        const groupedData = { entree: groupByType('entree'), sortie: groupByType('sortie') };
        const hasOffBudgetRevenues = processedEntries.some(e => e.isOffBudget && e.type === 'revenu');
        const hasOffBudgetExpenses = processedEntries.some(e => e.isOffBudget && e.type === 'depense');
        const periodPositions = calculatePeriodPositions(periods, cashAccounts, actualTransactions, groupedData, hasOffBudgetRevenues, hasOffBudgetExpenses, settings, processedEntries);
        return periodPositions.map(p => p.final);
    };
    const baseProjection = calculateProjectionForEntries(budgetEntries);
    const baseSeries = {
        name: 'Budget de base',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: baseProjection,
        lineStyle: { width: 3, color: '#6b7280' },
        itemStyle: { color: '#6b7280' }
    };
    const visibleScenarios = projectScenarios.filter(s => s.isVisible);
    const scenarioSeries = visibleScenarios.map(scenario => {
        const deltas = scenarioEntries[scenario.id] || [];
        const resolvedEntries = resolveScenarioEntries(budgetEntries, deltas);
        const projection = calculateProjectionForEntries(resolvedEntries);
        return {
            name: scenario.name,
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 8,
            data: projection,
            lineStyle: { width: 3, color: scenario.color },
            itemStyle: { color: scenario.color }
        };
    });
    return {
        labels: periods.map(p => p.label),
        series: [baseSeries, ...scenarioSeries]
    };
  }, [periods, budgetEntries, actualTransactions, cashAccounts, categories, projectScenarios, scenarioEntries, settings, activeProjectId, vatRegimes, taxConfigs, isConsolidated, isCustomConsolidated]);

  const getChartOptions = () => {
      if (!chartData || chartData.series.length === 0) {
          return { title: { text: 'Aucune donnée à afficher', subtext: 'Sélectionnez un projet individuel pour voir les scénarios.', left: 'center', top: 'center' } };
      }
      const allDataPoints = chartData.series.flatMap(s => s.data).filter(d => d !== null && !isNaN(d));
      if (allDataPoints.length === 0) {
        return { title: { text: 'Aucune donnée numérique à afficher', left: 'center', top: 'center' } };
      }
      const dataMin = Math.min(...allDataPoints);
      const dataMax = Math.max(...allDataPoints);
      const range = dataMax - dataMin;
      const buffer = range === 0 ? Math.abs(dataMax * 0.1) || 100 : range * 0.2;
      const yAxisMin = dataMin - buffer;
      const yAxisMax = dataMax + buffer;
      return {
          tooltip: { trigger: 'axis' },
          legend: { data: chartData.series.map(s => s.name), bottom: 0, type: 'scroll' },
          grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
          xAxis: { type: 'category', data: chartData.labels, boundaryGap: false },
          yAxis: { 
            type: 'value', 
            axisLabel: { formatter: (value) => formatCurrency(value, settings) },
            min: yAxisMin,
            max: yAxisMax,
          },
          series: chartData.series,
      };
  };

  const handleOpenScenarioModal = (scenario = null) => uiDispatch({ type: 'OPEN_SCENARIO_MODAL', payload: scenario });
  const handleDeleteScenario = (scenarioId) => uiDispatch({ type: 'OPEN_CONFIRMATION_MODAL', payload: { title: 'Supprimer ce scénario ?', message: 'Cette action est irréversible.', onConfirm: () => deleteScenario({dataDispatch, uiDispatch}, scenarioId) } });
  const handleArchiveScenario = (scenarioId) => {
    const scenarioToArchive = scenarios.find(s => s.id === scenarioId);
    if (!scenarioToArchive) return;
    uiDispatch({ type: 'OPEN_CONFIRMATION_MODAL', payload: { title: `Archiver le scénario "${scenarioToArchive.name}" ?`, message: "L'archivage d'un scénario le masquera de la liste, mais toutes ses données seront conservées. Vous pourrez le restaurer à tout moment.", onConfirm: () => dataDispatch({ type: 'ARCHIVE_SCENARIO', payload: scenarioId }), confirmText: 'Archiver', cancelText: 'Annuler', confirmColor: 'primary' } });
  };
  
  const handleSaveScenarioEntry = async (entryData, scenarioId, editingEntry) => {
    const user = session?.user;
    if (!user) { uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Utilisateur non authentifié.', type: 'error' } }); return; }
    try {
        const entryId = editingEntry ? editingEntry.id : uuidv4();
        const dataToSave = { 
            scenario_id: scenarioId, 
            id: entryId, 
            user_id: user.id, 
            type: entryData.type, 
            category: entryData.category, 
            frequency: entryData.frequency, 
            amount: entryData.amount, 
            date: entryData.date || null, 
            start_date: entryData.startDate || null, 
            end_date: entryData.endDate || null, 
            supplier: entryData.supplier, 
            description: entryData.description, 
            is_deleted: false, 
            payments: entryData.payments 
        };
        const { data: savedEntry, error } = await supabase.from('scenario_entries').upsert(dataToSave, { onConflict: 'scenario_id,id' }).select().single();
        if (error) throw error;
        const savedEntryForClient = { 
            id: savedEntry.id, 
            type: savedEntry.type, 
            category: savedEntry.category, 
            frequency: savedEntry.frequency, 
            amount: savedEntry.amount, 
            date: savedEntry.date, 
            startDate: savedEntry.start_date, 
            endDate: savedEntry.end_date, 
            supplier: savedEntry.supplier, 
            description: savedEntry.description, 
            isDeleted: savedEntry.is_deleted, 
            payments: savedEntry.payments 
        };
        dataDispatch({ type: 'SAVE_SCENARIO_ENTRY_SUCCESS', payload: { scenarioId: scenarioId, savedEntry: savedEntryForClient } });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Modification du scénario enregistrée.', type: 'success' } });
    } catch (error) { uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } }); }
  };
  
  const handleAddEntryToScenario = (scenario) => {
    const onSave = (entryData) => handleSaveScenarioEntry(entryData, scenario.id, null);
    uiDispatch({ type: 'OPEN_BUDGET_DRAWER', payload: { onSave } });
  };
  
  const handleToggleVisibility = (scenarioId) => dataDispatch({ type: 'TOGGLE_SCENARIO_VISIBILITY', payload: scenarioId });
  const handleOpenDrawer = (scenario) => { setSelectedScenario(scenario); setIsDrawerOpen(true); };
  const handleCloseDrawer = () => { setIsDrawerOpen(false); setSelectedScenario(null); };

  const handleAddEntryInDrawer = () => {
    if (!selectedScenario) return;
    const onSave = (entryData) => handleSaveScenarioEntry(entryData, selectedScenario.id, null);
    uiDispatch({ type: 'OPEN_BUDGET_DRAWER', payload: { onSave } });
  };

  const handleEditEntryInDrawer = (entry) => {
      if (!selectedScenario) return;
      const onSave = (entryData) => handleSaveScenarioEntry(entryData, selectedScenario.id, entry);
      const onDelete = () => handleDeleteEntryInDrawer(entry.id);
      uiDispatch({ type: 'OPEN_BUDGET_DRAWER', payload: { entry, onSave, onDelete } });
  };

  const handleDeleteEntryInDrawer = (entryId) => { if (!selectedScenario) return; uiDispatch({ type: 'OPEN_CONFIRMATION_MODAL', payload: { title: 'Supprimer cette modification ?', message: "Cette modification sera retirée du scénario.", onConfirm: () => deleteScenarioEntry({dataDispatch, uiDispatch}, { scenarioId: selectedScenario.id, entryId }) } }); };
  
  const quickPeriodOptions = [
    { id: 'today', label: 'Jour' }, { id: 'week', label: 'Semaine' }, { id: 'month', label: 'Mois' },
    { id: 'quarter', label: 'Trimestre' }, { id: 'year', label: 'Année' }, { id: 'short_term', label: 'CT (3a)' },
    { id: 'medium_term', label: 'MT (5a)' }, { id: 'long_term', label: 'LT (10a)' },
  ];
  const selectedPeriodLabel = quickPeriodOptions.find(opt => opt.id === activeQuickSelect)?.label || 'Période';
  const timeUnitLabels = { day: 'Jour', week: 'Semaine', fortnightly: 'Quinzaine', month: 'Mois', bimonthly: 'Bimestre', quarterly: 'Trimestre', semiannually: 'Semestre', annually: 'Année' };
  const periodLabel = useMemo(() => { if (periodOffset === 0) return 'Actuel'; const label = timeUnitLabels[timeUnit] || 'Période'; const plural = Math.abs(periodOffset) > 1 ? 's' : ''; return `${periodOffset > 0 ? '+' : ''}${periodOffset} ${label}${plural}`; }, [periodOffset, timeUnit, timeUnitLabels]);

  return (
    <div className={isFocusMode ? "h-full flex flex-col" : "p-6 max-w-full flex flex-col h-full"}>
      <div className="bg-white p-6 rounded-lg shadow mb-8 flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Vos Scénarios</h2>
          {projectScenarios.length < 3 && (<button onClick={() => handleOpenScenarioModal()} disabled={isConsolidated || isCustomConsolidated} className="bg-accent-600 hover:bg-accent-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"><Plus className="w-5 h-5" /> Nouveau Scénario</button>)}
        </div>
        <div className="space-y-3">
          {projectScenarios.length > 0 ? (projectScenarios.map(scenario => { const colors = colorMap[scenario.color] || defaultColors; return (
              <div key={scenario.id} className={`p-4 border rounded-lg flex justify-between items-center ${colors.bg}`}>
                <div><h3 className={`font-bold ${colors.text}`}>{scenario.displayName}</h3><p className={`text-sm ${colors.text}`}>{scenario.description}</p></div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggleVisibility(scenario.id)} className="p-2 text-gray-500 hover:text-gray-800" title={scenario.isVisible ? "Masquer" : "Afficher"}><div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: scenario.isVisible ? scenario.color : '#ccc' }} /></button>
                  <button onClick={() => handleOpenDrawer(scenario)} disabled={isConsolidated || isCustomConsolidated} className="p-2 text-sm rounded-md flex items-center gap-1 bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed" title="Gérer les écritures"><List className="w-4 h-4" /><span>Gérer</span></button>
                  <button onClick={() => handleAddEntryToScenario(scenario)} disabled={isConsolidated || isCustomConsolidated} className={`p-2 text-sm rounded-md flex items-center gap-1 ${colors.button} ${colors.text} disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed`}><Plus className="w-4 h-4" /> Ajouter</button>
                  <button onClick={() => handleOpenScenarioModal(scenario)} disabled={isConsolidated || isCustomConsolidated} className="p-2 text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleArchiveScenario(scenario.id)} disabled={isConsolidated || isCustomConsolidated} className="p-2 text-yellow-600 hover:text-yellow-800 disabled:opacity-50 disabled:cursor-not-allowed" title="Archiver"><Archive className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteScenario(scenario.id)} disabled={isConsolidated || isCustomConsolidated} className="p-2 text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ); })) : (<EmptyState icon={Layers} title="Aucun scénario" message="Créez des simulations pour comparer des hypothèses." actionText={isConsolidated || isCustomConsolidated ? undefined : "Nouveau Scénario"} onActionClick={isConsolidated || isCustomConsolidated ? undefined : () => handleOpenScenarioModal()} />)}
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow flex-grow flex flex-col">
        <div className="flex-shrink-0 mb-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2">
                <button onClick={() => handlePeriodChange(-1)} className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-full transition-colors" title="Précédent"><ChevronLeft size={18} /></button>
                <span className="text-sm font-semibold text-gray-700 w-24 text-center">{periodLabel}</span>
                <button onClick={() => handlePeriodChange(1)} className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-full transition-colors" title="Suivant"><ChevronRight size={18} /></button>
            </div>
            <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
            <div className="relative" ref={periodMenuRef}>
                <button onClick={() => setIsPeriodMenuOpen(p => !p)} className="flex items-center gap-2 px-3 h-9 rounded-md bg-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-300 transition-colors">
                    <span>{selectedPeriodLabel}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isPeriodMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                    {isPeriodMenuOpen && (
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }} className="absolute left-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
                            <ul className="p-1">
                                {quickPeriodOptions.map(option => (
                                    <li key={option.id}>
                                        <button
                                            onClick={() => { handleQuickPeriodSelect(option.id); setIsPeriodMenuOpen(false); }}
                                            className={`w-full text-left px-3 py-1.5 text-sm rounded-md ${activeQuickSelect === option.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
                                        >
                                            {option.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
          </div>
        </div>
        <div className="flex-grow min-h-[400px]">
            <ReactECharts option={getChartOptions()} style={{ height: '600px', width: '100%' }} notMerge={true} lazyUpdate={true} />
        </div>
      </div>
      <ScenarioEntriesDrawer isOpen={isDrawerOpen} onClose={handleCloseDrawer} scenario={selectedScenario} onAddEntry={handleAddEntryInDrawer} onEditEntry={handleEditEntryInDrawer} onDeleteEntry={handleDeleteEntryInDrawer} />
    </div>
  );
};

export default ScenarioView;
