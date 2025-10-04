import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { useActiveProjectData } from '../utils/selectors';
import { expandVatEntries, getEntryAmountForPeriod } from '../utils/budgetCalculations';
import { formatCurrency } from '../utils/formatting';
import { Hash, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

const VatTablePage = () => {
    const { dataState } = useData();
    const { uiState } = useUI();
    const { categories, settings } = dataState;
    const { budgetEntries, isConsolidated, isCustomConsolidated } = useActiveProjectData(dataState, uiState);

    const [year, setYear] = useState(new Date().getFullYear());

    const monthlyVatData = useMemo(() => {
        if (!budgetEntries || !categories) return [];

        const expanded = expandVatEntries(budgetEntries, categories);
        const data = [];

        for (let i = 0; i < 12; i++) {
            const periodStart = new Date(year, i, 1);
            const periodEnd = new Date(year, i + 1, 0);
            periodEnd.setHours(23, 59, 59, 999);

            const tvaCollectee = expanded
                .filter(e => e.category === 'TVA collectée')
                .reduce((sum, entry) => sum + getEntryAmountForPeriod(entry, periodStart, periodEnd), 0);

            const tvaDeductible = expanded
                .filter(e => e.category === 'TVA déductible')
                .reduce((sum, entry) => sum + getEntryAmountForPeriod(entry, periodStart, periodEnd), 0);

            const netVat = tvaCollectee - tvaDeductible;

            data.push({
                month: periodStart.toLocaleString('fr-FR', { month: 'short' }),
                tvaCollectee,
                tvaDeductible,
                tvaAPayer: Math.max(0, netVat),
                creditTva: Math.max(0, -netVat),
            });
        }
        return data;
    }, [budgetEntries, categories, year]);

    const totals = useMemo(() => {
        return monthlyVatData.reduce((acc, monthData) => {
            acc.tvaCollectee += monthData.tvaCollectee;
            acc.tvaDeductible += monthData.tvaDeductible;
            acc.tvaAPayer += monthData.tvaAPayer;
            acc.creditTva += monthData.creditTva;
            return acc;
        }, { tvaCollectee: 0, tvaDeductible: 0, tvaAPayer: 0, creditTva: 0 });
    }, [monthlyVatData]);

    if (isConsolidated || isCustomConsolidated) {
        return (
            <div className="p-6">
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold">Vue Consolidée</h4>
                        <p className="text-sm">Le tableau de TVA est disponible uniquement pour les projets individuels.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Hash className="w-8 h-8 text-green-600" />
                    Tableau de TVA
                </h1>
                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border shadow-sm">
                    <button onClick={() => setYear(y => y - 1)} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-lg font-semibold text-gray-700 w-16 text-center">{year}</span>
                    <button onClick={() => setYear(y => y + 1)} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr className="border-b">
                            <th className="py-3 px-4 text-left font-semibold text-gray-600 sticky left-0 bg-gray-50 z-10">Indicateur</th>
                            {monthlyVatData.map(data => (
                                <th key={data.month} className="py-3 px-4 text-right font-medium text-gray-500">{data.month}</th>
                            ))}
                            <th className="py-3 px-4 text-right font-semibold text-gray-600 bg-gray-100 sticky right-0">Total Annuel</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        <tr className="hover:bg-gray-50 group">
                            <td className="py-3 px-4 font-medium text-gray-700 sticky left-0 bg-white group-hover:bg-gray-50 z-10">TVA Collectée</td>
                            {monthlyVatData.map((data, i) => <td key={i} className="py-3 px-4 text-right text-green-600">{formatCurrency(data.tvaCollectee, settings)}</td>)}
                            <td className="py-3 px-4 text-right font-bold text-green-700 bg-gray-100 sticky right-0">{formatCurrency(totals.tvaCollectee, settings)}</td>
                        </tr>
                        <tr className="hover:bg-gray-50 group">
                            <td className="py-3 px-4 font-medium text-gray-700 sticky left-0 bg-white group-hover:bg-gray-50 z-10">TVA Déductible</td>
                            {monthlyVatData.map((data, i) => <td key={i} className="py-3 px-4 text-right text-red-600">{formatCurrency(data.tvaDeductible, settings)}</td>)}
                            <td className="py-3 px-4 text-right font-bold text-red-700 bg-gray-100 sticky right-0">{formatCurrency(totals.tvaDeductible, settings)}</td>
                        </tr>
                        <tr className="bg-gray-100 font-semibold">
                            <td className="py-3 px-4 text-gray-800 sticky left-0 bg-gray-100 z-10">TVA à Payer</td>
                            {monthlyVatData.map((data, i) => <td key={i} className="py-3 px-4 text-right text-gray-800">{formatCurrency(data.tvaAPayer, settings)}</td>)}
                            <td className="py-3 px-4 text-right font-extrabold text-gray-900 bg-gray-200 sticky right-0">{formatCurrency(totals.tvaAPayer, settings)}</td>
                        </tr>
                        <tr className="hover:bg-gray-50 group">
                            <td className="py-3 px-4 font-medium text-gray-700 sticky left-0 bg-white group-hover:bg-gray-50 z-10">Crédit de TVA</td>
                            {monthlyVatData.map((data, i) => <td key={i} className="py-3 px-4 text-right text-blue-600">{formatCurrency(data.creditTva, settings)}</td>)}
                            <td className="py-3 px-4 text-right font-bold text-blue-700 bg-gray-100 sticky right-0">{formatCurrency(totals.creditTva, settings)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default VatTablePage;
