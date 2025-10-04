import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { useActiveProjectData, useScheduleData } from '../utils/selectors';
import { formatCurrency } from '../utils/formatting';
import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import CriticalityPicker from '../components/CriticalityPicker';

const OverduePage = () => {
    const { dataState } = useData();
    const { uiState, uiDispatch } = useUI();
    const { settings, categories } = dataState;

    const { actualTransactions } = useActiveProjectData(dataState, uiState);
    const { overdueTransactions } = useScheduleData(actualTransactions, settings);

    const subCategoryCriticalityMap = useMemo(() => {
        const map = new Map();
        if (categories && categories.expense) {
            for (const mainCat of categories.expense) {
                if (mainCat.subCategories) {
                    for (const subCat of mainCat.subCategories) {
                        map.set(subCat.name, subCat.criticality);
                    }
                }
            }
        }
        return map;
    }, [categories]);

    const groupedOverdue = useMemo(() => {
        const groups = {};
        overdueTransactions.forEach(tx => {
            const monthYear = new Date(tx.date).toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
            if (!groups[monthYear]) {
                groups[monthYear] = [];
            }
            groups[monthYear].push(tx);
        });
        for (const key in groups) {
            groups[key].sort((a, b) => new Date(a.date) - new Date(b.date));
        }
        return Object.entries(groups).sort((a, b) => {
            const dateA = new Date(a[1][0].date);
            const dateB = new Date(b[1][0].date);
            return new Date(dateB.getFullYear(), dateB.getMonth(), 1) - new Date(dateA.getFullYear(), dateA.getMonth(), 1);
        });
    }, [overdueTransactions]);

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

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                    Échéances en Retard
                </h1>
                <p className="text-gray-600 mt-2">Liste de toutes les transactions prévisionnelles dont la date d'échéance est dépassée.</p>
            </div>

            {groupedOverdue.length > 0 ? (
                <div className="space-y-8">
                    {groupedOverdue.map(([monthYear, transactions]) => (
                        <div key={monthYear}>
                            <h2 className="text-xl font-semibold text-gray-700 mb-4">{monthYear.charAt(0).toUpperCase() + monthYear.slice(1)}</h2>
                            <div className="space-y-3">
                                {transactions.map(tx => {
                                    const isPayable = tx.type === 'payable';
                                    const amountToDisplay = tx.remainingAmount;
                                    const currencyToUse = tx.currency || settings.currency;
                                    const customCurrencySettings = { ...settings, currency: currencyToUse };
                                    const daysOverdue = Math.floor((new Date() - new Date(tx.date)) / (1000 * 60 * 60 * 24));
                                    const criticality = isPayable ? subCategoryCriticalityMap.get(tx.category) : null;

                                    return (
                                        <div
                                            key={tx.id}
                                            role="button"
                                            tabIndex={0}
                                            onClick={(e) => handleTransactionClick(e, tx)}
                                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTransactionClick(e, tx); }}
                                            className="w-full text-left p-3 rounded-lg border border-gray-200 bg-white transition-colors hover:bg-gray-50 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${isPayable ? 'bg-red-100' : 'bg-yellow-100'}`}>
                                                        {isPayable ? <ArrowDown className="w-5 h-5 text-red-600" /> : <ArrowUp className="w-5 h-5 text-yellow-600" />}
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <div className="flex items-center gap-2">
                                                            {criticality && <CriticalityPicker value={criticality} onSelect={() => {}} />}
                                                            <p className="font-semibold truncate text-gray-800" title={tx.thirdParty}>{tx.thirdParty}</p>
                                                        </div>
                                                        <p className="text-xs text-gray-500 truncate" title={tx.description}>{tx.description || 'Pas de description'}</p>
                                                        <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                                                            <span>Échéance: {new Date(tx.date).toLocaleDateString('fr-FR')}</span>
                                                            <span className="font-bold text-red-600">({daysOverdue}j de retard)</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className={`text-lg font-semibold whitespace-nowrap pl-2 ${isPayable ? 'text-red-600' : 'text-yellow-600'}`}>{formatCurrency(amountToDisplay, customCurrencySettings)}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={CheckCircle}
                    title="Aucune échéance en retard !"
                    message="Félicitations, toutes vos transactions sont à jour."
                />
            )}
        </div>
    );
};

export default OverduePage;
