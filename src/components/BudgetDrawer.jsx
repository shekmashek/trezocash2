import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, User, Repeat, Settings, ChevronDown, Minus, Maximize2, Lock } from 'lucide-react';
import { formatCurrency } from '../utils/formatting';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { motion, AnimatePresence } from 'framer-motion';
import { commonCurrencies, currencySymbols } from '../utils/currencies';

const BudgetDrawer = ({ isOpen, isMinimized, onClose, onToggleMinimize, data }) => {
  const { entry, onSave, onDelete } = data || {};
  const { dataState } = useData();
  const { uiState } = useUI();
  const { categories, tiers, settings, allCashAccounts, projects, exchangeRates } = dataState;
  const { activeProjectId } = uiState;
  const isConsolidated = activeProjectId === 'consolidated';

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const activeProject = useMemo(() => projects.find(p => p.id === activeProjectId), [projects, activeProjectId]);

  const currencySettingsForProject = useMemo(() => ({
    ...settings,
    currency: activeProject?.currency || settings.currency,
    displayUnit: activeProject?.display_unit || settings.displayUnit,
    decimalPlaces: activeProject?.decimal_places ?? settings.decimalPlaces,
  }), [activeProject, settings]);

  const projectVatRates = useMemo(() => {
    if (isConsolidated) return [];
    return (dataState.vatRates[activeProjectId] || []).sort((a, b) => b.is_default - a.is_default);
  }, [dataState.vatRates, activeProjectId, isConsolidated]);

  const usedCurrencies = useMemo(() => {
    if (!dataState.allEntries || !activeProjectId) return [];
    const entries = dataState.allEntries[activeProjectId] || [];
    const currencies = new Set(entries.map(e => e.currency).filter(Boolean));
    return Array.from(currencies);
  }, [dataState.allEntries, activeProjectId]);

  const currencyOptions = useMemo(() => {
      const projectCurrency = activeProject?.currency || settings.currency;
      const baseCurrencyCodes = commonCurrencies.map(c => c.code);
      const allUsed = new Set([projectCurrency, ...baseCurrencyCodes, ...usedCurrencies]);
      return Array.from(allUsed).sort();
  }, [activeProject, settings.currency, usedCurrencies]);

  const getInitialFormData = () => ({
    type: entry?.type || 'revenu',
    category: entry?.category || '',
    frequency: entry?.frequency || 'mensuel',
    amount: '',
    currency: activeProject?.currency || settings.currency,
    amount_type: 'ttc',
    vat_rate_id: null,
    date: new Date().toISOString().split('T')[0],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isEndDateIndefinite: true,
    supplier: '',
    description: '',
    isProvision: false,
    payments: [{ date: new Date().toISOString().split('T')[0], amount: '' }],
    numProvisions: '',
    provisionDetails: {
        finalPaymentDate: '',
        provisionAccountId: ''
    }
  });

  const [formData, setFormData] = useState(getInitialFormData());

  const frequencyOptions = [
    { value: 'ponctuel', label: 'Ponctuel', icon: Calendar },
    { value: 'journalier', label: 'Journalier', icon: Repeat },
    { value: 'hebdomadaire', label: 'Hebdomadaire', icon: Repeat },
    { value: 'mensuel', label: 'Mensuel', icon: Repeat },
    { value: 'bimestriel', label: 'Bimestriel', icon: Repeat },
    { value: 'trimestriel', label: 'Trimestriel', icon: Repeat },
    { value: 'semestriel', label: 'Semestriel', icon: Repeat },
    { value: 'annuel', label: 'Annuel', icon: Repeat },
    { value: 'irregulier', label: 'Paiements Irréguliers', icon: Repeat },
  ];
  
  const showProvisionButton = formData.type === 'depense' && ['ponctuel', 'bimestriel', 'trimestriel', 'semestriel', 'annuel'].includes(formData.frequency);

  useEffect(() => {
    if (isOpen) {
      const projectCurrency = activeProject?.currency || settings.currency;
      const defaultVatRateId = projectVatRates.find(r => r.is_default)?.id || null;
      if (entry) {
        const provisionMap = { annuel: 12, semestriel: 6, trimestriel: 3, bimestriel: 2 };
        const num = provisionMap[entry.frequency];

        setFormData({
          ...getInitialFormData(),
          ...entry,
          amount: entry.original_amount ?? entry.amount,
          currency: entry.currency || projectCurrency,
          amount_type: entry.amount_type || 'ttc',
          vat_rate_id: entry.vat_rate_id || defaultVatRateId,
          type: entry.type || 'revenu',
          isProvision: entry.isProvision || false,
          numProvisions: entry.isProvision && num ? num : (entry.numProvisions || ''),
          payments: entry.payments && entry.payments.length > 0
            ? entry.payments.map(p => ({ date: p.date || '', amount: p.amount || '' }))
            : [{ date: new Date().toISOString().split('T')[0], amount: '' }],
          isEndDateIndefinite: !entry.endDate,
        });
      } else {
        setFormData(prev => ({...getInitialFormData(), currency: projectCurrency, vat_rate_id: defaultVatRateId}));
      }
    }
  }, [isOpen, entry, projectVatRates, activeProject, settings.currency]);

  const { htAmount, ttcAmount } = useMemo(() => {
    const amount = parseFloat(formData.amount);
    if (isNaN(amount)) return { htAmount: 0, ttcAmount: 0, vatAmount: 0 };

    const rateInfo = projectVatRates.find(r => r.id === formData.vat_rate_id);
    const rate = rateInfo ? parseFloat(rateInfo.rate) / 100 : 0;

    if (formData.amount_type === 'ht') {
        const ht = amount;
        const ttc = ht * (1 + rate);
        return { htAmount: ht, ttcAmount: ttc };
    } else { // 'ttc'
        const ttc = amount;
        const ht = ttc / (1 + rate);
        return { htAmount: ht, ttcAmount: ttc };
    }
  }, [formData.amount, formData.amount_type, formData.vat_rate_id, projectVatRates]);

  const convertedAmount = useMemo(() => {
    const projectCurrency = activeProject?.currency || settings.currency;
    const transactionCurrency = formData.currency || projectCurrency;
    const originalAmount = ttcAmount;

    if (isNaN(originalAmount) || transactionCurrency === projectCurrency || !exchangeRates) return null;

    const baseRate = exchangeRates[projectCurrency];
    const transactionRate = exchangeRates[transactionCurrency];

    if (baseRate && transactionRate) {
        const amountInEur = originalAmount / transactionRate;
        return amountInEur * baseRate;
    }
    
    return null;
  }, [ttcAmount, formData.currency, activeProject, settings.currency, exchangeRates]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.category || !formData.supplier) {
      uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Veuillez remplir tous les champs obligatoires.', type: 'error' } });
      return;
    }
    if (onSave) {
        onSave({ ...formData, ht_amount: htAmount, ttc_amount: ttcAmount });
    }
  };

  const handleDeleteClick = () => {
    if (onDelete) onDelete();
  };

  const getAvailableCategories = () => formData.type === 'revenu' ? categories.revenue : categories.expense;
  const getAvailableTiers = () => tiers.filter(t => t.type === (formData.type === 'revenu' ? 'client' : 'fournisseur'));

  if (!isOpen) return null;

  return (
    <motion.div
        className="fixed bottom-0 right-8 w-[480px] bg-white rounded-t-lg shadow-2xl border-x border-t z-50 flex flex-col"
        variants={{
            open: { height: "75vh", opacity: 1 },
            minimized: { height: "52px", opacity: 1 },
        }}
        initial="minimized"
        animate={isMinimized ? "minimized" : "open"}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
    >
        <div className="flex items-center justify-between p-3 border-b bg-gray-50 rounded-t-lg cursor-pointer flex-shrink-0" onClick={onToggleMinimize}>
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${formData.type === 'revenu' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <h2 className="text-md font-semibold text-gray-800">
                    {entry && entry.id ? "Modifier l'écriture" : 'Nouvelle écriture'}
                </h2>
            </div>
            <div className="flex items-center gap-2">
                <button type="button" onClick={(e) => { e.stopPropagation(); onToggleMinimize(); }} className="p-1 text-gray-500 hover:bg-gray-200 rounded-full">
                    {isMinimized ? <Maximize2 size={16} /> : <Minus size={16} />}
                </button>
                <button type="button" onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-1 text-gray-500 hover:bg-gray-200 rounded-full">
                    <X size={16} />
                </button>
            </div>
        </div>

        <AnimatePresence>
            {!isMinimized && (
                <motion.div 
                    className="flex-grow flex flex-col overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { delay: 0.1 } }}
                    exit={{ opacity: 0 }}
                >
                    <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-grow">
                        <div className="flex-grow">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, type: 'revenu', category: '', isProvision: false }))} className={`flex-1 py-1.5 rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${formData.type === 'revenu' ? 'bg-white shadow text-green-600' : 'text-gray-600'}`}>Entrée</button>
                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, type: 'depense', category: '' }))} className={`flex-1 py-1.5 rounded-md text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${formData.type === 'depense' ? 'bg-white shadow text-red-600' : 'text-gray-600'}`}>Sortie</button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                            <select value={formData.category || ''} onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm" required>
                                <option value="">Sélectionner</option>
                                {getAvailableCategories().map(mainCat => (<optgroup key={mainCat.id} label={mainCat.name}>{mainCat.subCategories.map(subCat => (<option key={subCat.id} value={subCat.name}>{subCat.name}</option>))}</optgroup>))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tiers *</label>
                            <input type="text" list="tiers-list" value={formData.supplier || ''} onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Saisir ou sélectionner..." required />
                            <datalist id="tiers-list">{getAvailableTiers().map(tier => (<option key={tier.id} value={tier.name} />))}</datalist>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Montant *</label>
                            <div className="flex items-stretch">
                                <div className="relative flex-grow">
                                    <input type="number" value={formData.amount || ''} onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))} className="w-full pl-10 pr-3 py-2 border-r-0 border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:z-10 text-lg" placeholder="0.00" step="0.01" min="0" required />
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-lg leading-5 text-gray-500 font-semibold">{currencySymbols[formData.currency] || formData.currency}</div>
                                </div>
                                <select value={formData.currency} onChange={(e) => setFormData(prev => ({...prev, currency: e.target.value}))} className="px-3 py-2 border-t border-b border-gray-300 bg-white text-sm focus:z-10 focus:ring-2 focus:ring-blue-500">
                                    {currencyOptions.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            {convertedAmount !== null && <p className="mt-1 text-xs text-gray-500">~ {formatCurrency(convertedAmount, { ...settings, currency: activeProject?.currency || settings.currency })}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fréquence *</label>
                            <select value={formData.frequency || 'mensuel'} onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                                {frequencyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                        {formData.frequency === 'ponctuel' && (
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Date *</label><input type="date" value={formData.date || ''} onChange={(e) => setFormData(prev => ({...prev, date: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required /></div>
                        )}
                        {formData.frequency !== 'ponctuel' && formData.frequency !== 'irregulier' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Date de début *</label><input type="date" value={formData.startDate || ''} onChange={(e) => setFormData(prev => ({...prev, startDate: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label><input type="date" value={formData.endDate || ''} onChange={(e) => setFormData(prev => ({...prev, endDate: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100" disabled={formData.isEndDateIndefinite} min={formData.startDate} /></div>
                                <div className="col-span-2 flex items-center justify-end"><input type="checkbox" id="isEndDateIndefinite" checked={formData.isEndDateIndefinite} onChange={(e) => setFormData(prev => ({...prev, isEndDateIndefinite: e.target.checked, endDate: e.target.checked ? '' : prev.endDate}))} className="h-4 w-4 text-blue-600 border-gray-300 rounded" /><label htmlFor="isEndDateIndefinite" className="ml-2 text-sm text-gray-900">Durée indéterminée</label></div>
                            </div>
                        )}
                        <div className="border rounded-lg bg-gray-50">
                            <button type="button" onClick={() => setIsAdvancedOpen(!isAdvancedOpen)} className="w-full flex justify-between items-center p-3 text-sm font-medium text-gray-700">
                                <span className="flex items-center gap-2"><Settings size={16} /> Options avancées</span>
                                <ChevronDown className={`w-5 h-5 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {isAdvancedOpen && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                        <div className="p-4 border-t space-y-4">
                                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={formData.description || ''} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" rows="2" placeholder="Détails supplémentaires..." /></div>
                                            {showProvisionButton && (<div className="flex items-center gap-2"><input type="checkbox" id="isProvision" checked={formData.isProvision} onChange={(e) => setFormData(p => ({ ...p, isProvision: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label htmlFor="isProvision" className="text-sm font-medium text-gray-700 flex items-center gap-1"><Lock size={14} /> Provisionner cette dépense</label></div>)}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type de Montant</label>
                                                    <select value={formData.amount_type || 'ttc'} onChange={(e) => setFormData(prev => ({...prev, amount_type: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm">
                                                        <option value="ttc">TTC</option>
                                                        <option value="ht">HT</option>
                                                    </select>
                                                </div>
                                                {formData.amount_type === 'ht' && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Taux de TVA</label>
                                                        <select value={formData.vat_rate_id || ''} onChange={(e) => setFormData(prev => ({...prev, vat_rate_id: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm">
                                                            <option value="">Aucun</option>
                                                            {projectVatRates.map(rate => <option key={rate.id} value={rate.id}>{rate.name} ({rate.rate}%)</option>)}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500"><p>Montant HT: {formatCurrency(htAmount, currencySettingsForProject)}</p><p>Montant TTC: {formatCurrency(ttcAmount, currencySettingsForProject)}</p></div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </form>
                    <div className="p-4 border-t bg-white flex-shrink-0">
                        <div className="flex justify-between items-center">
                            <div>{entry && entry.id && onDelete && (<button type="button" onClick={handleDeleteClick} className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors">Supprimer</button>)}</div>
                            <div className="flex gap-3">
                                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Annuler</button>
                                <button type="submit" onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2">
                                    {entry && entry.id ? 'Modifier' : 'Enregistrer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </motion.div>
  );
};

export default BudgetDrawer;
