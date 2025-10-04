import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { useActiveProjectData } from '../utils/selectors.jsx';
import { formatCurrency } from '../utils/formatting';
import EmptyState from './EmptyState';
import { Lock, PiggyBank } from 'lucide-react';

const ProvisionItem = ({ provision, actuals, settings }) => {
    const totalProvisioned = useMemo(() => {
        const provisionActuals = actuals.filter(a => a.budgetId === provision.id && a.isProvision);
        return provisionActuals.reduce((sum, actual) => {
            return sum + (actual.payments || []).reduce((pSum, p) => pSum + p.paidAmount, 0);
        }, 0);
    }, [actuals, provision.id]);

    const remainingToProvision = provision.amount - totalProvisioned;
    const progress = provision.amount > 0 ? (totalProvisioned / provision.amount) * 100 : 0;
    const finalPaymentDate = new Date(provision.provisionDetails.finalPaymentDate);
    const today = new Date();
    const daysRemaining = Math.ceil((finalPaymentDate - today) / (1000 * 60 * 60 * 24));

    return (
        <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-semibold text-gray-800">{provision.supplier}</p>
                    <p className="text-sm text-gray-500">{provision.category}</p>
                </div>
                <div className="text-right">
                    <p className="text-lg font-bold text-indigo-600">{formatCurrency(provision.amount, settings)}</p>
                    <p className="text-xs text-gray-500">Total à provisionner</p>
                </div>
            </div>
            <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="flex justify-between text-xs mt-1">
                    <span className="text-green-600 font-medium">Provisionné: {formatCurrency(totalProvisioned, settings)}</span>
                    <span className="text-orange-600 font-medium">Restant: {formatCurrency(remainingToProvision, settings)}</span>
                </div>
            </div>
            <div className="mt-4 pt-3 border-t text-sm text-gray-600">
                Paiement final prévu le: <span className="font-semibold">{finalPaymentDate.toLocaleDateString('fr-FR')}</span>
                {daysRemaining > 0 ? ` (dans ${daysRemaining} jours)` : ' (passé)'}
            </div>
        </div>
    );
};

const ProvisionsView = () => {
    const { dataState } = useData();
    const { uiState } = useUI();
    const { settings } = dataState;
    const { budgetEntries, actualTransactions, isConsolidated, isCustomConsolidated } = useActiveProjectData(dataState, uiState);

    const provisions = useMemo(() => {
        return budgetEntries.filter(entry => entry.isProvision);
    }, [budgetEntries]);

    if (isConsolidated || isCustomConsolidated) {
        return (
            <div className="text-center p-8 text-gray-500">
                Le suivi des provisions est disponible uniquement pour les projets individuels.
            </div>
        );
    }

    return (
        <div>
            {provisions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {provisions.map(provision => (
                        <ProvisionItem key={provision.id} provision={provision} actuals={actualTransactions} settings={settings} />
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={PiggyBank}
                    title="Aucune provision en cours"
                    message="Utilisez la fonction 'Provision' lors de la création d'une dépense pour lisser son impact sur votre trésorerie."
                />
            )}
        </div>
    );
};

export default ProvisionsView;
