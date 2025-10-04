import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronsUpDown, Check, Plus, Layers } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';

const ProjectSwitcher = () => {
  const { dataState } = useData();
  const { uiState, uiDispatch } = useUI();
  const { projects, consolidatedViews, session } = dataState;
  const { activeProjectId } = uiState;
  
  const myProjects = useMemo(() => projects.filter(p => !p.isArchived && p.user_id === session.user.id), [projects, session.user.id]);
  const sharedProjects = useMemo(() => projects.filter(p => !p.isArchived && p.user_id !== session.user.id), [projects, session.user.id]);
  
  const isConsolidated = activeProjectId === 'consolidated';
  const isCustomConsolidated = activeProjectId?.startsWith('consolidated_view_');

  const activeProject = useMemo(() => {
    if (isConsolidated) {
      return { id: 'consolidated', name: 'Mes projets consolidé' };
    }
    if (isCustomConsolidated) {
      const viewId = activeProjectId.replace('consolidated_view_', '');
      const view = consolidatedViews.find(v => v.id === viewId);
      return view ? { id: activeProjectId, name: view.name } : { id: activeProjectId, name: 'Vue Inconnue' };
    }
    return projects.find(p => p.id === activeProjectId);
  }, [activeProjectId, projects, consolidatedViews, isConsolidated, isCustomConsolidated]);

  const [isListOpen, setIsListOpen] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (listRef.current && !listRef.current.contains(event.target)) setIsListOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectProject = (projectId) => {
    uiDispatch({ type: 'SET_ACTIVE_PROJECT', payload: projectId });
    setIsListOpen(false);
  };

  const handleStartOnboarding = () => {
    uiDispatch({ type: 'START_ONBOARDING' });
    setIsListOpen(false);
  };

  const handleOpenConsolidatedViewModal = () => {
    uiDispatch({ type: 'OPEN_CONSOLIDATED_VIEW_MODAL', payload: null });
    setIsListOpen(false);
  };
  
  const displayName = activeProject ? (activeProject.id === 'consolidated' ? `Mes projets consolidé` : activeProject.name) : 'Sélectionner un projet';

  return (
    <div className="relative w-full" ref={listRef}>
      <button onClick={() => setIsListOpen(!isListOpen)} className="flex items-center gap-2 p-1.5 rounded-md text-left text-gray-800 font-semibold hover:bg-gray-200 transition-colors focus:outline-none w-full">
        <Layers className="w-5 h-5 text-gray-500" />
        <span className="truncate flex-grow">{displayName}</span>
        <ChevronsUpDown className="w-4 h-4 text-gray-500 shrink-0" />
      </button>

      {isListOpen && (
        <div className="absolute z-30 mt-2 w-72 bg-white border rounded-lg shadow-lg">
          <div className="p-1 max-h-80 overflow-y-auto">
            <ul>
              {/* Consolidated views */}
              <li>
                <button onClick={() => handleSelectProject('consolidated')} className="flex items-center justify-between w-full px-3 py-2 text-sm text-left text-gray-700 rounded-md hover:bg-gray-100">
                  <span className="font-semibold flex items-center gap-2">
                    <Layers className="w-4 h-4 text-gray-500" />
                    Mes projets consolidé
                  </span>
                  {isConsolidated && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              </li>
              {consolidatedViews.map(view => (
                <li key={view.id}>
                  <button onClick={() => handleSelectProject(`consolidated_view_${view.id}`)} className="flex items-center justify-between w-full px-3 py-2 text-sm text-left text-gray-700 rounded-md hover:bg-gray-100">
                    <span className="flex items-center gap-2 truncate">
                      <Layers className="w-4 h-4 text-gray-500" />
                      <span className="truncate">{view.name}</span>
                    </span>
                    {activeProjectId === `consolidated_view_${view.id}` && <Check className="w-4 h-4 text-blue-600" />}
                  </button>
                </li>
              ))}
              
              {/* My Projects */}
              {(myProjects.length > 0) && <div className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase">Mes Projets</div>}
              {myProjects.map(project => {
                const initial = project.name ? project.name[0].toUpperCase() : '?';
                return (
                  <li key={project.id}>
                    <button onClick={() => handleSelectProject(project.id)} className="flex items-center justify-between w-full px-3 py-2 text-sm text-left text-gray-700 rounded-md hover:bg-gray-100">
                      <span className="flex items-center gap-2 truncate">
                        <div className="w-5 h-5 rounded-md bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">{initial}</div>
                        <span className="truncate">{project.name}</span>
                      </span>
                      {project.id === activeProjectId && <Check className="w-4 h-4 text-blue-600" />}
                    </button>
                  </li>
                );
              })}

              {/* Shared Projects */}
              {sharedProjects.length > 0 && <div className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase">Projets partagés avec moi</div>}
              {sharedProjects.map(project => {
                const initial = project.name ? project.name[0].toUpperCase() : '?';
                return (
                  <li key={project.id}>
                    <button onClick={() => handleSelectProject(project.id)} className="flex items-center justify-between w-full px-3 py-2 text-sm text-left text-gray-700 rounded-md hover:bg-gray-100">
                      <span className="flex items-center gap-2 truncate">
                        <div className="w-5 h-5 rounded-md bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">{initial}</div>
                        <span className="truncate">{project.name}</span>
                        <span className="px-1.5 py-0.5 text-xs font-semibold text-purple-700 bg-purple-100 rounded-full">
                            Partagé
                        </span>
                      </span>
                      {project.id === activeProjectId && <Check className="w-4 h-4 text-blue-600" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="border-t p-1">
            <button onClick={handleOpenConsolidatedViewModal} className="flex items-center w-full px-3 py-2 text-left text-sm text-gray-700 rounded-md hover:bg-gray-100">
              <Layers className="w-4 h-4 mr-2" />Créer une vue consolidée
            </button>
            <button onClick={handleStartOnboarding} className="flex items-center w-full px-3 py-2 text-left text-sm text-gray-700 rounded-md hover:bg-gray-100">
              <Plus className="w-4 h-4 mr-2" />Nouveau projet
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSwitcher;
