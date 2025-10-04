import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { updateProjectOnboardingStep } from '../context/actions';
import ExpenseAnalysisView from '../components/ExpenseAnalysisView';
import ExpenseEvolutionChart from '../components/ExpenseEvolutionChart';
import IncomeEvolutionChart from '../components/IncomeEvolutionChart';
import { PieChart, TrendingUp, TrendingDown, BrainCircuit } from 'lucide-react';
import StrategicAnalysisView from '../components/StrategicAnalysisView';

const AnalysePage = () => {
    const { dataState, dataDispatch } = useData();
    const { uiState, uiDispatch } = useUI();
    const navigate = useNavigate();
    const { activeProjectId } = uiState;
    const { projects } = dataState;

    const [activeTab, setActiveTab] = useState('strategic');

    const activeProject = React.useMemo(() => projects.find(p => p.id === activeProjectId), [projects, activeProjectId]);

    const handleValidation = () => {
        updateProjectOnboardingStep({ dataDispatch, uiDispatch }, { projectId: activeProjectId, step: 'completed' });
        navigate('/app/dashboard');
    };
    
    const showValidationButton = activeProject && activeProject.onboarding_step === 'analyse';

    const tabs = [
        { id: 'strategic', label: 'Analyse Stratégique', icon: BrainCircuit },
        { id: 'repartition-expense', label: 'Répartition des Sorties', icon: PieChart },
        { id: 'repartition-income', label: 'Répartition des Entrées', icon: PieChart },
        { id: 'evolution-expense', label: 'Évolution des Sorties', icon: TrendingDown },
        { id: 'evolution-income', label: 'Évolution des Entrées', icon: TrendingUp },
    ];

    return (
        <div className="p-6 max-w-full">
            {showValidationButton && (
                <div className="text-center mb-6">
                    <button
                        onClick={handleValidation}
                        className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700 transition-colors"
                    >
                        Terminer et voir mon tableau de bord
                    </button>
                </div>
            )}

            <div className="mb-6 border-b">
                <nav className="-mb-px flex space-x-8 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            <tab.icon size={16} /> {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div>
                {activeTab === 'strategic' && <StrategicAnalysisView />}
                {activeTab === 'repartition-expense' && <ExpenseAnalysisView analysisType="expense" />}
                {activeTab === 'repartition-income' && <ExpenseAnalysisView analysisType="revenue" />}
                {activeTab === 'evolution-expense' && <ExpenseEvolutionChart />}
                {activeTab === 'evolution-income' && <IncomeEvolutionChart />}
            </div>
        </div>
    );
};

export default AnalysePage;
