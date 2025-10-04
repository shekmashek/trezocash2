import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { supabase } from '../utils/supabase';
import { Save, User } from 'lucide-react';

const ProfileSettingsView = () => {
    const { dataState, dataDispatch } = useData();
    const { uiDispatch } = useUI();
    const { profile, session } = dataState;

    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile) {
            setFullName(profile.fullName || '');
            setPhone(profile.phone || session.user.phone || '');
        }
    }, [profile, session]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);

        const { data: { user }, error: userError } = await supabase.auth.updateUser({
            data: { full_name: fullName, phone: phone }
        });

        if (userError) {
            uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${userError.message}`, type: 'error' } });
            setLoading(false);
            return;
        }

        const { error: profileError } = await supabase
            .from('profiles')
            .update({ full_name: fullName, phone: phone })
            .eq('id', user.id);

        if (profileError) {
            uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${profileError.message}`, type: 'error' } });
        } else {
            dataDispatch({ type: 'SET_PROFILE', payload: { ...profile, fullName, phone } });
            uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Profil mis à jour.', type: 'success' } });
        }
        setLoading(false);
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-sm border">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3"><User className="w-6 h-6 text-blue-600" /> Mon Profil</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-lg">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse e-mail</label>
                    <input type="email" value={session?.user?.email || ''} disabled className="w-full px-3 py-2 border rounded-lg bg-gray-100 cursor-not-allowed" />
                </div>
                <div className="flex justify-end pt-4">
                    <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 disabled:bg-gray-400">
                        <Save className="w-4 h-4" />
                        {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfileSettingsView;
