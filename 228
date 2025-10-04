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

        let dataMin = Math.min(...numericData);
        let dataMax = Math.max(...numericData);

        const padding = (dataMax - dataMin) * 0.1 || 10;
        const finalYMin = dataMin - padding;
        const finalYMax = dataMax + padding;

        const zeroPosition = finalYMax > finalYMin ? (finalYMax - 0) / (finalYMax - finalYMin) : 0;
        const clampedZeroPosition = Math.max(0, Math.min(1, zeroPosition));

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
                min: finalYMin,
                max: finalYMax,
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
            series: [{
                name: 'Solde Prévisionnel',
                type: 'line',
                smooth: false,
                symbol: 'none',
                data: cleanData,
                connectNulls: true,
                lineStyle: { 
                    width: 3,
                    color: '#3b82f6'
                },
                areaStyle: {
                    opacity: 0.3,
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: '#22c55e' },
                            { offset: clampedZeroPosition, color: '#22c55e' },
                            { offset: clampedZeroPosition, color: '#ef4444' },
                            { offset: 1, color: '#ef4444' }
                        ]
                    }
                },
                markLine: {
                    silent: true,
                    symbol: 'none',
                    lineStyle: {
                        type: 'solid',
                        color: '#9ca3af'
                    },
                    data: [{ yAxis: 0 }]
                }
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
