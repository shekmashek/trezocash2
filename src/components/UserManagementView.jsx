import React, { useState, useMemo } from 'react';
import { Users, UserPlus, Mail, Send, Trash2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { inviteCollaborator, revokeCollaborator } from '../context/actions';
import Avatar from './Avatar';

const UserManagementView = () => {
    const { dataState, dataDispatch } = useData();
    const { uiDispatch } = useUI();
    const { session, projects, collaborators, allProfiles, categories } = dataState;

    const [inviteEmail, setInviteEmail] = useState('');
    const [permissions, setPermissions] = useState({});

    const ownedProjects = useMemo(() => {
        return projects.filter(p => !p.isArchived && p.user_id === session.user.id);
    }, [projects, session.user.id]);

    const activeCollaborators = useMemo(() => {
        return collaborators
            .filter(c => c.status === 'accepted')
            .map(c => ({ ...c, profile: allProfiles.find(p => p.id === c.userId) }))
            .filter(c => c.profile);
    }, [collaborators, allProfiles]);

    const pendingInvites = useMemo(() => {
        return collaborators.filter(c => c.status === 'pending');
    }, [collaborators]);

    const handlePermissionChange = (categoryId, field, value) => {
        setPermissions(prev => ({
            ...prev,
            categories: {
                ...(prev.categories || {}),
                [categoryId]: {
                    ...(prev.categories?.[categoryId] || { access: 'none', budget: null }),
                    [field]: value
                }
            }
        }));
    };

    const handleInvite = (e) => {
        e.preventDefault();
        if (!inviteEmail.trim()) {
            uiDispatch({ type: 'ADD_TOAST', payload: { message: "Veuillez saisir un e-mail.", type: 'error' } });
            return;
        }

        const projectIdsToShare = ownedProjects.map(p => p.id);

        if (projectIdsToShare.length === 0) {
            uiDispatch({ type: 'ADD_TOAST', payload: { message: "Vous n'avez aucun projet à partager.", type: 'error' } });
            return;
        }

        inviteCollaborator({ dataDispatch, uiDispatch }, {
            email: inviteEmail,
            permissions: permissions,
            projectIds: projectIdsToShare,
        });
        setInviteEmail('');
        setPermissions({});
    };

    const handleRevoke = (collaboratorId, name) => {
        uiDispatch({
            type: 'OPEN_CONFIRMATION_MODAL',
            payload: {
                title: `Révoquer l'accès de ${name} ?`,
                message: 'Cette personne perdra l\'accès à tous les projets partagés. Cette action est irréversible.',
                onConfirm: () => revokeCollaborator({ dataDispatch, uiDispatch }, collaboratorId),
            }
        });
    };
    
    const renderPermissionsForm = (type) => {
        const mainCategories = categories[type] || [];
        return (
            <div>
                <h4 className="font-semibold text-gray-600 mb-2 capitalize">{type === 'revenue' ? 'Entrées' : 'Sorties'}</h4>
                <div className="space-y-3">
                    {mainCategories.map(cat => (
                        <div key={cat.id} className="grid grid-cols-12 gap-2 items-center text-sm">
                            <span className="col-span-4 truncate" title={cat.name}>{cat.name}</span>
                            <div className="col-span-4">
                                <select 
                                    value={permissions.categories?.[cat.id]?.access || 'none'}
                                    onChange={(e) => handlePermissionChange(cat.id, 'access', e.target.value)}
                                    className="w-full p-1 border rounded-md bg-white text-xs"
                                >
                                    <option value="none">Aucun accès</option>
                                    <option value="read">Lecture</option>
                                    <option value="write">Lecture & Écriture</option>
                                </select>
                            </div>
                            <div className="col-span-4">
                                <input
                                    type="number"
                                    placeholder="Plafond"
                                    value={permissions.categories?.[cat.id]?.budget || ''}
                                    onChange={(e) => handlePermissionChange(cat.id, 'budget', e.target.value)}
                                    disabled={permissions.categories?.[cat.id]?.access !== 'write'}
                                    className="w-full p-1 border rounded-md text-xs disabled:bg-gray-100"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-blue-600" />
                    Inviter un nouveau collaborateur
                </h3>
                <form onSubmit={handleInvite} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail du collaborateur</label>
                            <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="nom@exemple.com" className="w-full px-3 py-2 border rounded-lg text-sm" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Permissions par catégorie</label>
                        <div className="p-4 border rounded-lg bg-gray-50 space-y-4 max-h-96 overflow-y-auto">
                            {renderPermissionsForm('revenue')}
                            <hr/>
                            {renderPermissionsForm('expense')}
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2">
                            <Send className="w-4 h-4" /> Envoyer l'invitation
                        </button>
                    </div>
                </form>
            </div>
            
            {activeCollaborators.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="font-bold text-lg text-gray-800 mb-4">Collaborateurs Actifs</h3>
                    <ul className="divide-y divide-gray-200">
                        {activeCollaborators.map(collab => (
                            <li key={collab.id} className="py-3 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <Avatar name={collab.profile?.full_name || collab.email} />
                                    <div>
                                        <p className="font-semibold text-sm text-gray-800">{collab.profile?.full_name || 'Utilisateur inconnu'}</p>
                                        <p className="text-xs text-gray-500">{collab.email}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleRevoke(collab.id, collab.profile?.full_name || collab.email)} className="text-red-500 hover:text-red-700 text-sm font-medium">Révoquer</button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {pendingInvites.length > 0 && (
                <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="font-bold text-lg text-gray-800 mb-4">Invitations en Attente</h3>
                    <ul className="divide-y divide-gray-200">
                        {pendingInvites.map(invite => (
                            <li key={invite.id} className="py-3 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                        <Mail className="w-5 h-5 text-gray-500" />
                                    </div>
                                    <p className="font-medium text-sm text-gray-600">{invite.email}</p>
                                </div>
                                <button onClick={() => handleRevoke(invite.id, invite.email)} className="text-red-500 hover:text-red-700 text-sm font-medium">Annuler</button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default UserManagementView;
