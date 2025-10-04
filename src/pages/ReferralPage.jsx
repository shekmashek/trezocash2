import React from 'react';
import ReferralDashboard from '../components/ReferralDashboard';
import { Gift } from 'lucide-react';

const ReferralPage = () => {
    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Gift className="w-8 h-8 text-amber-500" />
                    Programme Ambassadeur
                </h1>
                <p className="text-gray-600 mt-2">Parrainez vos amis et soyez récompensé pour votre soutien !</p>
            </div>
            <ReferralDashboard />
        </div>
    );
};

export default ReferralPage;
