import React from 'react';
import { X, Edit, Trash2, Calendar, User, Tag, Repeat, Info, DollarSign } from 'lucide-react';
import { useUI } from '../context/UIContext';
import { useData } from '../context/DataContext';
import { formatCurrency } from '../utils/formatting';

const DetailItem = ({ icon: Icon, label, value, children }) => (
    <div className="flex items-start gap-3 py-2">
        <Icon className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
        <div className="flex-grow">
            <p className="text-sm text-gray-500">{label}</p>
            {children || <p className="font-medium text-gray-800">{value || '-'}</p>}
        </div>
    </div>
);

const BudgetEntryDetailDrawer = ({ onDelete }) => {
    const { uiState, uiDispatch } = useUI();
    const { dataState } = useData();
    const { settings, projects } = dataState;
    const { isBudgetEntryDetailDrawerOpen, budgetEntryForDetail: entry } = uiState;

    const onClose = () => uiDispatch({ type: 'CLOSE_BUDGET_ENTRY_DETAIL_DRAWER' });

    const handleEdit = (entry) => {
        uiDispatch({ type: 'OPEN_BUDGET_DRAWER', payload: entry });
    };

    if (!isBudgetEntryDetailDrawerOpen || !entry) return null;

    const project = projects.find(p => p.id === entry.projectId);
    const projectCurrency = project?.currency || settings.currency;
    const currencySettingsForProject = { ...settings, currency: projectCurrency };

    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('fr-FR') : 'Indéterminée';
    
    const periodString = entry.frequency === 'ponctuel' 
        ? formatDate(entry.date)
        : `${formatDate(entry.startDate)} - ${formatDate(entry.endDate)}`;

    return (
        <>
            <div className={`fixed inset-0 bg-black z-40 transition-opacity ${isBudgetEntryDetailDrawerOpen ? 'bg-opacity-60' : 'bg-opacity-0 pointer-events-none'}`} onClick={onClose}></div>
            <div className={`fixed top-0 right-0 bottom-0 w-full max-w-lg bg-gray-50 shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isBudgetEntryDetailDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between p-4 border-b bg-white">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">Détail de l'écriture</h2>
                            <p className="text-sm text-gray-500 truncate max-w-xs">{entry.supplier}</p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-100"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="flex-grow p-6 overflow-y-auto">
                        <div className="space-y-4">
                            <DetailItem icon={Tag} label="Sous-catégorie" value={entry.category} />
                            <DetailItem icon={Info} label="Description" value={entry.description} />
                            <DetailItem icon={User} label="Tiers" value={entry.supplier} />
                            <DetailItem icon={Repeat} label="Fréquence" value={entry.frequency} />
                            <DetailItem icon={Calendar} label="Période" value={periodString} />
                            <DetailItem icon={DollarSign} label="Montant">
                                <p className="font-bold text-lg text-gray-800">{formatCurrency(entry.amount, currencySettingsForProject)}</p>
                                {entry.currency && entry.currency !== projectCurrency && (
                                    <p className="text-sm text-gray-500">
                                        (Origine: {formatCurrency(entry.original_amount, { ...settings, currency: entry.currency })})
                                    </p>
                                )}
                            </DetailItem>
                        </div>
                    </div>
                    <div className="p-4 border-t bg-white flex justify-end gap-3">
                        <button onClick={() => { handleEdit(entry); onClose(); }} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                            <Edit size={16} /> Modifier
                        </button>
                        <button onClick={() => { onDelete(entry); onClose(); }} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700">
                            <Trash2 size={16} /> Supprimer
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default BudgetEntryDetailDrawer;
