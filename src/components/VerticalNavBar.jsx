import React, { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { LayoutDashboard, ListChecks, Table, AreaChart, Calendar, Layers, PieChart, Wallet, AlertTriangle } from 'lucide-react';
import TrezocashLogo from './TrezocashLogo';
import NavTooltip from './NavTooltip';
import { useActiveProjectData, useScheduleData } from '../utils/selectors';
import { AnimatePresence } from 'framer-motion';

const VerticalNavBar = () => {
    const { dataState } = useData();
    const { uiState } = useUI();
    const { activeProjectId } = uiState;
    const { settings } = dataState;
    const { activeProjectOrView, actualTransactions } = useActiveProjectData(dataState, uiState);
    const { overdueTransactions } = useScheduleData(actualTransactions, settings);
    const overdueCount = overdueTransactions.length;

    const [activeTooltip, setActiveTooltip] = useState(null);

    const tooltipContent = {
        dashboard: { title: 'Dashboard', description: "Visualisez la santé financière globale de votre projet en un clin d'œil.", imageUrl: 'https://i.imgur.com/nJbC2a2.png' },
        budget: { title: 'Budget', description: "Mettez en place votre budget prévisionnel en listant vos entrées et sorties.", imageUrl: 'https://i.imgur.com/rF9gYtK.png' },
        trezo: { title: 'Trezo', description: "Le tableau de bord central pour suivre votre trésorerie, du quotidien à une vision sur 10 ans.", imageUrl: 'https://i.imgur.com/dAmf2u2.png' },
        flux: { title: 'Flux', description: "Évaluez l'évolution de votre solde de trésorerie avec des graphiques clairs.", imageUrl: 'https://i.imgur.com/e5B3q2b.png' },
        echeancier: { title: 'Échéancier', description: "Enregistrez vos paiements réels et ne manquez plus jamais une échéance.", imageUrl: 'https://i.imgur.com/sZ3v4fH.png' },
        analyse: { title: 'Analyse', description: "Analysez vos dépenses et revenus pour prendre de meilleures décisions.", imageUrl: 'https://i.imgur.com/jV7fL4c.png' },
        scenarios: { title: 'Scénarios', description: "Créez des simulations pour anticiper l'impact de vos décisions futures.", imageUrl: 'https://i.imgur.com/tY8wP9d.png' },
        comptes: { title: 'Comptes', description: "Gérez vos comptes de trésorerie (bancaires, caisse, etc.) et leurs soldes.", imageUrl: 'https://i.imgur.com/9y8Z8bH.png' },
        enRetard: { title: 'Échéances en Retard', description: `Vous avez ${overdueCount} transaction(s) en retard.`, imageUrl: 'https://i.imgur.com/sZ3v4fH.png' },
    };

    const mainNavItems = [
        { label: 'Dashboard', id: 'dashboard', path: '/app/dashboard', icon: LayoutDashboard },
        { label: 'Budget', id: 'budget', path: '/app/budget', icon: ListChecks },
        { label: 'Trezo', id: 'trezo', path: '/app/trezo', icon: Table },
        { label: 'Flux', id: 'flux', path: '/app/flux', icon: AreaChart },
        { label: 'Échéancier', id: 'echeancier', path: '/app/echeancier', icon: Calendar },
        { label: 'Analyse', id: 'analyse', path: '/app/analyse', icon: PieChart },
        { label: 'Scénarios', id: 'scenarios', path: '/app/scenarios', icon: Layers },
        { label: 'Comptes', id: 'comptes', path: '/app/comptes', icon: Wallet },
    ];

    const visibleNavItems = useMemo(() => {
        const onboardingStep = activeProjectOrView?.onboarding_step;
        const isConsolidated = activeProjectId === 'consolidated' || activeProjectId?.startsWith('consolidated_view_');

        if (!activeProjectOrView || isConsolidated || !onboardingStep || onboardingStep === 'completed') {
            return mainNavItems;
        }

        const step = onboardingStep;
        const accessibleLabelsMap = {
            budget: ['Budget'],
            accounts: ['Budget', 'Comptes'],
            trezo: ['Budget', 'Comptes', 'Trezo'],
            flux: ['Budget', 'Comptes', 'Trezo', 'Flux'],
            echeancier: ['Budget', 'Comptes', 'Trezo', 'Flux', 'Échéancier'],
            analyse: ['Budget', 'Comptes', 'Trezo', 'Flux', 'Échéancier', 'Analyse'],
        };
        
        const accessibleLabels = accessibleLabelsMap[step] || [];
        
        if (accessibleLabels.length > 0) {
            accessibleLabels.unshift('Dashboard');
        }
        
        if (['trezo', 'flux', 'echeancier', 'analyse'].includes(step)) {
            accessibleLabels.push('Scénarios');
        }

        return mainNavItems.filter(item => accessibleLabels.includes(item.label));
    }, [activeProjectOrView, activeProjectId]);

    const navLinkClasses = ({ isActive }) =>
    `flex flex-col items-center justify-center w-full py-3 rounded-md transition-colors ${
        isActive
            ? 'bg-gray-200 text-blue-600'
            : 'text-gray-600 hover:bg-gray-100'
    }`;

    return (
        <div className="fixed top-0 left-0 h-full bg-white border-r w-24 z-40 flex flex-col">
            <div className="flex items-center justify-center h-20 border-b">
                <NavLink to="/app/projets" className="p-2 w-full text-center hover:bg-gray-100 transition-colors rounded-md">
                    <TrezocashLogo className="w-8 h-8 mx-auto" />
                    <span className="text-[10px] mt-1 font-semibold text-gray-700">Mes Projets</span>
                </NavLink>
            </div>
            <nav className="flex-1 flex flex-col items-center gap-2 py-4">
                {visibleNavItems.map(item => (
                    item && 
                    <div 
                        key={item.id}
                        className="relative w-full px-2"
                        onMouseEnter={() => setActiveTooltip(item.id)}
                        onMouseLeave={() => setActiveTooltip(null)}
                    >
                        <NavLink to={item.path} className={navLinkClasses} title={item.label}>
                            <item.icon size={24} />
                            <span className="text-[10px] mt-1 leading-tight font-medium">{item.label}</span>
                        </NavLink>
                        <AnimatePresence>
                            {activeTooltip === item.id && (
                                <NavTooltip {...tooltipContent[item.id]} />
                            )}
                        </AnimatePresence>
                    </div>
                ))}

                <div className="mt-auto w-full">
                    {overdueCount > 0 && (
                        <div 
                            className="relative w-full px-2 pt-2 border-t"
                            onMouseEnter={() => setActiveTooltip('enRetard')}
                            onMouseLeave={() => setActiveTooltip(null)}
                        >
                            <NavLink to="/app/en-retard" className="flex flex-col items-center justify-center w-full py-3 rounded-md text-red-500 bg-red-50 hover:bg-red-100" title="Échéances en retard">
                                <div className="relative">
                                    <AlertTriangle size={24} />
                                    <span className="absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold">
                                        {overdueCount}
                                    </span>
                                </div>
                                <span className="text-[10px] mt-1 leading-tight font-medium">En retard</span>
                            </NavLink>
                            <AnimatePresence>
                                {activeTooltip === 'enRetard' && (
                                    <NavTooltip {...tooltipContent.enRetard} />
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </nav>
        </div>
    );
};

export default VerticalNavBar;
