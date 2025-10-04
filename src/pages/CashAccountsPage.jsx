import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import CashAccountsView from '../components/CashAccountsView';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { updateProjectOnboardingStep } from '../context/actions';

const CashAccountsPage = () => {
    const { dataState, dataDispatch } = useData();
    const { uiState, uiDispatch } = useUI();
    const navigate = useNavigate();
    const { activeProjectId } = uiState;
    const { projects } = dataState;

    const activeProject = useMemo(() => projects.find(p => p.id === activeProjectId), [projects, activeProjectId]);

    const handleValidation = () => {
        updateProjectOnboardingStep({ dataDispatch, uiDispatch }, { projectId: activeProjectId, step: 'trezo' });
        navigate('/app/trezo');
    };
    
    const showValidationButton = activeProject && activeProject.onboarding_step === 'accounts';

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {showValidationButton && (
                <div className="text-center mb-6">
                    <button 
                        onClick={handleValidation}
                        className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700 transition-colors"
                    >
                        Valider mes comptes et voir mon tableau de trésorerie
                    </button>
                </div>
            )}
            <CashAccountsView />
        </div>
    );
};

export default CashAccountsPage;
