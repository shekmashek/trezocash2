import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Loader } from 'lucide-react';

// NOTE: La logique d'évaluation est adaptée ici pour correspondre à la jauge à 6 niveaux.
const getScoreDetails = (score) => {
    let evaluation, emoji;
    if (score >= 86) { evaluation = 'Excellente'; emoji = '🤩'; }
    else if (score >= 71) { evaluation = 'Bonne'; emoji = '😄'; }
    else if (score >= 51) { evaluation = 'Correcte'; emoji = '🙂'; }
    else if (score >= 36) { evaluation = 'Passable'; emoji = '😐'; }
    else if (score >= 16) { evaluation = 'Fragile'; emoji = '😟'; }
    else { evaluation = 'Critique'; emoji = '😠'; }
    return { evaluation, emoji };
};

const TrezoScoreWidget = ({ scoreData }) => {
    if (!scoreData) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
                <div className="flex justify-center items-center">
                    <Loader className="animate-spin w-6 h-6 text-blue-600 mr-2" />
                    Calcul du Score Trézo en cours...
                </div>
            </div>
        );
    }

    const { score } = scoreData;
    const { evaluation, emoji } = getScoreDetails(score);

    const getChartOptions = () => ({
        series: [
            {
                type: 'gauge',
                radius: '100%',
                startAngle: 180,
                endAngle: 0,
                min: 0,
                max: 100,
                splitNumber: 100, // High value for precise label placement
                axisLine: {
                    lineStyle: {
                        width: 30, // Increased width for better visibility
                        color: [
                            [0.16, '#ef4444'], // POOR (Critique)
                            [0.35, '#f97316'], // FAIR (Fragile)
                            [0.50, '#f59e0b'], // BAD (Passable)
                            [0.70, '#a3e635'], // NORMAL (Correcte)
                            [0.85, '#22c55e'], // GOOD (Bonne)
                            [1, '#16a34a']     // SUPER (Excellente)
                        ]
                    }
                },
                pointer: {
                    length: '65%',
                    width: 8, // Made pointer thicker
                    offsetCenter: [0, '-40%'],
                    itemStyle: {
                        color: '#1f2937'
                    }
                },
                axisTick: { show: false },
                splitLine: { show: false },
                axisLabel: {
                    distance: -60, // Adjusted distance for larger size
                    color: '#1f2937',
                    fontSize: 14, // Increased font size
                    fontWeight: 'bold',
                    formatter: function (value) {
                        switch (value) {
                            case 8: return 'POOR';
                            case 25: return 'FAIR';
                            case 43: return 'BAD';
                            case 60: return 'NORMAL';
                            case 78: return 'GOOD';
                            case 93: return 'SUPER';
                            default: return '';
                        }
                    }
                },
                detail: { show: false },
                data: [{ value: score }]
            }
        ]
    });

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
                {/* Gauge Chart - Adjusted height */}
                <div className="relative w-full lg:w-2/3 max-w-lg mx-auto">
                    <ReactECharts
                        option={getChartOptions()}
                        style={{ height: '280px' }}
                        notMerge={true}
                        lazyUpdate={true}
                    />
                </div>

                {/* Score Details */}
                <div className="flex-grow text-center lg:text-left">
                    <p className="text-sm font-semibold text-blue-600">Votre Score Trézo</p>
                    <div className="flex items-center justify-center lg:justify-start gap-4 mt-1">
                        <div>
                            <h2 className="text-5xl font-bold text-gray-800">{score} <span className="text-3xl text-gray-500">/ 100</span></h2>
                            <p className="text-xl font-semibold text-gray-600 mt-2">{evaluation}</p>
                        </div>
                        <div className="text-6xl" role="img" aria-label={evaluation}>{emoji}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrezoScoreWidget;
