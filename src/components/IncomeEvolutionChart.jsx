import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { useActiveProjectData } from '../utils/selectors';
import { formatCurrency } from '../utils/formatting';
import EmptyState from './EmptyState';
import { BarChart } from 'lucide-react';

const IncomeEvolutionChart = () => {
    const { dataState } = useData();
    const { uiState } = useUI();
    const { categories, settings } = dataState;
    const { actualTransactions } = useActiveProjectData(dataState, uiState);

    const [period, setPeriod] = useState('year'); // 'quarter', 'semester', 'year'

    const chartData = useMemo(() => {
        const numMonths = period === 'quarter' ? 3 : period === 'semester' ? 6 : 12;
        const today = new Date();
        const months = [];
        const monthLabels = [];

        for (let i = numMonths - 1; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            months.push({
                year: date.getFullYear(),
                month: date.getMonth(),
            });
            monthLabels.push(date.toLocaleString('fr-FR', { month: 'short', year: '2-digit' }));
        }

        const mainCategories = categories.revenue.filter(mc => mc.subCategories && mc.subCategories.length > 0);
        const mainCategoryMap = new Map();
        categories.revenue.forEach(mc => {
            mc.subCategories.forEach(sc => {
                mainCategoryMap.set(sc.name, mc.name);
            });
        });

        const seriesData = mainCategories.map(mainCat => {
            const data = months.map(m => {
                const monthStart = new Date(m.year, m.month, 1);
                const monthEnd = new Date(m.year, m.month + 1, 0);
                monthEnd.setHours(23, 59, 59, 999);

                const total = actualTransactions
                    .filter(tx => {
                        const mainCategoryName = mainCategoryMap.get(tx.category);
                        return tx.type === 'receivable' && mainCategoryName === mainCat.name;
                    })
                    .flatMap(tx => tx.payments || [])
                    .filter(p => {
                        const pDate = new Date(p.paymentDate);
                        return pDate >= monthStart && pDate <= monthEnd;
                    })
                    .reduce((sum, p) => sum + p.paidAmount, 0);
                
                return total;
            });
            return {
                name: mainCat.name,
                type: 'bar',
                stack: 'total',
                emphasis: { focus: 'series' },
                data: data,
            };
        });

        const filteredSeriesData = seriesData.filter(s => s.data.some(d => d > 0));

        return {
            monthLabels,
            series: filteredSeriesData,
        };

    }, [period, actualTransactions, categories]);

    const getChartOptions = () => ({
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        legend: {
            type: 'scroll',
            orient: 'vertical',
            right: 10,
            top: 20,
            bottom: 20,
        },
        grid: {
            left: '3%',
            right: '18%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: [
            {
                type: 'category',
                data: chartData.monthLabels
            }
        ],
        yAxis: [
            {
                type: 'value',
                axisLabel: {
                    formatter: (value) => formatCurrency(value, { ...settings, displayUnit: 'standard' })
                }
            }
        ],
        series: chartData.series.map(s => ({
            ...s,
            label: {
                show: true,
                position: 'inside',
                formatter: (params) => {
                    if (params.value > 100) {
                        return formatCurrency(params.value, { ...settings, displayUnit: 'standard', decimalPlaces: 0 });
                    }
                    return '';
                },
                color: '#fff',
                textShadowColor: 'rgba(0, 0, 0, 0.5)',
                textShadowBlur: 2,
            }
        }))
    });

    const hasData = chartData.series.length > 0;

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Évolution des Entrées</h3>
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => setPeriod('quarter')} className={`px-3 py-1 text-sm rounded-md font-medium ${period === 'quarter' ? 'bg-white shadow' : 'text-gray-600'}`}>Trimestre</button>
                    <button onClick={() => setPeriod('semester')} className={`px-3 py-1 text-sm rounded-md font-medium ${period === 'semester' ? 'bg-white shadow' : 'text-gray-600'}`}>Semestre</button>
                    <button onClick={() => setPeriod('year')} className={`px-3 py-1 text-sm rounded-md font-medium ${period === 'year' ? 'bg-white shadow' : 'text-gray-600'}`}>Année</button>
                </div>
            </div>
            {hasData ? (
                <ReactECharts option={getChartOptions()} style={{ height: '500px', width: '100%' }} />
            ) : (
                <EmptyState
                    icon={BarChart}
                    title="Pas assez de données"
                    message="Aucune entrée enregistrée pour la période sélectionnée pour afficher une évolution."
                />
            )}
        </div>
    );
};

export default IncomeEvolutionChart;
