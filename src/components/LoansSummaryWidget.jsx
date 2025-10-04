import React from 'react';
import { formatCurrency } from '../utils/formatting';
import EmptyState from './EmptyState';

const LoansSummaryWidget = ({ title, icon: Icon, loans, currencySettings, type }) => {

    if (!loans || loans.length === 0) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Icon className="w-5 h-5 text-blue-600" />
                    {title}
                </h2>
                <EmptyState 
                    icon={Icon}
                    title={`Aucun ${type === 'borrowing' ? 'remboursement à venir' : 'encaissement de prêt à venir'}`}
                    message={`Les prochaines échéances de vos ${type === 'borrowing' ? 'emprunts' : 'prêts'} apparaîtront ici.`}
                />
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Icon className="w-5 h-5 text-blue-600" />
                {title}
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                {loans.map(loan => (
                    <div key={loan.id} className="p-3 border rounded-lg bg-gray-50/50">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold text-gray-700 text-sm">{loan.thirdParty}</p>
                                <p className="text-xs text-gray-500">{loan.category}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-base text-gray-800">{formatCurrency(loan.totalRemaining, currencySettings)}</p>
                                <p className="text-xs text-gray-500">restant</p>
                            </div>
                        </div>
                        <div className="mt-2 pt-2 border-t text-xs text-gray-600">
                            <span>{loan.remainingInstallments} mensualité{loan.remainingInstallments > 1 ? 's' : ''} de </span>
                            <span className="font-semibold">{formatCurrency(loan.installmentAmount, currencySettings)}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LoansSummaryWidget;
