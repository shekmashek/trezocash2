import React, { useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import SubHeader from '../components/SubHeader';
import SettingsDrawerWrapper from '../components/SettingsDrawerWrapper';
import BudgetDrawer from '../components/BudgetDrawer';
import InfoModal from '../components/InfoModal';
import ConfirmationModal from '../components/ConfirmationModal';
import InlinePaymentDrawer from '../components/InlinePaymentDrawer';
import TransferModal from '../components/TransferModal';
import CloseAccountModal from '../components/CloseAccountModal';
import ScenarioModal from '../components/ScenarioModal';
import ActualTransactionModal from '../components/ActualTransactionModal';
import PaymentModal from '../components/PaymentModal';
import DirectPaymentModal from '../components/DirectPaymentModal';
import TransactionActionMenu from '../components/TransactionActionMenu';
import ConsolidatedViewModal from '../components/ConsolidatedViewModal';
import CommentDrawer from '../components/CommentDrawer';
import TierDetailDrawer from '../components/TierDetailDrawer';
import SaveTemplateModal from '../components/SaveTemplateModal';
import CollaborationBanner from '../components/CollaborationBanner';
import PaymentTermsModal from '../components/PaymentTermsModal';
import VerticalNavBar from '../components/VerticalNavBar';
import BudgetEntryDetailDrawer from '../components/BudgetEntryDetailDrawer';
import CustomizationDrawer from '../components/CustomizationDrawer';
import { saveEntry, deleteEntry, writeOffActual, saveConsolidatedView, saveScenario, updateTierPaymentTerms, updateProjectSettings } from '../context/actions';
import { Loader } from 'lucide-react';
import { useActiveProjectData } from '../utils/selectors';

const dashboardWidgetConfig = [
    { type: 'group', label: 'Indicateurs Clés (KPIs)' },
    { id: 'kpi_actionable_balance', label: 'Trésorerie Actionnable', indent: true },
    { id: 'kpi_overdue_payables', label: 'Dettes en Retard', indent: true },
    { id: 'kpi_overdue_receivables', label: 'Créances en Retard', indent: true },
    { id: 'kpi_savings', label: 'Épargne', indent: true },
    { id: 'kpi_provisions', label: 'Provisions', indent: true },
    { id: 'kpi_borrowings', label: 'Emprunts à rembourser', indent: true },
    { id: 'kpi_lendings', label: 'Prêts à recevoir', indent: true },
    { type: 'divider' },
    { id: 'alerts', label: 'Alertes intelligentes' },
    { id: 'priorities', label: 'Actions prioritaires' },
    { id: 'trezo_score', label: 'Score Trézo' },
    { id: '30_day_forecast', label: 'Prévision sur 30 jours' },
    { id: 'monthly_budget', label: 'Budget du mois en cours' },
    { id: 'loans', label: 'Résumé des emprunts et prêts' },
    { id: 'ambassador_promo', label: 'Promotion Ambassadeur' },
    { id: 'actions', label: 'Raccourcis d\'actions' },
    { id: 'tutorials', label: 'Tutoriels vidéo' },
];

const trezoWidgetConfig = [
    { type: 'group', label: "Barre d'outils" },
    { id: 'trezo_toolbar', label: "Afficher toute la barre d'outils" },
    { id: 'trezo_toolbar_temporal', label: 'Navigation temporelle', indent: true },
    { id: 'trezo_toolbar_viewmode', label: 'Sélecteur de vue (Table/TCD)', indent: true },
    { id: 'trezo_toolbar_new_entry', label: "Bouton 'Nouvelle entrée'", indent: true },
    { type: 'divider' },
    { type: 'group', label: 'Colonnes du Tableau' },
    { id: 'trezo_col_budget', label: 'Colonne "Prévu"' },
    { id: 'trezo_col_actual', label: 'Colonne "Réel"' },
    { id: 'trezo_col_reste', label: 'Colonne "Reste"' },
    { id: 'trezo_col_description', label: 'Colonne "Description"' },
    { type: 'divider' },
    { type: 'group', label: 'Filtres Rapides' },
    { id: 'trezo_quick_filters', label: 'Afficher tous les filtres' },
    { id: 'trezo_quickfilter_provisions', label: 'Filtre Provisions', indent: true },
    { id: 'trezo_quickfilter_savings', label: 'Filtre Épargnes', indent: true },
    { id: 'trezo_quickfilter_borrowings', label: 'Filtre Emprunts', indent: true },
    { id: 'trezo_quickfilter_lendings', label: 'Filtre Prêts', indent: true },
];

const defaultDashboardWidgetSettings = {
    kpi_actionable_balance: true, kpi_overdue_payables: true, kpi_overdue_receivables: true, kpi_savings: true, kpi_provisions: true, kpi_borrowings: true, kpi_lendings: true,
    alerts: true, priorities: true, trezo_score: true, '30_day_forecast': true, monthly_budget: true, loans: true, ambassador_promo: true, actions: true, tutorials: true,
};

const defaultTrezoWidgetSettings = {
    trezo_toolbar: false, trezo_toolbar_temporal: false, trezo_toolbar_viewmode: false, trezo_toolbar_new_entry: false,
    trezo_col_budget: true, trezo_col_actual: true, trezo_col_reste: false, trezo_col_description: true,
    trezo_quick_filters: false, trezo_quickfilter_provisions: false, trezo_quickfilter_savings: false,
    trezo_quickfilter_borrowings: false, trezo_quickfilter_lendings: false,
};

const AppLayout = () => {
    const { dataState, dataDispatch } = useData();
    const { uiState, uiDispatch } = useUI();
    
    const { session, tiers } = dataState;
    
    const { 
        isLoading, activeProjectId, activeSettingsDrawer, isBudgetDrawerOpen, isBudgetDrawerMinimized, budgetDrawerData, 
        infoModal, confirmationModal, inlinePaymentDrawer, isTransferModalOpen, 
        isCloseAccountModalOpen, accountToClose, isScenarioModalOpen, editingScenario, 
        isActualTransactionModalOpen, editingActual, isPaymentModalOpen, payingActual, 
        isDirectPaymentModalOpen, directPaymentType, transactionMenu, isConsolidatedViewModalOpen, 
        editingConsolidatedView, isCommentDrawerOpen, commentDrawerContext, isTierDetailDrawerOpen, 
        tierDetailContext, isSaveTemplateModalOpen, editingTemplate,
        isCustomizationDrawerOpen, customizationDrawerType
    } = uiState;
    
    const { activeProject, isConsolidated, isCustomConsolidated } = useActiveProjectData(dataState, uiState);
    
    const [isPaymentTermsModalOpen, setIsPaymentTermsModalOpen] = React.useState(false);
    const [editingTierForTerms, setEditingTierForTerms] = React.useState(null);

    if (isLoading) {
        return (
            <div className="w-screen h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader className="w-12 h-12 text-blue-600 animate-spin" />
                    <p className="text-gray-600">Chargement de vos données...</p>
                </div>
            </div>
        );
    }

    const handleConfirm = () => {
        if (confirmationModal.onConfirm) confirmationModal.onConfirm();
        uiDispatch({ type: 'CLOSE_CONFIRMATION_MODAL' });
    };
    
    const handleCancel = () => uiDispatch({ type: 'CLOSE_CONFIRMATION_MODAL' });

    const handleConfirmCloseAccount = (closureDate) => {
        if (accountToClose) dataDispatch({ type: 'CLOSE_CASH_ACCOUNT', payload: { projectId: accountToClose.projectId, accountId: accountToClose.id, closureDate } });
    };

    const handleSaveScenario = (scenarioData) => {
        const user = session?.user;
        if (!user) { uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Utilisateur non authentifié.', type: 'error' } }); return; }
        saveScenario({dataDispatch, uiDispatch}, { scenarioData, editingScenario, activeProjectId, user, existingScenariosCount: dataState.scenarios.length });
        uiDispatch({ type: 'CLOSE_SCENARIO_MODAL' });
    };

    const handlePayAction = (transaction) => uiDispatch({ type: 'OPEN_PAYMENT_MODAL', payload: transaction });
    const handleWriteOffAction = (transaction) => uiDispatch({ type: 'OPEN_CONFIRMATION_MODAL', payload: { title: 'Confirmer le Write-off', message: `Êtes-vous sûr de vouloir annuler le montant restant de ${formatCurrency(transaction.amount - (transaction.payments || []).reduce((sum, p) => sum + p.paidAmount, 0), dataState.settings)} ? Cette action est irréversible.`, onConfirm: () => writeOffActual({dataDispatch, uiDispatch}, transaction.id) } });
    const handleEditAction = (transaction) => {
        const budgetEntryId = transaction.budgetId;
        if (budgetEntryId) {
            const entry = Object.values(dataState.allEntries).flat().find(e => e.id === budgetEntryId);
            if (entry) uiDispatch({ type: 'OPEN_BUDGET_DRAWER', payload: { entry, onSave: handleDefaultSave, onDelete: () => handleDefaultDelete(entry) } });
            else uiDispatch({ type: 'ADD_TOAST', payload: { message: "L'écriture budgétaire parente est introuvable.", type: 'error' } });
        } else {
            uiDispatch({ type: 'OPEN_ACTUAL_TRANSACTION_MODAL', payload: transaction });
        }
    };

    const handleSaveConsolidatedView = (viewData) => {
        const user = session?.user;
        if (!user) return;
        saveConsolidatedView({dataDispatch, uiDispatch}, { viewData, editingView: editingConsolidatedView, user });
    };

    const handleOpenPaymentTerms = (tier) => {
        setEditingTierForTerms(tier);
        setIsPaymentTermsModalOpen(true);
    };

    const handleSavePaymentTerms = (tierId, terms) => {
        updateTierPaymentTerms({dataDispatch, uiDispatch}, { tierId, terms });
        setIsPaymentTermsModalOpen(false);
    };
    
    const handleDefaultSave = (entryData) => {
        const user = session?.user;
        if (!user) { uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Vous devez être connecté.', type: 'error' } }); return; }
        const targetProjectId = entryData.projectId || activeProjectId;
        const cashAccountsForEntry = dataState.allCashAccounts[targetProjectId] || [];
        saveEntry({dataDispatch, uiDispatch, dataState}, { entryData: { ...entryData, user_id: user.id }, editingEntry: budgetDrawerData?.entry, activeProjectId: targetProjectId, tiers, user, cashAccounts: cashAccountsForEntry, exchangeRates: dataState.exchangeRates });
    };

    const handleDefaultDelete = (entry) => {
        const entryToDelete = Object.values(dataState.allEntries).flat().find(e => e.id === entry.id);
        deleteEntry({dataDispatch, uiDispatch}, { entryId: entry.id, entryProjectId: entryToDelete?.projectId });
    };
    
    const customizationConfig = useMemo(() => {
        if (customizationDrawerType === 'dashboard') {
            return {
                title: 'Personnaliser le Tableau de Bord',
                config: dashboardWidgetConfig,
                initialSettings: { ...defaultDashboardWidgetSettings, ...(activeProject?.dashboard_widgets || {}) }
            };
        }
        if (customizationDrawerType === 'trezo') {
            return {
                title: 'Personnaliser le Tableau de Trésorerie',
                config: trezoWidgetConfig,
                initialSettings: { ...defaultTrezoWidgetSettings, ...(activeProject?.dashboard_widgets || {}) }
            };
        }
        return { title: '', config: [], initialSettings: {} };
    }, [customizationDrawerType, activeProject]);

    const handleSaveCustomization = (newWidgetSettings) => {
        if (!activeProject || isConsolidated || isCustomConsolidated) return;
        const currentSettings = activeProject.dashboard_widgets || {};
        updateProjectSettings({ dataDispatch, uiDispatch }, {
            projectId: activeProject.id,
            newSettings: { dashboard_widgets: { ...currentSettings, ...newWidgetSettings } }
        });
        uiDispatch({ type: 'CLOSE_CUSTOMIZATION_DRAWER' });
    };

    return (
        <div className="h-screen flex bg-background">
            <VerticalNavBar />
            <div className="flex-1 flex flex-col pl-24">
                <SubHeader />
                <div className="flex-1 overflow-y-auto bg-gray-50">
                    <CollaborationBanner />
                    <main>
                        <Outlet context={{ onOpenPaymentTerms: handleOpenPaymentTerms }} />
                    </main>
                </div>
            </div>
            
            <SettingsDrawerWrapper activeDrawer={activeSettingsDrawer} onClose={() => uiDispatch({ type: 'SET_ACTIVE_SETTINGS_DRAWER', payload: null })} />
            <BudgetDrawer isOpen={isBudgetDrawerOpen} isMinimized={isBudgetDrawerMinimized} onClose={() => uiDispatch({ type: 'CLOSE_BUDGET_DRAWER' })} onToggleMinimize={() => uiDispatch({ type: 'TOGGLE_BUDGET_DRAWER_MINIMIZE' })} data={budgetDrawerData} />
            {isActualTransactionModalOpen && <ActualTransactionModal isOpen={isActualTransactionModalOpen} onClose={() => uiDispatch({ type: 'CLOSE_ACTUAL_TRANSACTION_MODAL' })} editingData={editingActual} type={editingActual?.type} />}
            {isPaymentModalOpen && <PaymentModal isOpen={isPaymentModalOpen} onClose={() => uiDispatch({ type: 'CLOSE_PAYMENT_MODAL' })} actualToPay={payingActual} type={payingActual?.type} />}
            {isDirectPaymentModalOpen && <DirectPaymentModal isOpen={isDirectPaymentModalOpen} onClose={() => uiDispatch({ type: 'CLOSE_DIRECT_PAYMENT_MODAL' })} onSave={(data) => dataDispatch({ type: 'RECORD_BATCH_PAYMENT', payload: data })} type={directPaymentType} />}
            {isScenarioModalOpen && <ScenarioModal isOpen={isScenarioModalOpen} onClose={() => uiDispatch({ type: 'CLOSE_SCENARIO_MODAL' })} onSave={handleSaveScenario} scenario={editingScenario} />}
            {isConsolidatedViewModalOpen && <ConsolidatedViewModal isOpen={isConsolidatedViewModalOpen} onClose={() => uiDispatch({ type: 'CLOSE_CONSOLIDATED_VIEW_MODAL' })} onSave={handleSaveConsolidatedView} editingView={editingConsolidatedView} />}
            {isSaveTemplateModalOpen && <SaveTemplateModal isOpen={isSaveTemplateModalOpen} onClose={() => uiDispatch({ type: 'CLOSE_SAVE_TEMPLATE_MODAL' })} editingTemplate={editingTemplate} />}
            <PaymentTermsModal isOpen={isPaymentTermsModalOpen} onClose={() => setIsPaymentTermsModalOpen(false)} tier={editingTierForTerms} onSave={handleSavePaymentTerms} />
            {infoModal.isOpen && <InfoModal isOpen={infoModal.isOpen} onClose={() => uiDispatch({ type: 'CLOSE_INFO_MODAL' })} title={infoModal.title} message={infoModal.message} />}
            <ConfirmationModal isOpen={confirmationModal.isOpen} onClose={handleCancel} onConfirm={handleConfirm} title={confirmationModal.title} message={confirmationModal.message} confirmText={confirmationModal.confirmText} cancelText={confirmationModal.cancelText} confirmColor={confirmationModal.confirmColor} />
            <InlinePaymentDrawer isOpen={inlinePaymentDrawer.isOpen} onClose={() => uiDispatch({ type: 'CLOSE_INLINE_PAYMENT_DRAWER' })} actuals={inlinePaymentDrawer.actuals} entry={inlinePaymentDrawer.entry} period={inlinePaymentDrawer.period} periodLabel={inlinePaymentDrawer.periodLabel} />
            <TransferModal isOpen={isTransferModalOpen} onClose={() => uiDispatch({ type: 'CLOSE_TRANSFER_MODAL' })} onSave={(data) => dataDispatch({ type: 'TRANSFER_FUNDS', payload: data })} />
            <CloseAccountModal isOpen={isCloseAccountModalOpen} onClose={() => uiDispatch({ type: 'CLOSE_CLOSE_ACCOUNT_MODAL' })} onConfirm={handleConfirmCloseAccount} accountName={accountToClose?.name} minDate={dataState.projects.find(p => p.id === accountToClose?.projectId)?.startDate} />
            <TransactionActionMenu menuState={transactionMenu} onClose={() => uiDispatch({ type: 'CLOSE_TRANSACTION_ACTION_MENU' })} onPay={handlePayAction} onWriteOff={handleWriteOffAction} onEdit={handleEditAction} />
            <CommentDrawer isOpen={isCommentDrawerOpen} onClose={() => uiDispatch({ type: 'CLOSE_COMMENT_DRAWER' })} context={commentDrawerContext} />
            <TierDetailDrawer isOpen={isTierDetailDrawerOpen} onClose={() => uiDispatch({ type: 'CLOSE_TIER_DETAIL_DRAWER' })} context={tierDetailContext} />
            <BudgetEntryDetailDrawer onDelete={handleDefaultDelete} />
            <CustomizationDrawer isOpen={isCustomizationDrawerOpen} onClose={() => uiDispatch({ type: 'CLOSE_CUSTOMIZATION_DRAWER' })} onSave={handleSaveCustomization} title={customizationConfig.title} config={customizationConfig.config} initialSettings={customizationConfig.initialSettings} />
        </div>
    );
};

export default AppLayout;
