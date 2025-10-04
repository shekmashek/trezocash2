import React from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { Hash, Edit, Trash2 } from 'lucide-react';
import EmptyState from './EmptyState';
import { useUI } from '../context/UIContext';
import { deleteTaxConfig } from '../context/actions';

const TaxList = () => {
    const { dataState, dataDispatch } = useData();
    const { uiDispatch } = useUI();
    const { taxConfigs } = dataState;
    const navigate = useNavigate();

    const handleEdit = (taxId) => {
        navigate(`/app/fiscalite/${taxId}`);
    };

    const handleDelete = (taxId, taxName) => {
        uiDispatch({
            type: 'OPEN_CONFIRMATION_MODAL',
            payload: {
                title: `Supprimer "${taxName}" ?`,
                message: 'Cette action est irréversible.',
                onConfirm: () => deleteTaxConfig({dataDispatch, uiDispatch}, taxId),
            }
        });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Mes Impôts et Taxes</h2>
            {taxConfigs.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                    {taxConfigs.map(tax => (
                        <li key={tax.id} className="py-4 flex justify-between items-center group">
                            <div>
                                <p className="font-semibold text-gray-800">{tax.name}</p>
                                <p className="text-sm text-gray-500">
                                    {tax.rate}% sur {tax.base_type}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(tax.id)} className="p-2 text-blue-600 hover:text-blue-800"><Edit size={16} /></button>
                                <button onClick={() => handleDelete(tax.id, tax.name)} className="p-2 text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <EmptyState
                    icon={Hash}
                    title="Aucun impôt personnalisé"
                    message="Créez des impôts et taxes pour automatiser leur calcul dans vos prévisions."
                    actionText="Créer un impôt"
                    onActionClick={() => navigate('/app/fiscalite/new')}
                />
            )}
        </div>
    );
};

export default TaxList;
