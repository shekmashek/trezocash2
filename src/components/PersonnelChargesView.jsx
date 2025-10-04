import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { savePersonnelCharge, deletePersonnelCharge } from '../context/actions';
import { Plus, Trash2 } from 'lucide-react';

const PersonnelChargesView = ({ projectId }) => {
    const { dataState, dataDispatch } = useData();
    const { uiDispatch } = useUI();
    const { personnelCharges, session } = dataState;

    const projectCharges = useMemo(() => {
        return (personnelCharges || []).filter(c => c.project_id === projectId);
    }, [personnelCharges, projectId]);

    const [newCharge, setNewCharge] = useState({ name: '', rate: '', base: 'brut' });

    const handleAddCharge = () => {
        if (!newCharge.name.trim() || !newCharge.rate) {
            uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Veuillez remplir le nom et le taux.', type: 'error' } });
            return;
        }
        const chargeToSave = {
            project_id: projectId,
            user_id: session.user.id,
            name: newCharge.name.trim(),
            rate: parseFloat(newCharge.rate),
            base: newCharge.base,
        };
        savePersonnelCharge({ dataDispatch, uiDispatch }, chargeToSave);
        setNewCharge({ name: '', rate: '', base: 'brut' });
    };

    const handleDelete = (chargeId) => {
        uiDispatch({
            type: 'OPEN_CONFIRMATION_MODAL',
            payload: {
                title: 'Supprimer cette charge ?',
                message: 'Cette action est irréversible.',
                onConfirm: () => deletePersonnelCharge({ dataDispatch, uiDispatch }, chargeId),
            }
        });
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                {projectCharges.map(charge => (
                    <div key={charge.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                        <div className="flex items-center gap-4">
                            <span className="font-medium text-gray-800">{charge.name}</span>
                            <span className="text-sm text-gray-600">{charge.rate}% sur {charge.base}</span>
                        </div>
                        <button onClick={() => handleDelete(charge.id)} className="p-1 text-red-500 hover:text-red-700">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
            <div className="flex gap-2 pt-4 border-t">
                <input
                    type="text"
                    value={newCharge.name}
                    onChange={(e) => setNewCharge(c => ({ ...c, name: e.target.value }))}
                    placeholder="Nom de la charge (ex: Cotisation retraite)"
                    className="flex-grow px-3 py-2 border rounded-lg text-sm"
                />
                <input
                    type="number"
                    value={newCharge.rate}
                    onChange={(e) => setNewCharge(c => ({ ...c, rate: e.target.value }))}
                    placeholder="Taux %"
                    className="w-24 px-3 py-2 border rounded-lg text-sm"
                    step="0.01"
                />
                <select
                    value={newCharge.base}
                    onChange={(e) => setNewCharge(c => ({ ...c, base: e.target.value }))}
                    className="px-3 py-2 border rounded-lg text-sm bg-white"
                >
                    <option value="brut">Salaire Brut</option>
                    <option value="net">Salaire Net</option>
                </select>
                <button onClick={handleAddCharge} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg font-medium flex items-center justify-center gap-1 text-sm">
                    <Plus size={16} /> Ajouter
                </button>
            </div>
        </div>
    );
};

export default PersonnelChargesView;
