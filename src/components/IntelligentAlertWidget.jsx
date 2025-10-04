import React, { useMemo } from 'react';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';

const IntelligentAlertWidget = ({ forecastData }) => {
    const getDaysMessage = (days) => {
        if (days === 0) return "aujourd'hui";
        if (days === 1) return "demain";
        return `dans ${days} jours`;
    };

    const alert = useMemo(() => {
        if (!forecastData || !forecastData.data || forecastData.data.length === 0) {
            return {
                level: 'info',
                message: 'Analyse des alertes en cours...',
                icon: Info,
                color: 'blue'
            };
        }

        const firstNegativeIndex = forecastData.data.findIndex(balance => balance < 0);

        if (firstNegativeIndex === -1) {
            return {
                level: 'ok',
                message: 'Bonne nouvelle ! Votre trésorerie semble saine pour les 30 prochains jours.',
                icon: CheckCircle,
                color: 'green'
            };
        }

        const daysUntilNegative = firstNegativeIndex; // 0-indexed
        const daysMessage = getDaysMessage(daysUntilNegative);

        if (daysUntilNegative <= 7) {
            return {
                level: 'critique',
                message: `URGENCE : Rupture de trésorerie prévue ${daysMessage}.`,
                icon: AlertTriangle,
                color: 'red'
            };
        } else if (daysUntilNegative <= 15) {
            return {
                level: 'elevee',
                message: `Attention : Risque de trésorerie ${daysMessage}.`,
                icon: AlertTriangle,
                color: 'orange'
            };
        } else if (daysUntilNegative < 30) { // < 30 because the forecast is for 30 days
            return {
                level: 'preventive',
                message: `Info : Tension de trésorerie prévue ${daysMessage}.`,
                icon: Info,
                color: 'blue'
            };
        }

        // Fallback for any edge cases
        return {
            level: 'ok',
            message: 'Bonne nouvelle ! Votre trésorerie semble saine pour les 30 prochains jours.',
            icon: CheckCircle,
            color: 'green'
        };
    }, [forecastData]);

    if (!alert) return null;

    const colorConfig = {
        critique: { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-800', icon: 'text-red-600' },
        elevee: { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-800', icon: 'text-orange-600' },
        preventive: { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-800', icon: 'text-blue-600' },
        ok: { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-800', icon: 'text-green-600' },
        info: { bg: 'bg-gray-100', border: 'border-gray-500', text: 'text-gray-800', icon: 'text-gray-600' },
    };

    const currentColors = colorConfig[alert.level];
    const Icon = alert.icon;

    return (
        <div className={`${currentColors.bg} border-l-4 ${currentColors.border} p-4 rounded-r-lg`}>
            <div className="flex">
                <div className="flex-shrink-0">
                    <Icon className={`h-5 w-5 ${currentColors.icon}`} aria-hidden="true" />
                </div>
                <div className="ml-3">
                    <p className={`text-sm font-medium ${currentColors.text}`}>
                        {alert.message}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default IntelligentAlertWidget;
