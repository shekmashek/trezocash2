import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { useActiveProjectData } from '../utils/selectors';
import { getEntryAmountForPeriod } from '../utils/budgetCalculations';
import { formatCurrency } from '../utils/formatting';
import EmptyState from './EmptyState';
import { BrainCircuit, PiggyBank, BookOpen, Briefcase, Heart, SlidersHorizontal } from 'lucide-react';

const StrategyCard = ({ title, tagline, question, icon: Icon, colorClass, children }) => (
    <div className={`p-6 rounded-lg border-l-4 ${colorClass.border}`}>
        <div className="flex items-start gap-4">
            <div className={`p-2 rounded-full ${colorClass.bg}`}>
                <Icon className={`w-6 h-6 ${colorClass.text}`} />
            </div>
            <div>
                <h4 className="font-bold text-gray-800">{title}</h4>
                <p className="text-sm font-medium text-gray-500">{tagline}</p>
            </div>
        </div>
        <p className="mt-4 text-gray-600 italic">"{question}"</p>
        <div className="mt-4 text-sm text-gray-700 space-y-2">
            {children}
        </div>
    </div>
);

const StrategicAnalysisView = () => {
    const { dataState } = useData();
    const { uiState } = useUI();
    const { categories, settings } = dataState;
    const { budgetEntries } = useActiveProjectData(dataState, uiState);

    const chartData = useMemo(() => {
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);

        const strategicCategories = {
            'Formation': 0,
            'Investissements': 0,
            'Épargne': 0,
            'Qualité de vie': 0,
            'Autres sorties': 0,
        };
        
        const qualityOfLifeCategories = ['Loisirs, Culture & Sport', 'Santé & Bien-Être', 'Voyages'];
        const strategicMainCategories = ['Formation', 'Investissements', 'Épargne'];

        let totalStrategicSpend = 0;
        let totalExpense = 0;

        categories.expense.forEach(mainCat => {
            const mainCatTotal = mainCat.subCategories.reduce((mainSum, subCat) => {
                const subCatEntries = budgetEntries.filter(e => e.category === subCat.name && e.type === 'depense');
                const subCatTotal = subCatEntries.reduce((subSum, entry) => subSum + getEntryAmountForPeriod(entry, monthStart, monthEnd), 0);
                return mainSum + subCatTotal;
            }, 0);

            totalExpense += mainCatTotal;

            if (strategicMainCategories.includes(mainCat.name)) {
                strategicCategories[mainCat.name] += mainCatTotal;
                totalStrategicSpend += mainCatTotal;
            } else if (qualityOfLifeCategories.includes(mainCat.name)) {
                strategicCategories['Qualité de vie'] += mainCatTotal;
                totalStrategicSpend += mainCatTotal;
            }
        });

        strategicCategories['Autres sorties'] = totalExpense - totalStrategicSpend;

        const chartSeriesData = Object.entries(strategicCategories)
            .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
            .filter(item => item.value > 0);

        return {
            seriesData: chartSeriesData,
            total: totalExpense,
        };
    }, [budgetEntries, categories]);

    const getChartOptions = () => ({
        title: {
            text: 'Répartition Stratégique des Dépenses',
            subtext: `Prévisionnel pour ${new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}`,
            left: 'center'
        },
        tooltip: {
            trigger: 'item',
            formatter: (params) => {
                const percent = params.percent;
                return `${params.marker} <strong>${params.name}</strong><br/>${formatCurrency(params.value, settings)} (${percent}%)`;
            }
        },
        legend: {
            orient: 'vertical',
            left: 'left',
            top: 'center',
        },
        series: [
            {
                name: 'Dépenses Stratégiques',
                type: 'pie',
                radius: ['40%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 10,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: {
                    show: false,
                    position: 'center'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 24,
                        fontWeight: 'bold',
                        formatter: '{b}\n{d}%'
                    }
                },
                labelLine: {
                    show: false
                },
                data: chartData.seriesData
            }
        ]
    });

    const hasData = chartData.seriesData.length > 0 && chartData.total > 0;
    
    const strategicValues = useMemo(() => {
        const values = {};
        chartData.seriesData.forEach(item => {
            values[item.name] = item.value;
        });
        return values;
    }, [chartData]);

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            {hasData ? (
                <>
                    <ReactECharts option={getChartOptions()} style={{ height: '500px', width: '100%' }} />
                    <div className="mt-12 space-y-6">
                        <StrategyCard
                            title="Stratégie 1 : Vos Epargne"
                            tagline="La Base Inébranlable - Sécurité et Résilience"
                            question="Mes finances peuvent-elles absorber un choc sans s'effondrer ?"
                            icon={PiggyBank}
                            colorClass={{ border: 'border-teal-500', bg: 'bg-teal-100', text: 'text-teal-600' }}
                        >
                            <p>Actuellement vous prévoyez d'épargner : <strong className="text-lg">{formatCurrency(strategicValues['Épargne'] || 0, settings)}</strong>, ce qui représente <strong className="text-lg">{chartData.total > 0 ? (((strategicValues['Épargne'] || 0) / chartData.total) * 100).toFixed(1) : 0}%</strong> de vos sorties.</p>
                        </StrategyCard>
                        
                        <StrategyCard
                            title="Stratégie 2 : Vos Formations"
                            tagline="L'Accélérateur de Valeur - Investissement sur Soi"
                            question="Est-ce que j'augmente ma capacité à générer des revenus dans le futur ?"
                            icon={BookOpen}
                            colorClass={{ border: 'border-sky-500', bg: 'bg-sky-100', text: 'text-sky-600' }}
                        >
                            <p>Actuellement vous prévoyez un budget de formation de : <strong className="text-lg">{formatCurrency(strategicValues['Formation'] || 0, settings)}</strong>, ce qui représente <strong className="text-lg">{chartData.total > 0 ? (((strategicValues['Formation'] || 0) / chartData.total) * 100).toFixed(1) : 0}%</strong> de vos sorties.</p>
                        </StrategyCard>

                        <StrategyCard
                            title="Stratégie 3 : Investissement"
                            tagline="La Machine à Générer de la Richesse - Investissements Actifs"
                            question="Mon argent travaille-t-il pour moi, même quand je dors ?"
                            icon={Briefcase}
                            colorClass={{ border: 'border-purple-500', bg: 'bg-purple-100', text: 'text-purple-600' }}
                        >
                            <p>Actuellement vous prévoyez d'investir : <strong className="text-lg">{formatCurrency(strategicValues['Investissements'] || 0, settings)}</strong>, ce qui représente <strong className="text-lg">{chartData.total > 0 ? (((strategicValues['Investissements'] || 0) / chartData.total) * 100).toFixed(1) : 0}%</strong> de vos sorties.</p>
                        </StrategyCard>

                        <StrategyCard
                            title="Stratégie 4 : La Qualité de Vie"
                            tagline="Le But Ultime - On ne vit qu'une fois"
                            question="Est-ce que mes dépenses d'aujourd'hui vous permettent de vivre des expériences dont vous rêvez ?"
                            icon={Heart}
                            colorClass={{ border: 'border-pink-500', bg: 'bg-pink-100', text: 'text-pink-600' }}
                        >
                            <p>Actuellement vous prévoyez un budget de "qualité de vie" de : <strong className="text-lg">{formatCurrency(strategicValues['Qualité de vie'] || 0, settings)}</strong>, ce qui représente <strong className="text-lg">{chartData.total > 0 ? (((strategicValues['Qualité de vie'] || 0) / chartData.total) * 100).toFixed(1) : 0}%</strong> de vos sorties.</p>
                            <p className="text-xs text-gray-500 mt-2">Nous avons mis dans qualité de vie : les voyages, les activités culturelles, sportifs et de loisirs, ainsi que votre santé et bien-être.</p>
                        </StrategyCard>

                        <StrategyCard
                            title="Stratégie 5 : Dépenses Optimisables"
                            tagline="Réduction des Fuites et des Dettes"
                            question="Quelles dépenses pouvez-vous optimiser ?"
                            icon={SlidersHorizontal}
                            colorClass={{ border: 'border-gray-500', bg: 'bg-gray-100', text: 'text-gray-600' }}
                        >
                            <p>Voici le montant des dépenses optimisables : <strong className="text-lg">{formatCurrency(strategicValues['Autres sorties'] || 0, settings)}</strong>, ce qui représente <strong className="text-lg">{chartData.total > 0 ? (((strategicValues['Autres sorties'] || 0) / chartData.total) * 100).toFixed(1) : 0}%</strong> de vos sorties.</p>
                            <p className="text-xs text-gray-500 mt-2">Il regroupe toutes vos dépenses non catégorisées dans les pôles stratégiques ci-dessus.</p>
                        </StrategyCard>
                    </div>
                </>
            ) : (
                <EmptyState
                    icon={BrainCircuit}
                    title="Analyse Stratégique Indisponible"
                    message="Aucune dépense prévisionnelle n'est enregistrée pour le mois en cours pour afficher cette analyse."
                />
            )}
        </div>
    );
};

export default StrategicAnalysisView;
