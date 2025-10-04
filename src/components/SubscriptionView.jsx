import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { supabase } from '../utils/supabase';
import { CheckCircle, Star } from 'lucide-react';

const SubscriptionView = () => {
    const { dataState } = useData();
    const { uiDispatch } = useUI();
    const { profile } = dataState;
    const [loading, setLoading] = useState(false);
    const [billingCycle, setBillingCycle] = useState('monthly');

    const handleCreateCheckoutSession = async (priceId) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                body: { priceId },
            });
            if (error) throw error;
            window.location.href = data.url;
        } catch (error) {
            uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
            setLoading(false);
        }
    };

    const features = [
        "Suivi de trésorerie complet", "Prévisions et Simulations (Scénarios)", "Analyse des données avancée",
        "Gestion multi-projets", "Consolidation des projets", "Support client prioritaire", "Toutes les futures mises à jour"
    ];

    const plans = [
        { id: 'solo', name: 'Pack Solo', description: 'Pour les indépendants et les budgets personnels.', monthly: { price: 12, id: 'price_1PZ9ZfRxX9E0X9Zf9Zf9Zf9Z' }, annual: { price: 96, id: 'price_1PZ9ZfRxX9E0X9Zf9Zf9Zf9Z' } },
        { id: 'team', name: 'Pack Team', description: 'Pour les équipes et les entreprises qui collaborent.', monthly: { price: 20, id: 'price_1PZ9ZfRxX9E0X9Zf9Zf9Zf9Z' }, annual: { price: 160, id: 'price_1PZ9ZfRxX9E0X9Zf9Zf9Zf9Z' }, highlight: true },
        { id: 'lifetime', name: 'Pack Lifetime', description: 'Un paiement unique, un accès à vie.', price: 499, id: 'price_1PZ9ZfRxX9E0X9Zf9Zf9Zf9Z', special: true },
    ];

    return (
        <div className="space-y-8">
            {/* Current Plan */}
            <div className="bg-white p-8 rounded-lg shadow-sm border">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Mon Abonnement</h2>
                <div className="bg-gray-100 p-6 rounded-lg flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600">Statut actuel</p>
                        <p className="text-lg font-semibold text-gray-800">{profile?.subscriptionStatus || 'N/A'}</p>
                    </div>
                    {/* Manage subscription button can be added here */}
                </div>
            </div>

            {/* Pricing */}
            <div className="bg-white p-8 rounded-lg shadow-sm border">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Changer d'offre</h2>
                <div className="flex justify-center items-center gap-4 mb-10">
                    <span className={`font-semibold transition-colors ${billingCycle === 'monthly' ? 'text-blue-600' : 'text-gray-500'}`}>Mensuel</span>
                    <button onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')} className="w-12 h-6 rounded-full p-1 flex items-center transition-colors bg-blue-600">
                        <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${billingCycle === 'annual' ? 'translate-x-6' : ''}`} />
                    </button>
                    <span className={`font-semibold transition-colors ${billingCycle === 'annual' ? 'text-blue-600' : 'text-gray-500'}`}>Annuel</span>
                    <span className="px-3 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">-33% Économie</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {plans.map(plan => (
                        <div key={plan.id} className={`p-6 rounded-2xl border ${plan.highlight ? 'border-2 border-blue-600' : ''}`}>
                            <h3 className="text-xl font-semibold text-center">{plan.name}</h3>
                            <p className="text-sm text-gray-500 mt-2 text-center h-10">{plan.description}</p>
                            <div className="my-8 text-center">
                                {plan.special ? (
                                    <>
                                        <span className="text-5xl font-extrabold">{plan.price}€</span>
                                        <span className="text-xl font-medium text-gray-500"> / à vie</span>
                                    </>
                                ) : billingCycle === 'monthly' ? (
                                    <>
                                        <span className="text-5xl font-extrabold">{plan.monthly.price}€</span>
                                        <span className="text-xl font-medium text-gray-500"> / mois</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-5xl font-extrabold">{plan.annual.price}€</span>
                                        <span className="text-xl font-medium text-gray-500"> / an</span>
                                    </>
                                )}
                            </div>
                            <button onClick={() => handleCreateCheckoutSession(plan.special ? plan.id : plan[billingCycle].id)} disabled={loading} className={`w-full py-3 font-semibold rounded-lg ${plan.highlight ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                {loading ? 'Chargement...' : 'Choisir ce plan'}
                            </button>
                            <ul className="space-y-3 text-sm mt-8">
                                {features.map((feature, index) => (<li key={index} className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500" />{feature}</li>))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SubscriptionView;
