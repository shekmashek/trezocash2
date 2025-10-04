import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit, Archive, Trash2 } from 'lucide-react';
import { useUI } from '../context/UIContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import TemplateIcon from './TemplateIcon';

const colorClasses = {
  bg: {
    red: 'bg-red-100', orange: 'bg-orange-100', amber: 'bg-amber-100',
    yellow: 'bg-yellow-100', lime: 'bg-lime-100', green: 'bg-green-100',
    emerald: 'bg-emerald-100', teal: 'bg-teal-100', cyan: 'bg-cyan-100',
    sky: 'bg-sky-100', blue: 'bg-blue-100', indigo: 'bg-indigo-100',
    violet: 'bg-violet-100', purple: 'bg-purple-100', fuchsia: 'bg-fuchsia-100',
    pink: 'bg-pink-100', rose: 'bg-rose-100', gray: 'bg-gray-100'
  },
};

const OnboardingStatusBadge = ({ step }) => {
  const statusMap = {
    details: { text: 'Détails', color: 'bg-gray-200 text-gray-700' },
    budget: { text: 'Budget', color: 'bg-blue-100 text-blue-700' },
    accounts: { text: 'Comptes', color: 'bg-teal-100 text-teal-700' },
    trezo: { text: 'Tréso', color: 'bg-indigo-100 text-indigo-700' },
    flux: { text: 'Flux', color: 'bg-purple-100 text-purple-700' },
    echeancier: { text: 'Échéancier', color: 'bg-yellow-100 text-yellow-700' },
    analyse: { text: 'Analyse', color: 'bg-pink-100 text-pink-700' },
  };

  if (!step || step === 'completed') return null;

  const status = statusMap[step] || statusMap.details;

  return (
    <div className={`absolute top-3 right-3 px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
      Onboarding: {status.text}
    </div>
  );
};

const ProjectCard = ({ project, onEdit, onArchive, onDelete }) => {
    const { uiDispatch } = useUI();
    const navigate = useNavigate();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleCardClick = () => {
        uiDispatch({ type: 'SET_ACTIVE_PROJECT', payload: project.id });
        if (project.onboarding_step === 'completed') {
            navigate('/app/dashboard');
        } else {
            const onboardingOrder = ['budget', 'accounts', 'trezo', 'flux', 'echeancier', 'analyse'];
            const nextStep = project.onboarding_step || 'budget';
            
            let navPath = '/app/budget'; // default
            if (nextStep === 'accounts') navPath = '/app/comptes';
            else if (onboardingOrder.includes(nextStep)) navPath = `/app/${nextStep}`;

            navigate(navPath);
        }
    };

    const bgColor = colorClasses.bg[project.color] || 'bg-gray-100';

    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 flex flex-col justify-between hover:shadow-lg transition-shadow cursor-pointer relative">
            <div className="p-5" onClick={handleCardClick}>
                <OnboardingStatusBadge step={project.onboarding_step} />
                {project.isShared && (
                    <div className="absolute top-3 left-3 px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                        Partagé
                    </div>
                )}
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 ${bgColor} rounded-lg`}>
                        <TemplateIcon icon={project.icon || 'Briefcase'} color={project.color || 'blue'} className="w-6 h-6" />
                    </div>
                    {!project.isShared && (
                        <div className="relative" ref={menuRef}>
                            <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
                                <MoreVertical size={20} />
                            </button>
                            <AnimatePresence>
                                {isMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-10"
                                    >
                                        <ul className="p-1">
                                            <li><button onClick={(e) => { e.stopPropagation(); onEdit(); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm rounded-md text-gray-700 hover:bg-gray-100"><Edit size={14} /> Modifier</button></li>
                                            <li><button onClick={(e) => { e.stopPropagation(); onArchive(); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm rounded-md text-gray-700 hover:bg-gray-100"><Archive size={14} /> Archiver</button></li>
                                            <li><hr className="my-1" /></li>
                                            <li><button onClick={(e) => { e.stopPropagation(); onDelete(); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm rounded-md text-red-600 hover:bg-red-50"><Trash2 size={14} /> Supprimer</button></li>
                                        </ul>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
                <h3 className="font-bold text-gray-800 text-lg truncate mb-1" title={project.name}>{project.name}</h3>
                <p className="text-sm text-gray-600 h-10 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {project.description || "Aucune description"}
                </p>
            </div>
            <div className="px-5 pb-5 mt-auto" onClick={handleCardClick}>
                <div className="h-24"></div>
            </div>
        </div>
    );
};

export default ProjectCard;
