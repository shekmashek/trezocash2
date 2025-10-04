import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { supabase } from '../utils/supabase';
import { Save, User, Shield, CreditCard, FileText, HelpCircle, LogOut, Cog, Users, FolderKanban, Wallet, Archive, Globe, LayoutTemplate, Plus, Trash2, FolderCog, Lock, Banknote, Coins, Hash, BookOpen, Receipt, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import SubscriptionBadge from '../components/SubscriptionBadge';
import ProjectCollaborators from './ProjectCollaborators';
import FlagIcon from './FlagIcon';
import AmbassadorIcon from './AmbassadorIcon';

const SettingsLink = ({ item, onClick }) => {
  const Icon = item.icon;
  return (
    <li title={item.label}>
      <button 
        onClick={onClick} 
        disabled={item.disabled}
        className={`flex items-center w-full h-10 px-4 rounded-lg text-sm font-medium transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <Icon className={`w-5 h-5 shrink-0 ${item.color}`} />
        <span className={`ml-4`}>
          {item.label}
        </span>
      </button>
    </li>
  );
};

const SubHeader = () => {
  const { dataState } = useData();
  const { uiState, uiDispatch } = useUI();
  const { profile, session, projects, consolidatedViews } = dataState;
  const { activeProjectId } = uiState;
  const navigate = useNavigate();
  const location = useLocation();

  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsPopoverRef = useRef(null);

  const activeProjectOrView = useMemo(() => {
    if (!activeProjectId) return null;
    if (activeProjectId === 'consolidated') {
        return { id: 'consolidated', name: 'Mes projets consolidé', type: 'consolidated' };
    }
    if (activeProjectId.startsWith('consolidated_view_')) {
        const viewId = activeProjectId.replace('consolidated_view_', '');
        const view = consolidatedViews.find(v => v.id === viewId);
        return view ? { ...view, type: 'custom_consolidated' } : null;
    }
    return projects.find(p => p.id === activeProjectId);
  }, [activeProjectId, projects, consolidatedViews]);
  
  const pageTitle = useMemo(() => {
    if (location.pathname.startsWith('/app/projets')) {
        const name = profile?.fullName?.split(' ')[0] || 'Utilisateur';
        return `Bonjour ${name},`;
    }
    if (!activeProjectOrView) {
        return null;
    }

    const projectName = activeProjectOrView.name;
    let prefix = "Tableau de bord";
    let projectTypeLabel = "du projet";

    if (activeProjectOrView.type === 'consolidated') {
        if (location.pathname.startsWith('/app/budget')) prefix = "Budget prévisionnel";
        else if (location.pathname.startsWith('/app/trezo')) prefix = "Tableau de trésorerie";
        else if (location.pathname.startsWith('/app/flux')) prefix = "Flux de trésorerie";
        else prefix = "Tableau de bord";
        return `${prefix} de tous les projets`;
    }
    if (activeProjectOrView.type === 'custom_consolidated') {
        if (location.pathname.startsWith('/app/budget')) prefix = "Budget prévisionnel";
        else if (location.pathname.startsWith('/app/trezo')) prefix = "Tableau de trésorerie";
        else if (location.pathname.startsWith('/app/flux')) prefix = "Flux de trésorerie";
        else prefix = "Tableau de bord";
        return `${prefix} de vue consolidée : "${projectName}"`;
    }
    if (activeProjectOrView.type === 'event') {
        projectTypeLabel = "de l'événement";
    }

    if (location.pathname.startsWith('/app/budget')) {
        prefix = "Budget prévisionnel";
    } else if (location.pathname.startsWith('/app/trezo')) {
        prefix = "Tableau de trésorerie";
    } else if (location.pathname.startsWith('/app/flux')) {
        prefix = "Flux de trésorerie";
    }
    
    return `${prefix} ${projectTypeLabel} : "${projectName}"`;
  }, [activeProjectOrView, location.pathname, profile]);

  const canShareProject = useMemo(() => {
    if (!activeProjectOrView || activeProjectId === 'consolidated' || activeProjectId.startsWith('consolidated_view_')) {
        return false;
    }
    return activeProjectOrView.user_id === session?.user?.id;
  }, [activeProjectOrView, activeProjectId, session]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target)) setIsAvatarMenuOpen(false);
      if (settingsPopoverRef.current && !settingsPopoverRef.current.contains(event.target)) setIsSettingsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleNavigate = (path) => {
    navigate(path);
    setIsSettingsOpen(false);
    setIsAvatarMenuOpen(false);
  };

  const menuItems = [
    { title: 'Mon profil', icon: User, path: '/app/profil' },
    { title: 'Programme Ambassadeur', icon: AmbassadorIcon, path: '/app/parrainage' },
    { title: 'Mot de passe et sécurité', icon: Shield, path: '/app/securite' },
    { title: 'Mon abonnement', icon: CreditCard, path: '/app/abonnement' },
    { title: 'Factures', icon: FileText, path: '/app/factures' },
    { title: 'Supprimer mon compte', icon: Trash2, path: '/app/delete-account', isDestructive: true },
    { title: 'Centre d\'aide', icon: HelpCircle, path: '/app/aide' },
  ];

  const settingsItems = [
    { id: '/app/parametres-projet', label: 'Paramètres du Projet', icon: FolderCog, color: 'text-blue-500' },
    { id: '/app/collaborateurs', label: 'Collaborateurs', icon: Users, color: 'text-purple-500' },
    { id: '/app/journal-budget', label: 'Journal du Budget', icon: BookOpen, color: 'text-yellow-500' },
    { id: '/app/journal-paiements', label: 'Journal des Paiements', icon: Receipt, color: 'text-cyan-500' },
    { id: '/app/emprunts-prets', label: 'Emprunts & Prêts', icon: Banknote, color: 'text-green-500' },
    { id: '/app/provisions', label: 'Suivi des Provisions', icon: Lock, color: 'text-orange-500' },
    { id: '/app/tiers', label: 'Tiers', icon: Users, color: 'text-pink-500' },
    { id: '/app/categories', label: 'Catégories', icon: FolderKanban, color: 'text-orange-500' },
    { id: '/app/templates', label: 'Mes Modèles', icon: LayoutTemplate, color: 'text-indigo-500' },
    { id: '/app/archives', label: 'Archives', icon: Archive, color: 'text-slate-500' },
  ];

  const handleSettingsItemClick = (itemId) => {
    if (itemId.startsWith('/app/')) {
        handleNavigate(itemId);
    } else {
      uiDispatch({ type: 'SET_ACTIVE_SETTINGS_DRAWER', payload: itemId });
    }
    setIsSettingsOpen(false);
  };
  
  const subscriptionDetails = useMemo(() => {
    if (!profile) return null;
    const status = profile.subscriptionStatus;
    if (status === 'lifetime') return 'Statut : Accès à Vie';
    if (status === 'active') return 'Statut : Abonnement Pro';
    if (status === 'trialing') return null;
    return 'Statut : Essai terminé';
  }, [profile]);
  
  return (
    <>
      <div className="sticky top-0 z-30 bg-gray-100 border-b border-gray-200">
        <div className="w-full px-6">
          <div className="py-2 grid grid-cols-[1fr_auto] w-full items-center gap-6">
            <div>
              {pageTitle && (
                <h1 className="text-lg font-semibold text-gray-800 truncate">
                  {pageTitle}
                </h1>
              )}
            </div>

            <div className="flex items-center justify-end gap-4">
                <ProjectCollaborators />
                {canShareProject && (
                  <button
                    onClick={() => navigate('/app/collaborateurs')}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                    title="Partager et gérer les collaborateurs"
                  >
                    <Share2 size={20} />
                  </button>
                )}
                <button 
                    onClick={() => navigate('/app/parrainage')}
                    className="p-2 text-purple-600 hover:bg-purple-100 rounded-full transition-colors" 
                    title="Programme Ambassadeur"
                >
                    <AmbassadorIcon size={20} />
                </button>
                <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-full transition-colors" title="Changer de langue">
                        <FlagIcon code="FR" className="w-5 h-5 rounded-sm" />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative" ref={settingsPopoverRef}>
                        <button
                            onClick={() => setIsSettingsOpen(p => !p)}
                            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                            title="Paramètres avancés"
                        >
                            <Cog className="w-5 h-5" />
                        </button>
                        <AnimatePresence>
                            {isSettingsOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                    className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border z-20"
                                >
                                    <div className="p-2">
                                      <ul className="space-y-1">
                                        {settingsItems.map(item => (
                                          <SettingsLink 
                                            key={item.id} 
                                            item={item} 
                                            onClick={() => handleSettingsItemClick(item.id)} 
                                          />
                                        ))}
                                      </ul>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <div className="flex items-center gap-2">
                      <SubscriptionBadge />
                      <div className="relative" ref={avatarMenuRef}>
                          <button 
                              onClick={() => setIsAvatarMenuOpen(p => !p)}
                              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                              title="Profil utilisateur"
                          >
                              <User className="w-5 h-5" />
                          </button>
                          <AnimatePresence>
                              {isAvatarMenuOpen && (
                                  <motion.div
                                      initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                      className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border z-20"
                                  >
                                      <div className="px-4 py-3 border-b">
                                          <p className="text-sm font-semibold text-gray-800">{profile?.fullName || 'Utilisateur'}</p>
                                          <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                                          {subscriptionDetails && <p className="text-xs font-semibold text-blue-600 mt-1">{subscriptionDetails}</p>}
                                      </div>
                                      <div className="p-1">
                                          {menuItems.map((item) => (
                                              <button 
                                                  key={item.title}
                                                  onClick={() => handleNavigate(item.path)}
                                                  className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-md ${
                                                      item.isDestructive 
                                                      ? 'text-red-600 hover:bg-red-50' 
                                                      : 'text-gray-700 hover:bg-gray-100'
                                                  }`}
                                              >
                                                  <item.icon className="w-4 h-4" />
                                                  <span>{item.title}</span>
                                              </button>
                                          ))}
                                          <div className="h-px bg-gray-200 my-1 mx-1"></div>
                                          <button 
                                              onClick={handleLogout}
                                              className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50"
                                          >
                                              <LogOut className="w-4 h-4" />
                                              <span>Se déconnecter</span>
                                          </button>
                                      </div>
                                  </motion.div>
                              )}
                          </AnimatePresence>
                      </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SubHeader;
