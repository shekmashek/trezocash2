import React, { useState, useMemo } from 'react';
import { Edit, Trash2, Plus, Save, X, FolderKanban, Folder, Filter, Lock, Banknote, Coins, Hash, BookOpen } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import EmptyState from '../components/EmptyState';
import { saveMainCategory, updateSubCategoryCriticality } from '../context/actions';
import CriticalityPicker from '../components/CriticalityPicker';

const CategoryManagementPage = () => {
  const { dataState, dataDispatch } = useData();
  const { uiDispatch } = useUI();
  const { categories, allEntries, allActuals, projects, session } = dataState;

  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [newSubCategory, setNewSubCategory] = useState({});
  const [editingMainCategory, setEditingMainCategory] = useState(null);
  const [newMainCategoryName, setNewMainCategoryName] = useState({ expense: '', revenue: '' });
  const [filterProject, setFilterProject] = useState('all');

  const handleStartEdit = (type, mainId, subId, name) => setEditingSubCategory({ type, mainId, subId, name });
  const handleCancelEdit = () => setEditingSubCategory(null);
  
  const handleSaveEdit = () => {
    if (editingSubCategory.name.trim()) {
      const mainCat = categories[editingSubCategory.type]?.find(mc => mc.id === editingSubCategory.mainId);
      const oldSubCat = mainCat?.subCategories.find(sc => sc.id === editingSubCategory.subId);
      
      dataDispatch({ 
        type: 'UPDATE_SUB_CATEGORY_SUCCESS', 
        payload: { 
          type: editingSubCategory.type, 
          mainCategoryId: editingSubCategory.mainId, 
          subCategoryId: editingSubCategory.subId, 
          newName: editingSubCategory.name.trim(),
          oldName: oldSubCat?.name 
        } 
      });
      handleCancelEdit();
    } else {
      uiDispatch({ type: 'ADD_TOAST', payload: { message: "Le nom ne peut pas être vide.", type: 'error' } });
    }
  };

  const handleAddSubCategory = (type, mainId) => {
    const name = newSubCategory[mainId]?.trim();
    if (name) {
      dataDispatch({ type: 'ADD_SUB_CATEGORY', payload: { type, mainCategoryId: mainId, subCategoryName: name } });
      setNewSubCategory(prev => ({ ...prev, [mainId]: '' }));
    } else {
      uiDispatch({ type: 'ADD_TOAST', payload: { message: "Veuillez entrer un nom pour la nouvelle sous-catégorie.", type: 'error' } });
    }
  };
  
  const getProjectsUsingSubCategory = (subCategoryName) => {
    const projectIds = new Set();
    const projectsToSearch = filterProject === 'all' ? projects.map(p => p.id) : [filterProject];

    projectsToSearch.forEach(projectId => {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      const entries = allEntries[projectId] || [];
      if (entries.some(e => e.category === subCategoryName)) {
        projectIds.add(projectId);
      }
      const actuals = allActuals[projectId] || [];
      if (actuals.some(a => a.category === subCategoryName)) {
        projectIds.add(projectId);
      }
    });

    return Array.from(projectIds).map(id => {
      const project = projects.find(p => p.id === id);
      return project ? project.name : null;
    }).filter(Boolean);
  };
  
  const isSubCategoryUsedAnywhere = (subCategoryName) => {
    const entries = Object.values(allEntries).flat();
    const actuals = Object.values(allActuals).flat();
    return entries.some(e => e.category === subCategoryName) || actuals.some(a => a.category === subCategoryName);
  };

  const handleDeleteSubCategory = (type, mainId, subId) => {
    const mainCat = categories[type]?.find(mc => mc.id === mainId);
    const subCat = mainCat?.subCategories.find(sc => sc.id === subId);
    if (!subCat) return;

    if (isSubCategoryUsedAnywhere(subCat.name)) {
      uiDispatch({ type: 'ADD_TOAST', payload: { message: `Suppression impossible: la catégorie "${subCat.name}" est utilisée.`, type: 'error' } });
      return;
    }

    uiDispatch({
      type: 'OPEN_CONFIRMATION_MODAL',
      payload: {
        title: `Supprimer "${subCat.name}" ?`,
        message: 'Cette action est irréversible.',
        onConfirm: () => dataDispatch({ type: 'DELETE_SUB_CATEGORY', payload: { type, mainId, subId } }),
      }
    });
  };

  const handleAddMainCategory = (type) => {
    const name = newMainCategoryName[type].trim();
    if (name) {
      saveMainCategory({dataDispatch, uiDispatch}, { type, name, user: session.user });
      setNewMainCategoryName(prev => ({ ...prev, [type]: '' }));
    } else {
      uiDispatch({ type: 'ADD_TOAST', payload: { message: "Le nom ne peut pas être vide.", type: 'error' } });
    }
  };

  const handleStartEditMain = (type, mainCat) => {
    setEditingMainCategory({ type, id: mainCat.id, name: mainCat.name });
  };

  const handleCancelEditMain = () => {
    setEditingMainCategory(null);
  };

  const handleSaveEditMain = () => {
    if (editingMainCategory.name.trim()) {
      dataDispatch({ 
        type: 'UPDATE_MAIN_CATEGORY_SUCCESS', 
        payload: { 
          type: editingMainCategory.type, 
          mainCategoryId: editingMainCategory.id, 
          newName: editingMainCategory.name.trim()
        } 
      });
      handleCancelEditMain();
    } else {
      uiDispatch({ type: 'ADD_TOAST', payload: { message: "Le nom ne peut pas être vide.", type: 'error' } });
    }
  };

  const isMainCategoryUsed = (mainCat) => {
    return mainCat.subCategories.some(sc => isSubCategoryUsedAnywhere(sc.name));
  };

  const handleDeleteMainCategory = (type, mainCat) => {
    if (mainCat.isFixed) {
      uiDispatch({ type: 'ADD_TOAST', payload: { message: "Impossible de supprimer une catégorie principale fixe.", type: 'error' } });
      return;
    }
    if (isMainCategoryUsed(mainCat)) {
      uiDispatch({ type: 'ADD_TOAST', payload: { message: `Suppression impossible: la catégorie "${mainCat.name}" contient des sous-catégories utilisées.`, type: 'error' } });
      return;
    }
    uiDispatch({
      type: 'OPEN_CONFIRMATION_MODAL',
      payload: {
        title: `Supprimer la catégorie "${mainCat.name}" ?`,
        message: 'Toutes ses sous-catégories (si existentes) seront également supprimées. Cette action est irréversible.',
        onConfirm: () => dataDispatch({ type: 'DELETE_MAIN_CATEGORY', payload: { type, mainCategoryId: mainCat.id } }),
      }
    });
  };

  const handleCriticalityChange = (subCategoryId, newCriticality, type, parentId) => {
    updateSubCategoryCriticality({ dataDispatch, uiDispatch }, { subCategoryId, newCriticality, type, parentId });
  };

  const renderCategorySection = (type, title) => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
      {categories[type].map(mainCat => {
        const isSavings = mainCat.name === 'Épargne';
        const isBorrowing = mainCat.name === 'Emprunt ( Remboursement d\')';
        const isLending = mainCat.name === 'Prêts (Remboursement de)';
        const isTaxes = mainCat.name === 'Impôts & Contributions';
        const isFormation = mainCat.name === 'Formation';

        let specialClass = 'bg-white';
        if (isSavings) specialClass = 'bg-teal-50 border-teal-200';
        if (isBorrowing) specialClass = 'bg-red-50 border-red-200';
        if (isLending) specialClass = 'bg-green-50 border-green-200';
        if (isTaxes) specialClass = 'bg-amber-50 border-amber-200';
        if (isFormation) specialClass = 'bg-sky-50 border-sky-200';

        let textColor = 'text-gray-700';
        if (isSavings) textColor = 'text-teal-800';
        if (isBorrowing) textColor = 'text-red-800';
        if (isLending) textColor = 'text-green-800';
        if (isTaxes) textColor = 'text-amber-800';
        if (isFormation) textColor = 'text-sky-800';

        let icon = null;
        if (isSavings) icon = <Lock className="w-4 h-4 text-teal-600" />;
        if (isBorrowing) icon = <Banknote className="w-4 h-4 text-red-600" />;
        if (isLending) icon = <Coins className="w-4 h-4 text-green-600" />;
        if (isTaxes) icon = <Hash className="w-4 h-4 text-amber-600" />;
        if (isFormation) icon = <BookOpen className="w-4 h-4 text-sky-600" />;

        return (
          <div key={mainCat.id} className={`p-3 rounded-lg border ${specialClass}`}>
            <div className="flex justify-between items-center group mb-2 pb-2 border-b">
              {editingMainCategory?.id === mainCat.id ? (
                <input type="text" value={editingMainCategory.name} onChange={(e) => setEditingMainCategory(prev => ({ ...prev, name: e.target.value }))} className={`font-bold text-md px-2 py-1 border rounded-md w-full ${textColor}`} autoFocus />
              ) : (
                <h4 className={`font-bold text-md flex items-center gap-2 ${textColor}`}>
                  {mainCat.name}
                  {icon}
                </h4>
              )}
              <div className="flex items-center gap-2 pl-4">
                {editingMainCategory?.id === mainCat.id ? (
                  <><button onClick={handleSaveEditMain} className="p-1 text-green-600 hover:text-green-800"><Save className="w-4 h-4" /></button><button onClick={handleCancelEditMain} className="p-1 text-gray-500 hover:text-gray-700"><X className="w-4 h-4" /></button></>
                ) : (
                  !mainCat.isFixed && (
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleStartEditMain(type, mainCat)} className="p-1 text-blue-600 hover:text-blue-800"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteMainCategory(type, mainCat)} className="p-1 text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )
                )}
              </div>
            </div>
            <ul className="mt-2 space-y-1">
              {mainCat.subCategories.map(subCat => {
                const usedInProjects = getProjectsUsingSubCategory(subCat.name);
                const isUsed = usedInProjects.length > 0;
                const isUsedAnywhereCheck = isSubCategoryUsedAnywhere(subCat.name);
                return (
                  <li key={subCat.id} className="group flex items-start justify-between p-1.5 rounded-md hover:bg-gray-50">
                    <div className="flex-grow flex items-start gap-3 flex-wrap">
                      {editingSubCategory?.subId === subCat.id ? (
                        <input type="text" value={editingSubCategory.name} onChange={(e) => setEditingSubCategory(prev => ({ ...prev, name: e.target.value }))} className="px-2 py-1 border rounded-md text-sm" autoFocus/>
                      ) : (
                        <span className="text-sm text-gray-600 mt-1 flex-shrink-0">{subCat.name}</span>
                      )}
                      {isUsed && (
                        <div className="flex items-center gap-2 flex-wrap">
                            {usedInProjects.map(projectName => (
                                <span key={projectName} className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full border">
                                    <Folder className="w-3 h-3" />
                                    {projectName}
                                </span>
                            ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      {type === 'expense' && !subCat.isFixed && (
                          <CriticalityPicker
                              value={subCat.criticality || 'essential'}
                              onSelect={(newCrit) => handleCriticalityChange(subCat.id, newCrit, type, mainCat.id)}
                          />
                      )}
                      {editingSubCategory?.subId === subCat.id ? (
                        <>
                          <button onClick={handleSaveEdit} className="p-1 text-green-600 hover:text-green-800"><Save className="w-4 h-4" /></button>
                          <button onClick={handleCancelEdit} className="p-1 text-gray-500 hover:text-gray-700"><X className="w-4 h-4" /></button>
                        </>
                      ) : (
                        !subCat.isFixed && (
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleStartEdit(type, mainCat.id, subCat.id, subCat.name)} className="p-1 text-blue-600 hover:text-blue-800"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteSubCategory(type, mainCat.id, subCat.id)} className="p-1 text-red-600 hover:text-red-800 disabled:text-gray-300 disabled:cursor-not-allowed" title={isUsedAnywhereCheck ? "Suppression impossible: catégorie utilisée" : "Supprimer"} disabled={isUsedAnywhereCheck}><Trash2 className="w-4 h-4" /></button>
                          </div>
                        )
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 pt-3 border-t">
              <div className="flex gap-2">
                <input type="text" value={newSubCategory[mainCat.id] || ''} onChange={(e) => setNewSubCategory(prev => ({ ...prev, [mainCat.id]: e.target.value }))} placeholder="Nouvelle sous-catégorie" className="flex-grow px-3 py-1.5 border rounded-lg text-sm" onKeyPress={(e) => e.key === 'Enter' && handleAddSubCategory(type, mainCat.id)} />
                <button onClick={() => handleAddSubCategory(type, mainCat.id)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1 text-xs"><Plus className="w-4 h-4" /> Ajouter</button>
              </div>
            </div>
          </div>
        )
      })}
      <div className="mt-4 pt-4 border-t border-dashed">
          <h4 className="font-semibold text-gray-700 mb-2 text-md">Ajouter une catégorie principale</h4>
          <div className="flex gap-2">
              <input type="text" value={newMainCategoryName[type]} onChange={(e) => setNewMainCategoryName(prev => ({...prev, [type]: e.target.value}))} placeholder={`Nouvelle catégorie de ${title.toLowerCase()}`} className="flex-grow px-3 py-2 border rounded-lg text-sm" onKeyPress={(e) => e.key === 'Enter' && handleAddMainCategory(type)} />
              <button onClick={() => handleAddMainCategory(type)} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-sm"><Plus className="w-4 h-4" /> Ajouter</button>
          </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <label htmlFor="project-filter" className="text-sm font-medium text-gray-700">Afficher l'utilisation dans :</label>
                <select id="project-filter" value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm bg-white shadow-sm">
                    <option value="all">Tous les projets</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
        </div>
        <div className="grid grid-cols-1 gap-8 items-start">
            {renderCategorySection('revenue', 'Entrées')}
            {renderCategorySection('expense', 'Sorties')}
        </div>
    </div>
  );
};

export default CategoryManagementPage;
