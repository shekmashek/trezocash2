import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabase';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { Loader, Award, BarChart, DollarSign, Users, Gift, Link, Copy, Check, Clock, XCircle } from 'lucide-react';
import { formatCurrency } from '../utils/formatting';

const levelIcons = {
    Bronze: '🥉',
    Argent: '🥈',
    Or: '🥇',
    Platinum: '💎',
    Diamant: '💎',
    Legendaire: '🎖️'
};

const StatusCard = ({ level, nextLevel, validatedCount }) => {
    const progress = nextLevel ? (validatedCount / nextLevel.min_referrals) * 100 : 100;
    const remaining = nextLevel ? nextLevel.min_referrals - validatedCount : 0;
    const Icon = level ? (levelIcons[level.name] || '🏆') : '🏆';

    if (!level) return null;

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-blue-500" /> Mon Statut</h3>
            <div className="text-center">
                <div className="text-5xl mb-2">{Icon}</div>
                <h4 className="text-2xl font-bold text-gray-800">Ambassadeur {level.name}</h4>
                {nextLevel && (
                    <div className="mt-4 text-sm">
                        <p className="text-gray-600">Prochain niveau : <span className="font-semibold">{nextLevel.name}</span> ({nextLevel.min_referrals} parrainages)</p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 my-2">
                            <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-xs text-gray-500">{remaining} parrainage{remaining > 1 ? 's' : ''} restant{remaining > 1 ? 's' : ''}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const StatsCard = ({ stats }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><BarChart className="w-5 h-5 text-blue-500" /> Mes Stats Globales</h3>
        <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span>Personnes invitées :</span> <span className="font-bold">{stats.invitedCount}</span></div>
            <div className="flex justify-between"><span>Abonnements validés :</span> <span className="font-bold text-green-600">{stats.validatedCount} 🎉</span></div>
            <div className="flex justify-between"><span>Taux de conversion :</span> <span className="font-bold">{stats.conversionRate.toFixed(0)}%</span></div>
            <div className="flex justify-between"><span>Revenus générés (est.) :</span> <span className="font-bold">{formatCurrency(stats.generatedRevenue, { currency: 'EUR' })}/an</span></div>
        </div>
    </div>
);

const CommissionsCard = ({ level, validatedCount }) => {
    const commission = useMemo(() => {
        if (!level || level.commission_rate === 0) return { monthly: 0, total: 0 };
        const monthly = validatedCount * 12 * level.commission_rate;
        return { monthly };
    }, [level, validatedCount]);

    if (!level) return null;

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-blue-500" /> Mes Commissions</h3>
            {level.commission_rate > 0 ? (
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span>Commission mensuelle (est.) :</span> <span className="font-bold">{formatCurrency(commission.monthly, { currency: 'EUR' })}/mois</span></div>
                    <div className="flex justify-between"><span>Total perçu (à venir) :</span> <span className="font-bold">...</span></div>
                    <div className="flex justify-between"><span>Prochain paiement :</span> <span className="font-bold">...</span></div>
                </div>
            ) : (
                <p className="text-sm text-gray-500 text-center py-4">Atteignez le niveau Argent pour commencer à gagner des commissions !</p>
            )}
        </div>
    );
};

const ReferralsList = ({ referees }) => {
    const getStatus = (status) => {
        switch (status) {
            case 'active': case 'lifetime': return { text: 'Actif', icon: Check, color: 'text-green-500' };
            case 'trialing': return { text: 'En essai', icon: Clock, color: 'text-yellow-500' };
            default: return { text: 'Inactif', icon: XCircle, color: 'text-red-500' };
        }
    };
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border lg:col-span-2">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-blue-500" /> Mes Filleuls Actifs</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {referees.length > 0 ? referees.map(ref => {
                    const statusInfo = getStatus(ref.subscription_status);
                    const StatusIcon = statusInfo.icon;
                    return (
                        <div key={ref.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                            <span className="font-medium text-sm">{ref.full_name || ref.email}</span>
                            <span className={`flex items-center gap-1 text-xs font-semibold ${statusInfo.color}`}><StatusIcon className="w-3 h-3" /> {statusInfo.text}</span>
                        </div>
                    );
                }) : <p className="text-sm text-gray-500 text-center py-4">Invitez votre premier filleul pour le voir apparaître ici.</p>}
            </div>
        </div>
    );
};

const RewardsCard = ({ validatedCount }) => {
    const rewards = [
        { needed: 1, label: '1 mois offert' },
        { needed: 3, label: '3 mois offerts' },
        { needed: 5, label: '6 mois offerts' },
        { needed: 10, label: 'Abonnement -50% à vie' },
    ];
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><Gift className="w-5 h-5 text-blue-500" /> Mes Récompenses Débloquées</h3>
            <ul className="space-y-2 text-sm">
                {rewards.map(reward => {
                    const isUnlocked = validatedCount >= reward.needed;
                    return (
                        <li key={reward.label} className={`flex items-center gap-2 ${isUnlocked ? '' : 'opacity-50'}`}>
                            <Check className={`w-4 h-4 rounded-full p-0.5 ${isUnlocked ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`} />
                            <span>{reward.label} ({reward.needed} parrainage{reward.needed > 1 ? 's' : ''})</span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

const LinkCard = ({ referralCode }) => {
    const [copied, setCopied] = useState(false);
    const link = `https://trezocash.com/signup?ref=${referralCode}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(link).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border lg:col-span-3">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><Link className="w-5 h-5 text-blue-500" /> Mon Écosystème de Parrainage</h3>
            <div className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50">
                <input type="text" readOnly value={link} className="w-full bg-transparent outline-none text-sm text-gray-600" />
                <button onClick={copyToClipboard} className="flex items-center gap-1 px-3 py-1 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copié !' : 'Copier'}
                </button>
            </div>
        </div>
    );
};


const ReferralDashboard = () => {
    const { dataState } = useData();
    const { uiDispatch } = useUI();
    const { session } = dataState;
    const [loading, setLoading] = useState(true);
    const [referralData, setReferralData] = useState(null);

    useEffect(() => {
        const fetchReferralData = async () => {
            if (!session?.user) {
                setLoading(false);
                return;
            }

            try {
                // Replace multiple client-side queries with a single, secure RPC call
                const { data, error } = await supabase.rpc('get_referral_data');
                
                if (error) {
                    // Check for a specific error message that indicates the function might not exist
                    if (error.message.includes('function get_referral_data() does not exist')) {
                         console.warn("RPC function 'get_referral_data' not found. Falling back to an empty state. This function should be created in the database for the referral system to work.");
                         setReferralData({
                            referralCode: 'N/A',
                            invitedCount: 0,
                            validatedCount: 0,
                            conversionRate: 0,
                            generatedRevenue: 0,
                            referees: [],
                            levels: [],
                            currentLevel: { name: 'Bronze', commission_rate: 0 },
                            nextLevel: null,
                        });
                    } else {
                        throw error;
                    }
                } else {
                    setReferralData(data);
                }

            } catch (error) {
                console.error("Error fetching referral data:", error);
                uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur lors de la récupération des données de parrainage.`, type: 'error' } });
            } finally {
                setLoading(false);
            }
        };

        fetchReferralData();
    }, [session, uiDispatch]);

    if (loading) {
        return <div className="flex justify-center items-center p-8"><Loader className="animate-spin w-8 h-8 text-blue-600" /></div>;
    }

    if (!referralData) {
        return <p>Impossible de charger les données de parrainage.</p>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <StatusCard level={referralData.currentLevel} nextLevel={referralData.nextLevel} validatedCount={referralData.validatedCount} />
            <StatsCard stats={{ invitedCount: referralData.invitedCount, validatedCount: referralData.validatedCount, conversionRate: referralData.conversionRate, generatedRevenue: referralData.generatedRevenue }} />
            <CommissionsCard level={referralData.currentLevel} validatedCount={referralData.validatedCount} />
            <ReferralsList referees={referralData.referees} />
            <RewardsCard validatedCount={referralData.validatedCount} />
            <LinkCard referralCode={referralData.referralCode} />
        </div>
    );
};

export default ReferralDashboard;
