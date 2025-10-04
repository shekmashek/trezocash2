import React, { useState } from 'react';
import { Settings, BarChart, FileText } from 'lucide-react';
import VatSettingsView from '../components/VatSettingsView';
import VatDeclarationsView from '../components/VatDeclarationsView';
import VatDashboardView from '../components/VatDashboardView';

const VatManagementPage = () => {
    const [activeTab, setActiveTab] = useState('dashboard');

    const tabs = [
        { id: 'dashboard', label: 'Tableau de Bord', icon: BarChart },
        { id: 'declarations', label: 'Déclarations', icon: FileText },
        { id: 'settings', label: 'Paramètres', icon: Settings },
    ];

    return (
        <div className="p-6 max-w-full">
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                                activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div>
                {activeTab === 'dashboard' && <VatDashboardView />}
                {activeTab === 'declarations' && <VatDeclarationsView />}
                {activeTab === 'settings' && <VatSettingsView />}
            </div>
        </div>
    );
};

export default VatManagementPage;
