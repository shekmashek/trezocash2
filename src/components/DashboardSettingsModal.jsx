import React, { useState, useEffect } from 'react';
import { X, Save, Settings, Eye, EyeOff } from 'lucide-react';

const widgetConfig = [
    { type: 'group', label: 'Indicateurs Clés (KPIs)' },
    { id: 'kpi_actionable_balance', label: 'Trésorerie Actionnable', indent: true },
    { id: 'kpi_overdue_payables', label: 'Dettes en Retard', indent: true },
    { id: 'kpi_overdue_receivables', label: 'Créances en Retard', indent: true },
    { id: 'kpi_savings', label: 'Épargne', indent: true },
    { id: 'kpi_provisions', label: 'Provisions', indent: true },
    { id: 'kpi_borrowings', label: 'Emprunts à rembourser', indent: true },
    { id: 'kpi_lendings', label: 'Prêts à recevoir', indent: true },
    { type: 'divider' },
    { id: 'alerts', label: 'Alertes intelligentes' },
    { id: 'priorities', label: 'Actions prioritaires' },
    { id: 'trezo_score', label: 'Score Trézo' },
    { id: '30_day_forecast', label: 'Prévision sur 30 jours' },
    { id: 'monthly_budget', label: 'Budget du mois en cours' },
    { id: 'loans', label: 'Résumé des emprunts et prêts' },
    { id: 'actions', label: 'Raccourcis d\'actions' },
    { id: 'tutorials', label: 'Tutoriels vidéo' },
];

const DashboardSettingsModal = ({ isOpen, onClose, initialWidgetSettings, onSave }) => {
    const [localSettings, setLocalSettings] = useState(initialWidgetSettings);

    useEffect(() => {
        if (isOpen) {
            setLocalSettings(initialWidgetSettings);
        }
    }, [isOpen, initialWidgetSettings]);

    const handleToggle = (id) => {
        setLocalSettings(prev => ({ ...prev, [id]: !prev[id] }));
    };
    
    const handleToggleAll = (visible) => {
        const newSettings = {};
        widgetConfig.forEach(widget => {
            if (widget.id) {
                newSettings[widget.id] = visible;
            }
        });
        setLocalSettings(newSettings);
    };

    const handleSaveClick = () => {
        onSave(localSettings);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-blue-600" />
                        Personnaliser le Tableau de Bord
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    <div className="flex justify-end gap-2 mb-4">
                        <button onClick={() => handleToggleAll(true)} className="text-xs font-semibold flex items-center gap-1 text-blue-600 hover:underline"><Eye size={14} /> Tout afficher</button>
                        <button onClick={() => handleToggleAll(false)} className="text-xs font-semibold flex items-center gap-1 text-gray-500 hover:underline"><EyeOff size={14} /> Tout masquer</button>
                    </div>
                    <ul className="space-y-2">
                        {widgetConfig.map((widget, index) => {
                            if (widget.type === 'group') {
                                return <li key={widget.label} className="pt-4 pb-1 px-3 text-sm font-bold text-gray-500">{widget.label}</li>;
                            }
                            if (widget.type === 'divider') {
                                return <li key={`divider-${index}`} className="pt-4"><hr /></li>;
                            }
                            return (
                                <li key={widget.id} className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 ${widget.indent ? 'ml-4' : ''}`}>
                                    <span className="font-medium text-gray-700">{widget.label}</span>
                                    <label htmlFor={widget.id} className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            id={widget.id}
                                            checked={!!localSettings[widget.id]}
                                            onChange={() => handleToggle(widget.id)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </li>
                            );
                        })}
                    </ul>
                </div>
                <div className="flex justify-end gap-3 p-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveClick}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" /> Enregistrer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardSettingsModal;
