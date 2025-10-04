import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import CashflowDetailDrawer from './CashflowDetailDrawer';
import { formatCurrency } from '../utils/formatting';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { useActiveProjectData, useCashflowChartData } from '../utils/selectors.jsx';
import { getTodayInTimezone, getStartOfWeek } from '../utils/budgetCalculations';
import { motion, AnimatePresence } from 'framer-motion';

const CashflowView = ({ isFocusMode = false }) => {
  const { dataState } = useData();
  const { uiState, uiDispatch } = useUI();
  const { settings, projects } = dataState;
  const { activeProjectId, timeUnit, horizonLength, periodOffset, activeQuickSelect } = uiState;
  const { activeProject } = useActiveProjectData(dataState, uiState);

  const [drawerData, setDrawerData] = useState({ isOpen: false, transactions: [], title: '' });
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const periodMenuRef = useRef(null);

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

  const handlePeriodChange = (direction) => {
    uiDispatch({ type: 'SET_PERIOD_OFFSET', payload: periodOffset + direction });
  };

  const handleQuickPeriodSelect = (quickSelectType) => {
    const today = getTodayInTimezone(settings.timezoneOffset);
    let payload;

    switch (quickSelectType) {
      case 'today':
        payload = { timeUnit: 'day', horizonLength: 1, periodOffset: 0, activeQuickSelect: 'today' };
        break;
      case 'week': {
        const dayOfWeek = today.getDay(); // Sunday=0, Monday=1, ...
        const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        payload = { timeUnit: 'day', horizonLength: 7, periodOffset: offsetToMonday, activeQuickSelect: 'week' };
        break;
      }
      case 'month': {
        const year = today.getFullYear();
        const month = today.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        
        const startOfWeekOfFirstDay = getStartOfWeek(firstDayOfMonth);
        const startOfWeekOfLastDay = getStartOfWeek(lastDayOfMonth);
        
        const horizon = Math.round((startOfWeekOfLastDay - startOfWeekOfFirstDay) / (1000 * 60 * 60 * 24 * 7)) + 1;
        
        const startOfCurrentWeek = getStartOfWeek(today);
        const offsetInTime = startOfWeekOfFirstDay - startOfCurrentWeek;
        const offsetInWeeks = Math.round(offsetInTime / (1000 * 60 * 60 * 24 * 7));

        payload = { timeUnit: 'week', horizonLength: horizon, periodOffset: offsetInWeeks, activeQuickSelect: 'month' };
        break;
      }
      case 'quarter': {
        const currentQuarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
        const firstDayOfQuarter = new Date(today.getFullYear(), currentQuarterStartMonth, 1);
        const currentFortnightStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() <= 15 ? 1 : 16);
        const targetFortnightStart = new Date(firstDayOfQuarter.getFullYear(), firstDayOfQuarter.getMonth(), 1);
        const monthsDiff = (currentFortnightStart.getFullYear() - targetFortnightStart.getFullYear()) * 12 + (currentFortnightStart.getMonth() - targetFortnightStart.getMonth());
        let fortnightOffset = -monthsDiff * 2;
        if (currentFortnightStart.getDate() > 15) {
            fortnightOffset -= 1;
        }
        payload = { timeUnit: 'fortnightly', horizonLength: 6, periodOffset: fortnightOffset, activeQuickSelect: 'quarter' };
        break;
      }
      case 'year': {
        const currentMonth = today.getMonth(); // 0-11
        const offsetToJanuary = -currentMonth;
        payload = { timeUnit: 'month', horizonLength: 12, periodOffset: offsetToJanuary, activeQuickSelect: 'year' };
        break;
      }
      case 'short_term': {
        payload = { timeUnit: 'annually', horizonLength: 3, periodOffset: 0, activeQuickSelect: 'short_term' };
        break;
      }
      case 'medium_term': {
        payload = { timeUnit: 'annually', horizonLength: 5, periodOffset: 0, activeQuickSelect: 'medium_term' };
        break;
      }
      case 'long_term': {
        payload = { timeUnit: 'annually', horizonLength: 10, periodOffset: 0, activeQuickSelect: 'long_term' };
        break;
      }
      default:
        return;
    }
    uiDispatch({ type: 'SET_QUICK_PERIOD', payload });
  };

  const currencySettingsForView = useMemo(() => ({
    ...settings,
    currency: activeProject?.currency || settings.currency,
    displayUnit: activeProject?.display_unit || settings.displayUnit,
    decimalPlaces: activeProject?.decimal_places ?? settings.decimalPlaces,
  }), [activeProject, settings]);

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
            case 'fortnightly': {
                const d = new Date(baseDate);
                let numFortnights = periodIndex;
                let currentMonth = d.getMonth();
                let isFirstHalf = d.getDate() === 1;
                const monthsToAdd = Math.floor(((isFirstHalf ? 0 : 1) + numFortnights) / 2);
                d.setMonth(currentMonth + monthsToAdd);
                const newIsFirstHalf = (((isFirstHalf ? 0 : 1) + numFortnights) % 2 + 2) % 2 === 0;
                d.setDate(newIsFirstHalf ? 1 : 16);
                periodStart.setTime(d.getTime());
                break;
            }
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
            case 'day':
                if (activeQuickSelect === 'week') {
                    const dayLabel = periodStart.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
                    label = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);
                } else {
                    label = periodStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
                }
                break;
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
  }, [timeUnit, horizonLength, periodOffset, activeQuickSelect, settings.timezoneOffset]);

  const chartData = useCashflowChartData(dataState, uiState, periods);

  const timeUnitLabels = { day: 'Jour', week: 'Semaine', fortnightly: 'Quinzaine', month: 'Mois', bimonthly: 'Bimestre', quarterly: 'Trimestre', semiannually: 'Semestre', annually: 'Année' };
  const periodLabel = useMemo(() => { if (periodOffset === 0) return 'Actuel'; const label = timeUnitLabels[timeUnit] || 'Période'; const plural = Math.abs(periodOffset) > 1 ? 's' : ''; return `${periodOffset > 0 ? '+' : ''}${periodOffset} ${label}${plural}`; }, [periodOffset, timeUnit, timeUnitLabels]);

  const quickPeriodOptions = [
    { id: 'today', label: 'Jour' },
    { id: 'week', label: 'Semaine' },
    { id: 'month', label: 'Mois' },
    { id: 'quarter', label: 'Trimestre' },
    { id: 'year', label: 'Année' },
    { id: 'short_term', label: 'CT (3a)' },
    { id: 'medium_term', label: 'MT (5a)' },
    { id: 'long_term', label: 'LT (10a)' },
  ];
  const selectedPeriodLabel = quickPeriodOptions.find(opt => opt.id === activeQuickSelect)?.label || 'Période';

  const getChartOptions = () => {
    if (!chartData || !chartData.labels || chartData.labels.length === 0) {
      return { title: { text: 'Aucune donnée à afficher', left: 'center', top: 'center' } };
    }

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', crossStyle: { color: '#999' } }
      },
      legend: {
        data: ['Encaissements', 'Décaissements', 'Solde de trésorerie'],
        top: 'bottom'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: [
        {
          type: 'category',
          data: chartData.labels,
          axisPointer: { type: 'shadow' }
        }
      ],
      yAxis: [
        {
          type: 'value',
          name: 'Flux',
          axisLabel: { formatter: (value) => formatCurrency(value, currencySettingsForView) }
        },
        {
          type: 'value',
          name: 'Solde',
          axisLabel: { formatter: (value) => formatCurrency(value, currencySettingsForView) }
        }
      ],
      series: [
        {
          name: 'Encaissements',
          type: 'bar',
          data: chartData.inflows.map(item => item.value),
          itemStyle: { color: '#22c55e' } // green-500
        },
        {
          name: 'Décaissements',
          type: 'bar',
          data: chartData.outflows.map(item => item.value),
          itemStyle: { color: '#ef4444' } // red-500
        },
        {
          name: 'Solde de trésorerie',
          type: 'line',
          yAxisIndex: 1,
          data: chartData.projectedBalance,
          smooth: true,
          itemStyle: { color: '#3b82f6' } // blue-500
        }
      ]
    };
  };

  const tableData = useMemo(() => {
    if (!chartData || !chartData.labels || !chartData.periodPositions) return [];
    return chartData.labels.map((label, index) => ({
      month: label,
      startBalance: chartData.periodPositions[index]?.initial,
      inflows: chartData.inflows[index]?.value,
      outflows: chartData.outflows[index]?.value,
      endBalance: chartData.periodPositions[index]?.final,
    }));
  }, [chartData]);

  return (
    <div className="h-full flex flex-col">
      {!isFocusMode && (
          <div className="mb-6 flex-shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                 <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <div className="flex items-center gap-2">
                        <button onClick={() => handlePeriodChange(-1)} className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-full transition-colors" title="Période précédente"><ChevronLeft size={18} /></button>
                        <span className="text-sm font-semibold text-gray-700 w-24 text-center" title="Décalage par rapport à la période actuelle">{periodLabel}</span>
                        <button onClick={() => handlePeriodChange(1)} className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-full transition-colors" title="Période suivante"><ChevronRight size={18} /></button>
                    </div>
                    <div className="relative" ref={periodMenuRef}>
                        <button 
                            onClick={() => setIsPeriodMenuOpen(p => !p)} 
                            className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors"
                        >
                            <span>{selectedPeriodLabel}</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${isPeriodMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {isPeriodMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="absolute left-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-20"
                                >
                                    <ul className="p-1">
                                        {quickPeriodOptions.map(option => (
                                            <li key={option.id}>
                                                <button
                                                    onClick={() => {
                                                        handleQuickPeriodSelect(option.id);
                                                        setIsPeriodMenuOpen(false);
                                                    }}
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
          </div>
      )}
      
      <div className="flex-grow min-h-0 bg-white p-6 rounded-lg shadow-sm border space-y-8">
        <div style={{ height: '400px' }}>
          <ReactECharts option={getChartOptions()} style={{ height: '100%', width: '100%' }} notMerge={true} lazyUpdate={true} />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 font-medium text-gray-500">Mois</th>
                <th className="px-6 py-3 font-medium text-gray-500 text-right">Trésorerie début de mois</th>
                <th className="px-6 py-3 font-medium text-green-600 text-right">Encaissements</th>
                <th className="px-6 py-3 font-medium text-red-600 text-right">Décaissements</th>
                <th className="px-6 py-3 font-medium text-gray-500 text-right">Trésorerie fin de mois</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tableData.map((row, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 font-medium text-gray-900">{row.month}</td>
                  <td className="px-6 py-4 text-right">{formatCurrency(row.startBalance, currencySettingsForView)}</td>
                  <td className="px-6 py-4 text-right text-green-600">{formatCurrency(row.inflows, currencySettingsForView)}</td>
                  <td className="px-6 py-4 text-right text-red-600">{formatCurrency(row.outflows, currencySettingsForView)}</td>
                  <td className="px-6 py-4 text-right font-semibold">{formatCurrency(row.endBalance, currencySettingsForView)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <CashflowDetailDrawer isOpen={drawerData.isOpen} onClose={() => setDrawerData({ isOpen: false, transactions: [], title: '' })} transactions={drawerData.transactions} title={drawerData.title} />
    </div>
  );
};

export default CashflowView;
