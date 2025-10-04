import React from 'react';
import { useUI } from '../context/UIContext';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ListChecks, Table, AreaChart, Calendar, Layers, PieChart, X } from 'lucide-react';
import { motion } from 'framer-motion';

const NavDrawer = () => {
    const { uiState, uiDispatch } = useUI();
    const { isNavDrawerOpen } = uiState;
    
    const onClose = () => uiDispatch({ type: 'CLOSE_NAV_DRAWER' });

    const navItems = [
        { label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
        { label: 'Budget', path: '/app/budget', icon: ListChecks },
        { label: 'Trezo', path: '/app/trezo', icon: Table },
        { label: 'Flux', path: '/app/flux', icon: AreaChart },
        { label: 'Echeancier', path: '/app/echeancier', icon: Calendar },
        { label: 'Scénarios', path: '/app/scenarios', icon: Layers },
        { label: 'Analyse', path: '/app/analyse', icon: PieChart },
    ];

    const navLinkClasses = ({ isActive }) =>
    `flex items-center gap-4 px-4 py-3 rounded-lg text-lg font-medium transition-colors ${
        isActive
            ? 'bg-blue-100 text-blue-600'
            : 'text-gray-700 hover:bg-gray-100'
    }`;

    return (
        <>
            <div className={`fixed inset-0 bg-black z-40 transition-opacity ${isNavDrawerOpen ? 'bg-opacity-60' : 'bg-opacity-0 pointer-events-none'}`} onClick={onClose}></div>
            <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: isNavDrawerOpen ? 0 : '-100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed top-0 left-0 bottom-0 w-80 bg-white shadow-xl z-50 p-6 flex flex-col"
            >
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold text-gray-800">Navigation</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
                        <X className="w-6 h-6 text-gray-600" />
                    </button>
                </div>
                <nav>
                    <ul className="space-y-2">
                        {navItems.map(item => (
                            <li key={item.label}>
                                <NavLink to={item.path} className={navLinkClasses} onClick={onClose}>
                                    <item.icon className="w-6 h-6" />
                                    {item.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>
            </motion.div>
        </>
    );
};

export default NavDrawer;
