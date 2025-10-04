import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import Avatar from './Avatar';
import { motion } from 'framer-motion';

const ProjectCollaborators = () => {
    const { dataState } = useData();
    const { uiState } = useUI();
    const { activeProjectId } = uiState;
    const { projects, collaborators, allProfiles, consolidatedViews, session } = dataState;

    const projectUsers = useMemo(() => {
        if (!activeProjectId || !allProfiles.length || !session?.user) return [];

        const usersMap = new Map();

        const addUser = (userId, role) => {
            if (!userId || usersMap.has(userId)) return;
            const profile = allProfiles.find(p => p.id === userId);
            if (profile) {
                usersMap.set(userId, { ...profile, role });
            }
        };

        const getRoleFromPermissions = (permissions) => {
            if (!permissions || !permissions.categories) {
                return 'Lecteur'; // Default to least privilege
            }
            const hasWriteAccess = Object.values(permissions.categories).some(p => p.access === 'write');
            if (hasWriteAccess) {
                return 'Éditeur';
            }
            return 'Lecteur';
        };

        if (activeProjectId.startsWith('consolidated_view_')) {
            const viewId = activeProjectId.replace('consolidated_view_', '');
            const view = consolidatedViews.find(v => v.id === viewId);
            if (!view) return [];

            view.project_ids.forEach(projectId => {
                const project = projects.find(p => p.id === projectId);
                if (project) {
                    addUser(project.user_id, 'Propriétaire');
                }
                collaborators.forEach(c => {
                    if (c.projectIds && c.projectIds.includes(projectId)) {
                        const role = getRoleFromPermissions(c.permissions);
                        addUser(c.userId, role);
                    }
                });
            });

        } else if (activeProjectId === 'consolidated') {
            projects.forEach(project => {
                if (!project.isArchived) {
                    addUser(project.user_id, 'Propriétaire');
                }
            });
            collaborators.forEach(c => {
                const role = getRoleFromPermissions(c.permissions);
                addUser(c.userId, role);
            });
        } else { // Single project
            const project = projects.find(p => p.id === activeProjectId);
            if (!project) return [];

            addUser(project.user_id, 'Propriétaire');

            collaborators.forEach(c => {
                if (c.projectIds && c.projectIds.includes(activeProjectId) && c.status === 'accepted') {
                    const role = getRoleFromPermissions(c.permissions);
                    addUser(c.userId, role);
                }
            });
        }

        const userArray = Array.from(usersMap.values());
        // Sort to ensure owner is first
        userArray.sort((a, b) => {
            if (a.id === session.user.id) return -1;
            if (b.id === session.user.id) return 1;
            if (a.role === 'Propriétaire') return -1;
            if (b.role === 'Propriétaire') return 1;
            return 0;
        });

        return userArray;
    }, [activeProjectId, projects, collaborators, allProfiles, consolidatedViews, session]);

    if (projectUsers.length === 0) {
        return null;
    }

    return (
        <div className="flex items-center -space-x-2">
            {projectUsers.map((user, index) => (
                <motion.div
                    key={user.id}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <Avatar name={user.full_name} role={user.role} />
                </motion.div>
            ))}
        </div>
    );
};

export default ProjectCollaborators;
