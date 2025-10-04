import React, { useState } from 'react';
import { useUI } from '../context/UIContext';
import { supabase } from '../utils/supabase';
import { AlertTriangle, Trash2 } from 'lucide-react';

const DeleteAccountView = () => {
    const { uiDispatch } = useUI();
    const [confirmationText, setConfirmationText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleDeleteAccount = async () => {
        if (confirmationText !== 'SUPPRIMER') {
            uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Veuillez taper "SUPPRIMER" pour confirmer.', type: 'error' } });
            return;
        }
        setLoading(true);
        const { error } = await supabase.functions.invoke('delete-user-account');
        if (error) {
            uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
            setLoading(false);
        } else {
            await supabase.auth.signOut();
            // The user will be redirected to the login page by the auth listener
        }
    };

    return (
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg">
            <h2 className="text-xl font-bold text-red-800 mb-4 flex items-center gap-3"><AlertTriangle /> Supprimer mon compte</h2>
            <p className="text-red-700 mb-4">Cette action est irréversible. Toutes vos données, y compris vos projets, budgets et transactions, seront définitivement supprimées.</p>
            <div className="space-y-4 max-w-md">
                <div>
                    <label className="block text-sm font-medium text-red-800 mb-1">Pour confirmer, veuillez taper "SUPPRIMER" dans le champ ci-dessous :</label>
                    <input type="text" value={confirmationText} onChange={(e) => setConfirmationText(e.target.value)} className="w-full px-3 py-2 border border-red-300 rounded-lg" />
                </div>
                <button onClick={handleDeleteAccount} disabled={loading || confirmationText !== 'SUPPRIMER'} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-gray-400">
                    <Trash2 className="w-4 h-4" />
                    {loading ? 'Suppression en cours...' : 'Supprimer mon compte définitivement'}
                </button>
            </div>
        </div>
    );
};

export default DeleteAccountView;
