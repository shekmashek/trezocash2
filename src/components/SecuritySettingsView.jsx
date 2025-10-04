import React, { useState } from 'react';
import { useUI } from '../context/UIContext';
import { supabase } from '../utils/supabase';
import { Save, Shield, Eye, EyeOff } from 'lucide-react';

const SecuritySettingsView = () => {
    const { uiDispatch } = useUI();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Les mots de passe ne correspondent pas.', type: 'error' } });
            return;
        }
        if (password.length < 6) {
            uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Le mot de passe doit faire au moins 6 caractères.', type: 'error' } });
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
            uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
        } else {
            uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Mot de passe mis à jour avec succès.', type: 'success' } });
            setPassword('');
            setConfirmPassword('');
        }
        setLoading(false);
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-sm border">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3"><Shield className="w-6 h-6 text-green-600" /> Mot de passe et Sécurité</h2>
            <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-lg">
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-8 text-gray-500"><Eye size={18} /></button>
                </div>
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le nouveau mot de passe</label>
                    <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-8 text-gray-500">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
                <div className="flex justify-end pt-4">
                    <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 disabled:bg-gray-400">
                        <Save className="w-4 h-4" />
                        {loading ? 'Enregistrement...' : 'Changer le mot de passe'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SecuritySettingsView;
