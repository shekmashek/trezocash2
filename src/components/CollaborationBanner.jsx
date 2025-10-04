import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { Info } from 'lucide-react';

const getRoleFromPermissions = (permissions) => {
    if (!permissions || !permissions.categories) {
        return 'lecture seule';
    }
    const hasWriteAccess = Object.values(permissions.categories).some(p => p.access === 'write');
    return hasWriteAccess ? 'éditeur' : 'lecture seule';
};

const CollaborationBanner = () => {
    const { dataState } = useData();
    const { uiState } = useUI();
    const { session, projects, collaborators, allProfiles } = dataState;
    const { activeProjectId } = uiState;

    const sharedProjectInfo = useMemo(() => {
        if (!activeProjectId || activeProjectId === 'consolidated' || activeProjectId.startsWith('consolidated_view_')) {
            return null;
        }

        const activeProject = projects.find(p => p.id === activeProjectId);
        if (activeProject && session && activeProject.user_id !== session.user.id) {
            const ownerProfile = allProfiles.find(p => p.id === activeProject.user_id);
            const myCollaboration = collaborators.find(c => session.user && c.userId === session.user.id && c.projectIds?.includes(activeProjectId));
            
            if (ownerProfile && myCollaboration) {
                const role = getRoleFromPermissions(myCollaboration.permissions);
                return {
                    ownerName: ownerProfile.full_name || 'un utilisateur',
                    role: role
                };
            }
        }
        return null;
    }, [activeProjectId, projects, session, allProfiles, collaborators]);

    if (sharedProjectInfo) {
        return (
            <div className="bg-yellow-50 border-b border-yellow-200 text-yellow-800 px-6 py-2">
                <div className="flex justify-center items-center">
                    <div className="flex items-center gap-2 text-sm">
                        <Info className="w-4 h-4 flex-shrink-0" />
                        <p>
                            Vous travaillez sur le projet de <strong>{sharedProjectInfo.ownerName}</strong> en tant que <strong>{sharedProjectInfo.role}</strong>.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default CollaborationBanner;
