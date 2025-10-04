// This file is renamed to ThirtyDayForecastWidget.jsx
import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { LineChart } from 'lucide-react';
import { formatCurrency } from '../utils/formatting';
import { useData } from '../context/DataContext';

const ThirtyDayForecastWidget = ({ forecastData }) => {
    const { dataState } = useData();
    const { settings } = dataState;
    
    const { labels, data } = forecastData;
    const cleanData = useMemo(() => Array.isArray(data) ? data.map(d => Number.isFinite(d) ? d : null) : [], [data]);

    const getChartOptions = () => {
        const numericData = cleanData.filter(d => d !== null);
        if (!cleanData || numericData.length < 2) {
            return {
                title: { text: 'Données insuffisantes', left: 'center', top: 'center', textStyle: { color: '#9ca3af', fontSize: 14 } },
                series: []
            };
        }
        
        const dataMin = Math.min(...numericData);
        const dataMax = Math.max(...numericData);
        const yMin = Math.min(0, dataMin);
        const yMax = Math.max(0, dataMax);

        return {
            grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
            xAxis: {
                type: 'category',
                data: labels,
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: { color: '#6b7280', rotate: 45 }
            },
            yAxis: {
                type: 'value',
                min: yMin,
                max: yMax,
                axisLabel: {
                    formatter: (value) => formatCurrency(value, { ...settings, displayUnit: 'thousands', decimalPlaces: 0 }),
                    color: '#6b7280'
                },
                splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } }
            },
            tooltip: {
                trigger: 'axis',
                formatter: (params) => {
                    const param = params[0];
                    if (param.value === null || param.value === undefined) return '';
                    return `<strong>${param.name}</strong><br/>Solde prévisionnel: <strong>${formatCurrency(param.value, settings)}</strong>`;
                }
            },
            visualMap: {
                show: false,
                pieces: [
                    { gt: 0, color: '#22c55e' }, // green for positive
                    { lte: 0, color: '#ef4444' }  // red for non-positive
                ],
                outOfRange: { color: '#999' }
            },
            series: [{
                name: 'Solde Prévisionnel',
                type: 'line',
                smooth: false,
                symbol: 'none',
                data: cleanData,
                connectNulls: true,
                lineStyle: { width: 3 },
                areaStyle: { opacity: 0.3 }
            }]
        };
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <LineChart className="w-5 h-5 text-blue-600" />
                Prévision sur 30 jours
            </h2>
            <div style={{ height: '250px' }}>
                <ReactECharts option={getChartOptions()} style={{ height: '100%', width: '100%' }} notMerge={true} lazyUpdate={true} />
            </div>
        </div>
    );
};

export default ThirtyDayForecastWidget;
