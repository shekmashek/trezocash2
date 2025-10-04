import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import BudgetTracker from '../components/BudgetTracker';
import { useUI } from '../context/UIContext';
import { useData } from '../context/DataContext';
import { updateProjectOnboardingStep } from '../context/actions';
import { useActiveProjectData } from '../utils/selectors';
import { Lock, PiggyBank, Banknote, Coins } from 'lucide-react';
import WidgetIcon from '../components/WidgetIcon';

const defaultTrezoWidgetSettings = {
    trezo_toolbar: false, trezo_toolbar_temporal: false, trezo_toolbar_viewmode: false, trezo_toolbar_new_entry: false,
    trezo_col_budget: true, trezo_col_actual: true, trezo_col_reste: false, trezo_col_description: true,
    trezo_quick_filters: false, trezo_quickfilter_provisions: false, trezo_quickfilter_savings: false,
    trezo_quickfilter_borrowings: false, trezo_quickfilter_lendings: false,
};

const TrezoPage = () => {
    const { uiState, uiDispatch } = useUI();
    const { dataState, dataDispatch } = useData();
    const navigate = useNavigate();
    const { activeProjectId } = uiState;

    const { activeProject, isConsolidated } = useActiveProjectData(dataState, uiState);
    const [quickFilter, setQuickFilter] = useState('all');

    const widgetVisibility = useMemo(() => ({
        ...defaultTrezoWidgetSettings,
        ...(activeProject?.dashboard_widgets || {})
    }), [activeProject]);
    
    const handleValidation = () => {
        updateProjectOnboardingStep({ dataDispatch, uiDispatch }, { projectId: activeProjectId, step: 'flux' });
        navigate('/app/flux');
    };
    
    const showValidationButton = activeProject && activeProject.onboarding_step === 'trezo';

    const filterOptions = [
        { id: 'all', label: 'Tout', color: 'bg-white shadow text-blue-600', hoverColor: '' },
        { id: 'provisions', label: 'Provisions', icon: Lock, color: 'bg-indigo-100 text-indigo-700', hoverColor: 'hover:bg-indigo-200' },
        { id: 'savings', label: 'Épargnes', icon: PiggyBank, color: 'bg-teal-100 text-teal-700', hoverColor: 'hover:bg-teal-200' },
        { id: 'borrowings', label: 'Emprunts', icon: Banknote, color: 'bg-red-100 text-red-700', hoverColor: 'hover:bg-red-200' },
        { id: 'lendings', label: 'Prêts', icon: Coins, color: 'bg-green-100 text-green-700', hoverColor: 'hover:bg-green-200' },
    ];

    const handleOpenSettings = () => {
        uiDispatch({ type: 'OPEN_CUSTOMIZATION_DRAWER', payload: 'trezo' });
    };

    return (
        <>
            <div className="p-6 max-w-full">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {widgetVisibility.trezo_quick_filters && filterOptions.map(opt => {
                            const visibilityKey = `trezo_quickfilter_${opt.id}`;
                            if (opt.id === 'all' || widgetVisibility[visibilityKey]) {
                                const Icon = opt.icon;
                                return (
                                    <button 
                                        key={opt.id}
                                        onClick={() => setQuickFilter(opt.id)} 
                                        className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${quickFilter === opt.id ? opt.color : `bg-gray-100 text-gray-700 ${opt.hoverColor}`}`}
                                    >
                                        {Icon && <Icon size={14} />}
                                        {opt.label}
                                    </button>
                                );
                            }
                            return null;
                        })}
                    </div>
                    <div className="flex items-center gap-4 ml-auto">
                        {showValidationButton && (
                            <button
                                onClick={handleValidation}
                                className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700 transition-colors"
                            >
                                Valider mon tableau et voir mon flux de trésorerie
                            </button>
                        )}
                        {!isConsolidated && (
                            <button
                                onClick={handleOpenSettings}
                                className="p-2 text-gray-600 bg-white border rounded-lg hover:bg-gray-100 transition-colors"
                                title="Personnaliser le tableau de trésorerie"
                            >
                                <WidgetIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
                <BudgetTracker 
                    quickFilter={quickFilter}
                    showTemporalToolbar={widgetVisibility.trezo_toolbar && widgetVisibility.trezo_toolbar_temporal}
                    visibleColumns={{
                        budget: widgetVisibility.trezo_col_budget,
                        actual: widgetVisibility.trezo_col_actual,
                        reste: widgetVisibility.trezo_col_reste,
                        description: widgetVisibility.trezo_col_description,
                    }}
                    showViewModeSwitcher={widgetVisibility.trezo_toolbar && widgetVisibility.trezo_toolbar_viewmode}
                    showNewEntryButton={widgetVisibility.trezo_toolbar && widgetVisibility.trezo_toolbar_new_entry}
                />
            </div>
        </>
    );
};

export default TrezoPage;
