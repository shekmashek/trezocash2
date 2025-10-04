import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabase';
import { useUI } from '../context/UIContext';
import { Loader, DollarSign, Gift } from 'lucide-react';
import { formatCurrency } from '../utils/formatting';

const RecordPaymentModal = ({ isOpen, onClose, onSave, ambassador }) => {
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (isOpen && ambassador) {
            setAmount(ambassador.dueCommissions > 0 ? ambassador.dueCommissions.toFixed(2) : '');
            setNotes('');
        }
    }, [isOpen, ambassador]);

    const handleSubmit = () => {
        if (!amount || parseFloat(amount) <= 0) {
            alert('Veuillez entrer un montant valide.');
            return;
        }
        onSave({
            referrer_id: ambassador.id,
            amount: parseFloat(amount),
            notes,
        });
    };

    if (!isOpen || !ambassador) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full text-white">
                <div className="p-4 border-b border-gray-700">
                    <h2 className="text-lg font-semibold">Enregistrer un paiement pour {ambassador.full_name}</h2>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Montant dû</label>
                        <p className="text-xl font-bold text-yellow-400">{formatCurrency(ambassador.dueCommissions, { currency: 'EUR' })}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Montant du paiement *</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-600 bg-gray-900 rounded-lg" required step="0.01" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Notes (optionnel)</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-600 bg-gray-900 rounded-lg" rows="3"></textarea>
                    </div>
                </div>
                <div className="p-4 bg-gray-900/50 flex justify-end gap-3 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500">Annuler</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700">Enregistrer</button>
                </div>
            </div>
        </div>
    );
};

const AdminReferralManagementPage = () => {
    const { uiDispatch } = useUI();
    const [ambassadors, setAmbassadors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAmbassador, setSelectedAmbassador] = useState(null);

    useEffect(() => {
        const fetchReferralData = async () => {
            setLoading(true);
            try {
                const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id, full_name, email');
                if (profilesError) throw profilesError;

                const { data: referrals, error: referralsError } = await supabase.from('referrals').select('referrer_id, referred_id');
                if (referralsError) throw referralsError;

                const { data: levels, error: levelsError } = await supabase.from('referral_levels').select('*').order('min_referrals', { ascending: true });
                if (levelsError) throw levelsError;

                const { data: payments, error: paymentsError } = await supabase.from('referral_payments').select('*');
                if (paymentsError) throw paymentsError;

                const referrers = profiles.filter(p => referrals.some(r => r.referrer_id === p.id));

                const ambassadorData = referrers.map(referrer => {
                    const referredUsers = referrals.filter(r => r.referrer_id === referrer.id);
                    const validatedCount = referredUsers.length; // Simplified for now
                    const level = levels.slice().reverse().find(l => validatedCount >= l.min_referrals) || levels[0];
                    const totalCommissions = (level.commission_rate / 100) * validatedCount * (12 * 12); // Simplified: 12€/month for a year
                    const paidCommissions = payments.filter(p => p.referrer_id === referrer.id).reduce((sum, p) => sum + parseFloat(p.amount), 0);
                    const dueCommissions = totalCommissions - paidCommissions;

                    return {
                        ...referrer,
                        levelName: level.name,
                        validatedCount,
                        totalCommissions,
                        paidCommissions,
                        dueCommissions,
                    };
                });

                setAmbassadors(ambassadorData);

            } catch (error) {
                uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
            } finally {
                setLoading(false);
            }
        };

        fetchReferralData();
    }, [uiDispatch]);

    const handleOpenModal = (ambassador) => {
        setSelectedAmbassador(ambassador);
        setIsModalOpen(true);
    };

    const handleSavePayment = async (paymentData) => {
        try {
            const { data, error } = await supabase.from('referral_payments').insert(paymentData).select().single();
            if (error) throw error;

            setAmbassadors(ambassadors.map(amb => {
                if (amb.id === data.referrer_id) {
                    const newPaid = amb.paidCommissions + parseFloat(data.amount);
                    return {
                        ...amb,
                        paidCommissions: newPaid,
                        dueCommissions: amb.totalCommissions - newPaid,
                    };
                }
                return amb;
            }));

            uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Paiement enregistré.', type: 'success' } });
        } catch (error) {
            uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
        } finally {
            setIsModalOpen(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center p-8"><Loader className="animate-spin w-8 h-8 text-white" /></div>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-white flex items-center gap-3"><Gift className="w-8 h-8 text-amber-400" /> Gestion des Parrainages</h1>
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
                <table className="w-full text-sm">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="px-6 py-3 text-left font-medium text-gray-300">Ambassadeur</th>
                            <th className="px-6 py-3 text-center font-medium text-gray-300">Niveau</th>
                            <th className="px-6 py-3 text-center font-medium text-gray-300">Filleuls Validés</th>
                            <th className="px-6 py-3 text-right font-medium text-gray-300">Commissions Dues</th>
                            <th className="px-6 py-3 text-right font-medium text-gray-300">Commissions Payées</th>
                            <th className="px-6 py-3 text-center font-medium text-gray-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {ambassadors.map(amb => (
                            <tr key={amb.id} className="hover:bg-gray-700/50">
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-white">{amb.full_name}</div>
                                    <div className="text-gray-400">{amb.email}</div>
                                </td>
                                <td className="px-6 py-4 text-center font-semibold">{amb.levelName}</td>
                                <td className="px-6 py-4 text-center font-semibold">{amb.validatedCount}</td>
                                <td className="px-6 py-4 text-right font-bold text-yellow-400">{formatCurrency(amb.dueCommissions, { currency: 'EUR' })}</td>
                                <td className="px-6 py-4 text-right text-green-400">{formatCurrency(amb.paidCommissions, { currency: 'EUR' })}</td>
                                <td className="px-6 py-4 text-center">
                                    <button onClick={() => handleOpenModal(amb)} disabled={amb.dueCommissions <= 0} className="px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 mx-auto bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
                                        <DollarSign size={14} /> Enregistrer Paiement
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <RecordPaymentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSavePayment}
                ambassador={selectedAmbassador}
            />
        </div>
    );
};

export default AdminReferralManagementPage;
