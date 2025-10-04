import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, FileSpreadsheet, FileText } from 'lucide-react';
import BudgetStateView from '../components/BudgetStateView';
import { useUI } from '../context/UIContext';
import { useData } from '../context/DataContext';
import { updateProjectOnboardingStep } from '../context/actions';
import { useActiveProjectData } from '../utils/selectors';
import { motion, AnimatePresence } from 'framer-motion';

const BudgetPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const { uiState, uiDispatch } = useUI();
    const { dataState, dataDispatch } = useData();
    const navigate = useNavigate();

    const { activeProject } = useActiveProjectData(dataState, uiState);
    const showValidationButton = activeProject && activeProject.onboarding_step === 'budget';

    const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
    const downloadMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target)) {
                setIsDownloadMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleValidation = () => {
        updateProjectOnboardingStep({ dataDispatch, uiDispatch }, { projectId: activeProject.id, step: 'accounts' });
        navigate('/app/comptes');
    };

    return (
        <div className="p-6 max-w-full">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <p className="text-gray-600">
                        Recensez, identifiez et classez vos entrées et sorties régulièrement.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Rechercher par tiers..."
                            className="w-full pl-10 pr-4 py-2 border rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        />
                    </div>
                    <div className="relative" ref={downloadMenuRef}>
                        <button
                            onClick={() => setIsDownloadMenuOpen(prev => !prev)}
                            className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors px-3 py-2 rounded-full hover:bg-gray-100"
                        >
                            <Download size={16} />
                            <span>Exporter</span>
                        </button>
                        <AnimatePresence>
                            {isDownloadMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-20"
                                >
                                    <ul className="p-1">
                                        <li>
                                            <button
                                                disabled
                                                className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Fonctionnalité bientôt disponible"
                                            >
                                                <FileSpreadsheet size={14} />
                                                Télécharger Excel
                                            </button>
                                        </li>
                                        <li>
                                            <button
                                                disabled
                                                className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Fonctionnalité bientôt disponible"
                                            >
                                                <FileText size={14} />
                                                Télécharger en PDF
                                            </button>
                                        </li>
                                    </ul>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
            
            {showValidationButton && (
                <div className="mb-6 flex justify-center">
                    <button
                        onClick={handleValidation}
                        className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700 transition-colors"
                    >
                        Valider mon budget et passer à la mise en place de mes comptes
                    </button>
                </div>
            )}
            
            <BudgetStateView searchTerm={searchTerm} />
        </div>
    );
};

export default BudgetPage;
