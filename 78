import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Star, ShieldCheck } from 'lucide-react';

const SubscriptionBadge = () => {
    const { dataState } = useData();
    const { profile } = dataState;

    const subscriptionInfo = useMemo(() => {
        if (!profile) return null;

        const status = profile.subscriptionStatus;

        if (status === 'lifetime') {
            return { text: 'À Vie', color: 'bg-amber-400 text-amber-900', icon: Star };
        }
        if (status === 'active') {
            return { text: 'Pro', color: 'bg-green-400 text-green-900', icon: ShieldCheck };
        }
        
        // Don't show any badge for trial status
        if (status === 'trialing') {
            return null;
        }

        return null; // No badge if trial is over and not subscribed
    }, [profile]);

    if (!subscriptionInfo) return null;

    const Icon = subscriptionInfo.icon;

    return (
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${subscriptionInfo.color}`}>
            <Icon className="w-3 h-3" />
            <span>{subscriptionInfo.text}</span>
        </div>
    );
};

export default SubscriptionBadge;
