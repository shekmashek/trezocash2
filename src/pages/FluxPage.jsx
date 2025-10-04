import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { updateProjectOnboardingStep } from '../context/actions';
import CashflowView from '../components/CashflowView';
import { useActiveProjectData } from '../utils/selectors';

const FluxPage = () => {
    const { dataState, dataDispatch } = useData();
    const { uiState, uiDispatch } = useUI();
    const navigate = useNavigate();
    const { activeProjectId } = uiState;

    const { activeProject } = useActiveProjectData(dataState, uiState);

    const handleValidation = () => {
        updateProjectOnboardingStep({ dataDispatch, uiDispatch }, { projectId: activeProjectId, step: 'echeancier' });
        navigate('/app/echeancier');
    };
    
    const showValidationButton = activeProject && activeProject.onboarding_step === 'flux';

    return (
        <div>
            <div className="px-6 pt-6 mb-8">
                <p className="text-gray-600 max-w-4xl">
                    Évaluez en un coup d'œil votre capacité à très court terme comme à long terme.
                </p>
            </div>

            {showValidationButton && (
                <div className="text-center px-6 mb-6">
                    <button
                        onClick={handleValidation}
                        className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700 transition-colors"
                    >
                        Valider mon flux et voir l'échéancier
                    </button>
                </div>
            )}
            <div className="px-6 pb-6">
                <CashflowView />
            </div>
        </div>
    );
};

export default FluxPage;
