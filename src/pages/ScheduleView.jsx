import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ScheduleViewComponent from '../components/ScheduleView';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { updateProjectOnboardingStep } from '../context/actions';

const ScheduleView = () => {
    const { dataState, dataDispatch } = useData();
    const { uiState, uiDispatch } = useUI();
    const navigate = useNavigate();
    const { activeProjectId } = uiState;
    const { projects } = dataState;

    const activeProject = useMemo(() => projects.find(p => p.id === activeProjectId), [projects, activeProjectId]);

    const handleValidation = () => {
        updateProjectOnboardingStep({ dataDispatch, uiDispatch }, { projectId: activeProjectId, step: 'analyse' });
        navigate('/app/analyse');
    };
    
    const showValidationButton = activeProject && activeProject.onboarding_step === 'echeancier';

    return (
        <div className="p-6 max-w-full">
            {showValidationButton && (
                <div className="text-center mb-6">
                    <button
                        onClick={handleValidation}
                        className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700 transition-colors"
                    >
                        Valider l'échéancier et passer à l'analyse
                    </button>
                </div>
            )}
            <ScheduleViewComponent />
        </div>
    );
};

export default ScheduleView;
