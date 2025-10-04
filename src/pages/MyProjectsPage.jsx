import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { Plus, Layers, Folder } from 'lucide-react';
import ProjectCard from '../components/ProjectCard';
import ConsolidatedViewCard from '../components/ConsolidatedViewCard';
import EmptyState from '../components/EmptyState';
import ProjectModal from '../components/ProjectModal';
import { saveProject, deleteProject, deleteConsolidatedView, archiveConsolidatedView } from '../context/actions';

const MyProjectsPage = () => {
    const { dataState, dataDispatch } = useData();
    const { uiState, uiDispatch } = useUI();
    const { projects, consolidatedViews, session } = dataState;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);

    const allNonArchivedProjects = useMemo(() => projects.filter(p => !p.isArchived), [projects]);

    const myTreasuryProjects = useMemo(() => 
        allNonArchivedProjects.filter(p => p.user_id === session.user.id && (p.type === 'business' || p.type === 'household')), 
    [allNonArchivedProjects, session.user.id]);

    const sharedTreasuryProjects = useMemo(() => 
        allNonArchivedProjects.filter(p => p.user_id !== session.user.id && (p.type === 'business' || p.type === 'household')), 
    [allNonArchivedProjects, session.user.id]);

    const myEventProjects = useMemo(() => 
        allNonArchivedProjects.filter(p => p.user_id === session.user.id && p.type === 'event'), 
    [allNonArchivedProjects, session.user.id]);

    const sharedEventProjects = useMemo(() => 
        allNonArchivedProjects.filter(p => p.user_id !== session.user.id && p.type === 'event'), 
    [allNonArchivedProjects, session.user.id]);

    const myConsolidatedViews = useMemo(() => consolidatedViews.filter(view => 
        !view.is_archived && view.project_ids.every(pid => myTreasuryProjects.some(mp => mp.id === pid))
    ), [consolidatedViews, myTreasuryProjects]);

    const totalProjects = allNonArchivedProjects.length;

    const handleNewProject = () => {
        uiDispatch({ type: 'START_ONBOARDING' });
    };

    const handleEditProject = (project) => {
        setEditingProject(project);
        setIsModalOpen(true);
    };

    const handleArchiveProject = (project) => {
        uiDispatch({
            type: 'OPEN_CONFIRMATION_MODAL',
            payload: {
                title: `Archiver "${project.name}" ?`,
                message: "Vous pourrez restaurer ce projet plus tard depuis les archives.",
                onConfirm: () => dataDispatch({ type: 'ARCHIVE_PROJECT_SUCCESS', payload: project.id }),
                confirmText: 'Archiver',
                confirmColor: 'primary'
            }
        });
    };
    
    const handleDeleteProject = (project) => {
        uiDispatch({
            type: 'OPEN_CONFIRMATION_MODAL',
            payload: {
                title: `Supprimer "${project.name}" ?`,
                message: "Cette action est définitive et supprimera toutes les données du projet.",
                onConfirm: () => deleteProject({dataDispatch, uiDispatch}, project.id),
            }
        });
    };

    const handleSaveProject = (projectData) => {
        saveProject({ dataDispatch, uiDispatch }, { ...projectData, id: editingProject?.id }, session.user);
        setIsModalOpen(false);
    };

    const handleNewConsolidatedView = () => {
        uiDispatch({ type: 'OPEN_CONSOLIDATED_VIEW_MODAL', payload: null });
    };

    const handleEditConsolidatedView = (view) => {
        uiDispatch({ type: 'OPEN_CONSOLIDATED_VIEW_MODAL', payload: view });
    };
    
    const handleArchiveConsolidatedView = (view) => {
        uiDispatch({
            type: 'OPEN_CONFIRMATION_MODAL',
            payload: {
                title: `Archiver "${view.name}" ?`,
                message: "Vous pourrez restaurer cette vue plus tard depuis les archives.",
                onConfirm: () => archiveConsolidatedView({dataDispatch, uiDispatch}, view.id),
                confirmText: 'Archiver',
                confirmColor: 'primary'
            }
        });
    };
    
    const handleDeleteConsolidatedView = (view) => {
        uiDispatch({
            type: 'OPEN_CONFIRMATION_MODAL',
            payload: {
                title: `Supprimer "${view.name}" ?`,
                message: "Cette action est définitive.",
                onConfirm: () => deleteConsolidatedView({dataDispatch, uiDispatch}, view.id),
            }
        });
    };

    if (totalProjects === 0) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <EmptyState
                    icon={Folder}
                    title="Bienvenue sur Trezo cash !"
                    message="Commencez par créer votre premier projet pour suivre votre trésorerie."
                    actionText="Créer mon premier projet"
                    onActionClick={handleNewProject}
                />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-full space-y-12">
            <div className="flex justify-between items-center">
                <p className="text-gray-600">Sélectionnez un projet pour commencer ou créez-en un nouveau.</p>
                <button
                    onClick={handleNewProject}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow"
                >
                    <Plus size={16} />
                    Nouveau projet
                </button>
            </div>
            
            {myTreasuryProjects.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Mes projets de trésorerie</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {myTreasuryProjects.map(project => (
                            <ProjectCard 
                                key={project.id} 
                                project={project}
                                onEdit={() => handleEditProject(project)}
                                onArchive={() => handleArchiveProject(project)}
                                onDelete={() => handleDeleteProject(project)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {sharedTreasuryProjects.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Projets de trésorerie partagés avec moi</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {sharedTreasuryProjects.map(project => (
                            <ProjectCard 
                                key={project.id} 
                                project={project}
                                onEdit={() => handleEditProject(project)}
                                onArchive={() => handleArchiveProject(project)}
                                onDelete={() => handleDeleteProject(project)}
                            />
                        ))}
                    </div>
                </section>
            )}
            
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-700">Mes vues consolidées</h2>
                    {myTreasuryProjects.length >= 2 && (
                        <button
                            onClick={handleNewConsolidatedView}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors"
                        >
                            <Layers size={16} />
                            Nouvelle vue consolidée
                        </button>
                    )}
                </div>
                {myConsolidatedViews.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {myConsolidatedViews.map(view => (
                            <ConsolidatedViewCard 
                                key={view.id} 
                                view={view}
                                onEdit={() => handleEditConsolidatedView(view)}
                                onArchive={() => handleArchiveConsolidatedView(view)}
                                onDelete={() => handleDeleteConsolidatedView(view)}
                            />
                        ))}
                    </div>
                ) : (
                    myTreasuryProjects.length >= 2 && (
                        <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed">
                            <p className="text-gray-600">Vous avez plusieurs projets. Créez une vue consolidée pour avoir une vision globale de vos finances.</p>
                        </div>
                    )
                )}
            </section>

            {myEventProjects.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Mes événements</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {myEventProjects.map(project => (
                            <ProjectCard 
                                key={project.id} 
                                project={project}
                                onEdit={() => handleEditProject(project)}
                                onArchive={() => handleArchiveProject(project)}
                                onDelete={() => handleDeleteProject(project)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {sharedEventProjects.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Événements partagés avec moi</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {sharedEventProjects.map(project => (
                            <ProjectCard 
                                key={project.id} 
                                project={project}
                                onEdit={() => handleEditProject(project)}
                                onArchive={() => handleArchiveProject(project)}
                                onDelete={() => handleDeleteProject(project)}
                            />
                        ))}
                    </div>
                </section>
            )}

            <ProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveProject}
                project={editingProject}
            />
        </div>
    );
};

export default MyProjectsPage;
