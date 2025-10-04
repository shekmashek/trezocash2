import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Folder, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { commonCurrencies, currencySymbols } from '../utils/currencies';
import IconPicker from './IconPicker';

const ProgressBar = ({ current, total }) => (
  <div className="flex items-center gap-2">
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < current ? 'bg-blue-500' : 'bg-gray-200'}`} />
    ))}
  </div>
);

const ProjectModal = ({ isOpen, onClose, onSave, project }) => {
  const isEditing = !!project;
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const initialFormData = useMemo(() => ({
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isEndDateIndefinite: true,
    currencyCode: 'EUR',
    currencySymbol: '€',
    isCustomCurrency: false,
    icon: 'Briefcase',
    color: 'blue',
  }), []);

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        setFormData({
          name: project.name || '',
          description: project.description || '',
          startDate: project.startDate || new Date().toISOString().split('T')[0],
          endDate: project.endDate || '',
          isEndDateIndefinite: !project.endDate,
          currencyCode: project.currency || 'EUR',
          currencySymbol: project.currency_symbol || currencySymbols[project.currency] || project.currency,
          isCustomCurrency: !commonCurrencies.some(c => c.code === project.currency),
          icon: project.icon || 'Briefcase',
          color: project.color || 'blue',
        });
      } else {
        setStep(0);
        setFormData(initialFormData);
      }
    }
  }, [isOpen, project, isEditing, initialFormData]);

  const handleNext = () => {
    if (step === 0 && !formData.name.trim()) {
      // Basic validation
      return;
    }
    setDirection(1);
    setStep(s => s + 1);
  };

  const handleBack = () => {
    setDirection(-1);
    setStep(s => s - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };
  
  const handleCurrencyCodeChange = (code) => {
    if (code === 'custom') {
      setFormData(f => ({ ...f, isCustomCurrency: true }));
    } else {
      setFormData(f => ({
        ...f,
        isCustomCurrency: false,
        currencyCode: code,
        currencySymbol: currencySymbols[code] || code,
      }));
    }
  };

  const variants = {
    enter: (direction) => ({ x: direction > 0 ? 30 : -30, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction) => ({ zIndex: 0, x: direction < 0 ? 30 : -30, opacity: 0 }),
  };

  const renderStepContent = () => {
    return (
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
        >
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">Nom et apparence du projet</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Ex: Mon entreprise, Budget personnel..." required autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optionnel)</label>
                <textarea value={formData.description} onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows="2" placeholder="Un bref résumé de l'objectif de ce projet..." />
              </div>
              <div className="mt-4">
                <IconPicker 
                    value={{ icon: formData.icon, color: formData.color }}
                    onChange={(value) => setFormData(f => ({ ...f, ...value }))}
                />
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">Durée du projet</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                  <input type="date" value={formData.startDate} onChange={(e) => setFormData(f => ({ ...f, startDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                  <input type="date" value={formData.endDate} onChange={(e) => setFormData(f => ({ ...f, endDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100" disabled={formData.isEndDateIndefinite} min={formData.startDate} />
                </div>
              </div>
              <div className="flex items-center justify-end">
                <input type="checkbox" id="indefinite-date" checked={formData.isEndDateIndefinite} onChange={(e) => setFormData(f => ({ ...f, isEndDateIndefinite: e.target.checked, endDate: e.target.checked ? '' : f.endDate }))} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <label htmlFor="indefinite-date" className="ml-2 block text-sm text-gray-900">Durée indéterminée</label>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">Devise principale</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Devise du projet</label>
                <div className="flex items-center gap-4">
                  <select value={formData.isCustomCurrency ? 'custom' : formData.currencyCode} onChange={(e) => handleCurrencyCodeChange(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                    {commonCurrencies.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                    <option value="custom">Autre (Personnalisé)</option>
                  </select>
                  <div className="w-20 h-10 flex items-center justify-center bg-gray-100 rounded-lg text-lg font-bold text-gray-700">
                    {formData.currencySymbol}
                  </div>
                </div>
                {formData.isCustomCurrency && (
                  <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div>
                      <label className="text-xs font-medium text-gray-600">Code ISO (3 lettres)</label>
                      <input type="text" value={formData.currencyCode === 'custom' ? '' : formData.currencyCode} onChange={(e) => setFormData(f => ({ ...f, currencyCode: e.target.value }))} placeholder="MGA" className="w-full px-2 py-1 border rounded-md" maxLength="3" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">Symbole</label>
                      <input type="text" value={formData.currencySymbol} onChange={(e) => setFormData(f => ({ ...f, currencySymbol: e.target.value }))} placeholder="Ar" className="w-full px-2 py-1 border rounded-md" maxLength="5" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Folder className="w-5 h-5 text-blue-600" />
            {isEditing ? 'Modifier le projet' : 'Nouveau Projet'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {isEditing ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom du projet *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (optionnel)</label>
              <textarea value={formData.description} onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows="3" />
            </div>
            <div className="mt-4">
                <IconPicker 
                    value={{ icon: formData.icon, color: formData.color }}
                    onChange={(value) => setFormData(f => ({ ...f, ...value }))}
                />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Annuler</button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"><Save className="w-4 h-4" /> Enregistrer</button>
            </div>
          </form>
        ) : (
          <div className="p-6">
            <div className="mb-4">
              <ProgressBar current={step + 1} total={3} />
            </div>
            <div className="min-h-[420px]">
              {renderStepContent()}
            </div>
            <div className="flex justify-between items-center pt-4 border-t">
              <button type="button" onClick={handleBack} disabled={step === 0} className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">
                <ArrowLeft className="w-4 h-4" /> Précédent
              </button>
              {step < 2 ? (
                <button type="button" onClick={handleNext} disabled={step === 0 && !formData.name.trim()} className="flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold disabled:bg-gray-400">
                  Suivant <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                  <Save className="w-4 h-4" /> Créer le Projet
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectModal;
