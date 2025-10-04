import React from 'react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { LayoutTemplate, Plus, Edit, Trash2 } from 'lucide-react';
import EmptyState from './EmptyState';
import { deleteTemplate } from '../context/actions';

const MyTemplatesView = () => {
    const { dataState, dataDispatch } = useData();
    const { uiDispatch } = useUI();
    const { templates, session } = dataState;

    const myTemplates = templates.filter(t => t.userId === session.user.id);

    const handleCreateTemplate = () => {
        uiDispatch({ type: 'OPEN_SAVE_TEMPLATE_MODAL', payload: null });
    };

    const handleEditTemplate = (template) => {
        uiDispatch({ type: 'OPEN_SAVE_TEMPLATE_MODAL', payload: template });
    };

    const handleDeleteTemplate = (templateId) => {
        uiDispatch({
            type: 'OPEN_CONFIRMATION_MODAL',
            payload: {
                title: 'Supprimer ce modèle ?',
                message: 'Cette action est irréversible.',
                onConfirm: () => deleteTemplate({dataDispatch, uiDispatch}, templateId),
            }
        });
    };

    return (
        <div>
            <div className="mb-8 flex justify-end">
                <button onClick={handleCreateTemplate} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Créer un modèle
                </button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Mes Modèles</h2>
                {myTemplates.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {myTemplates.map(template => (
                            <li key={template.id} className="py-4 flex justify-between items-center group">
                                <div>
                                    <p className="font-semibold text-gray-800">{template.name}</p>
                                    <p className="text-sm text-gray-500">{template.description}</p>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditTemplate(template)} className="p-2 text-blue-600 hover:text-blue-800"><Edit size={16} /></button>
                                    <button onClick={() => handleDeleteTemplate(template.id)} className="p-2 text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <EmptyState
                        icon={LayoutTemplate}
                        title="Aucun modèle personnel"
                        message="Créez des modèles à partir de vos projets pour démarrer plus rapidement la prochaine fois."
                        actionText="Créer mon premier modèle"
                        onActionClick={handleCreateTemplate}
                    />
                )}
            </div>
        </div>
    );
};

export default MyTemplatesView;
