import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { Save, Loader, ArrowLeft } from 'lucide-react';
import { saveTaxConfig } from '../context/actions';

const TaxSettingsPage = () => {
    const { taxId } = useParams();
    const navigate = useNavigate();
    const { dataState, dataDispatch } = useData();
    const { uiDispatch } = useUI();
    const { taxConfigs, session } = dataState;

    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(false);
    const isNew = taxId === 'new';

    const taxConfig = useMemo(() => taxConfigs.find(tc => tc.id === taxId), [taxConfigs, taxId]);

    useEffect(() => {
        if (isNew) {
            setConfig({
                name: '',
                rate: 0,
                base_type: 'revenue',
                declaration_periodicity: 'annually',
                payment_delay_months: 1,
            });
        } else if (taxConfig) {
            setConfig({
                ...taxConfig,
                rate: taxConfig.rate || 0,
                base_type: taxConfig.base_type || 'revenue',
                declaration_periodicity: taxConfig.declaration_periodicity || 'annually',
                payment_delay_months: taxConfig.payment_delay_months || 1,
            });
        }
    }, [taxConfig, isNew]);

    const handleSave = async () => {
        setLoading(true);
        const configToSave = { ...config, rate: parseFloat(config.rate), user_id: session.user.id };
        if (isNew) {
            delete configToSave.id;
        }
        const savedConfig = await saveTaxConfig({dataDispatch, uiDispatch}, configToSave);
        setLoading(false);
        if (savedConfig && isNew) {
            navigate(`/app/fiscalite/${savedConfig.id}`, { replace: true });
        }
    };

    if (!config) {
        return (
            <div className="p-6">
                <div className="flex justify-center items-center p-8">
                    <Loader className="animate-spin w-8 h-8 text-blue-600" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <button onClick={() => navigate('/app/fiscalite')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
                    <ArrowLeft className="w-4 h-4" />
                    Retour à la gestion fiscale
                </button>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm border space-y-6">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'impôt ou taxe</label>
                    <input
                        type="text"
                        value={config.name}
                        onChange={(e) => setConfig(c => ({ ...c, name: e.target.value }))}
                        className="w-full max-w-xs px-3 py-2 border rounded-lg"
                        placeholder="Ex: Impôt sur les sociétés"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Taux d'imposition (%)</label>
                    <input
                        type="number"
                        value={config.rate}
                        onChange={(e) => setConfig(c => ({ ...c, rate: e.target.value }))}
                        className="w-full max-w-xs px-3 py-2 border rounded-lg"
                        step="0.01"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base de calcul</label>
                    <select
                        value={config.base_type}
                        onChange={(e) => setConfig(c => ({ ...c, base_type: e.target.value }))}
                        className="w-full max-w-xs px-3 py-2 border rounded-lg bg-white"
                    >
                        <option value="revenue">Chiffre d'affaires (Revenus)</option>
                        <option value="profit">Bénéfice (Revenus - Dépenses)</option>
                        <option value="salary">Masse salariale</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Périodicité de déclaration</label>
                    <select
                        value={config.declaration_periodicity}
                        onChange={(e) => setConfig(c => ({ ...c, declaration_periodicity: e.target.value }))}
                        className="w-full max-w-xs px-3 py-2 border rounded-lg bg-white"
                    >
                        <option value="monthly">Mensuelle</option>
                        <option value="quarterly">Trimestrielle</option>
                        <option value="annually">Annuelle</option>
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Délai de paiement (en mois après la période)</label>
                    <input
                        type="number"
                        value={config.payment_delay_months}
                        onChange={(e) => setConfig(c => ({ ...c, payment_delay_months: parseInt(e.target.value, 10) || 0 }))}
                        className="w-full max-w-xs px-3 py-2 border rounded-lg"
                        min="0"
                    />
                </div>
            </div>

            <div className="flex justify-end mt-8">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 disabled:bg-gray-400"
                >
                    {loading ? <Loader className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                    Enregistrer
                </button>
            </div>
        </div>
    );
};

export default TaxSettingsPage;
