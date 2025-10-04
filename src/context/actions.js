import { supabase } from '../utils/supabase';
import { deriveActualsFromEntry } from '../utils/scenarioCalculations';
import { templates as officialTemplatesData } from '../utils/templates';
import { eventTemplates, weddingDemoTemplate } from '../utils/eventTemplates.js';
import { v4 as uuidv4 } from 'uuid';

const getDefaultExpenseTargets = () => ({
  'exp-main-1': 20, 'exp-main-2': 35, 'exp-main-3': 10, 'exp-main-4': 0,
  'exp-main-5': 10, 'exp-main-6': 5, 'exp-main-7': 10, 'exp-main-8': 5,
  'exp-main-9': 5, 'exp-main-10': 0,
});

export const initializeProject = async ({ dataDispatch, uiDispatch }, payload, user, existingTiersData, allTemplates) => {
  try {
    const { projectName, projectDescription, projectStartDate, projectEndDate, isEndDateIndefinite, templateId, startOption, projectType, projectClass } = payload;
    
    const { data: newProjectData, error: projectError } = await supabase
        .from('projects')
        .insert({
            user_id: user.id,
            name: projectName,
            description: projectDescription,
            start_date: projectStartDate,
            end_date: isEndDateIndefinite ? null : projectEndDate,
            currency: 'EUR',
            currency_symbol: '€',
            expense_targets: getDefaultExpenseTargets(),
            type: projectType,
            onboarding_step: 'budget',
            icon: 'Briefcase',
            color: 'blue',
        })
        .select().single();
    if (projectError) throw projectError;

    const projectId = newProjectData.id;
    
    const newProjectForState = {
        id: projectId,
        name: projectName,
        description: projectDescription,
        currency: 'EUR',
        currency_symbol: '€',
        startDate: projectStartDate,
        endDate: isEndDateIndefinite ? null : projectEndDate,
        isArchived: false,
        annualGoals: {},
        expenseTargets: getDefaultExpenseTargets(),
        type: projectType,
        onboarding_step: 'budget',
        icon: newProjectData.icon,
        color: newProjectData.color,
        user_id: user.id,
        isShared: false
    };

    if (startOption === 'blank' || templateId === 'blank') {
        const { data: defaultAccount, error: accountError } = await supabase
            .from('cash_accounts')
            .insert({
                project_id: projectId, user_id: user.id, main_category_id: 'bank',
                name: 'Compte Principal', initial_balance: 0, initial_balance_date: projectStartDate,
            })
            .select().single();
        if (accountError) throw accountError;

        dataDispatch({ 
            type: 'INITIALIZE_PROJECT_SUCCESS', 
            payload: {
                newProject: newProjectForState,
                finalCashAccounts: [{
                    id: defaultAccount.id, projectId: projectId, mainCategoryId: 'bank',
                    name: 'Compte Principal', initialBalance: 0, initialBalanceDate: projectStartDate,
                    isClosed: false, closureDate: null
                }],
                newAllEntries: [], newAllActuals: [], newTiers: [], newLoans: [], newCategories: null,
            }
        });
        uiDispatch({ type: 'CANCEL_ONBOARDING' });
        return;
    }

    const allOfficialTemplates = [...officialTemplatesData.personal, ...officialTemplatesData.professional, ...eventTemplates, weddingDemoTemplate];
    const officialTemplate = allOfficialTemplates.find(t => t.id === templateId);
    const customTemplate = allTemplates.find(t => t.id === templateId);
    
    let templateData;
    let newCategories = null;
    if (officialTemplate) {
        templateData = officialTemplate.data;
    } else if (customTemplate) {
        templateData = customTemplate.structure;
        newCategories = customTemplate.structure.categories;
    } else {
        throw new Error("Template not found");
    }

    const { data: newCashAccountsData, error: cashAccountsError } = await supabase
        .from('cash_accounts')
        .insert(templateData.cashAccounts.map(acc => ({
            project_id: projectId, user_id: user.id, main_category_id: acc.mainCategoryId,
            name: acc.name, initial_balance: acc.initialBalance, initial_balance_date: projectStartDate,
        })))
        .select();
    if (cashAccountsError) throw cashAccountsError;

    const allTiersFromTemplate = [...templateData.entries, ...(templateData.loans || []), ...(templateData.borrowings || [])]
        .map(item => item.supplier || item.thirdParty).filter(Boolean);
    const uniqueTiers = [...new Set(allTiersFromTemplate)];
    
    let createdTiers = [];
    if (uniqueTiers.length > 0) {
        const tiersToInsert = uniqueTiers.map(name => ({ name, type: 'fournisseur', user_id: user.id }));
        const { data: insertedTiers, error: tiersError } = await supabase.from('tiers').upsert(tiersToInsert, { onConflict: 'user_id,name,type' }).select();
        if (tiersError) throw tiersError;
        createdTiers = insertedTiers;
    }

    const today = new Date().toISOString().split('T')[0];
    const entriesToInsert = templateData.entries.map(entry => ({
        project_id: projectId, user_id: user.id, type: entry.type, category: entry.category,
        frequency: entry.frequency, amount: entry.amount, 
        date: entry.frequency === 'ponctuel' ? (entry.date || today) : null,
        start_date: entry.frequency !== 'ponctuel' ? (entry.startDate || today) : null,
        supplier: entry.supplier, description: entry.description,
    }));
    const { data: newEntriesData, error: entriesError } = await supabase
        .from('budget_entries')
        .insert(entriesToInsert)
        .select();
    if (entriesError) throw entriesError;

    let newActualsToInsert = [];
    newEntriesData.forEach(entry => {
        const actuals = deriveActualsFromEntry(entry, projectId, newCashAccountsData);
        newActualsToInsert.push(...actuals);
    });

    if (newActualsToInsert.length > 0) {
        const { error: actualsError } = await supabase.from('actual_transactions').insert(newActualsToInsert.map(a => ({
            id: a.id,
            budget_id: a.budgetId,
            project_id: a.projectId,
            user_id: user.id,
            type: a.type,
            category: a.category,
            third_party: a.thirdParty,
            description: a.description,
            date: a.date,
            amount: a.amount,
            status: a.status
        })));
        if (actualsError) throw actualsError;
    }
    
    dataDispatch({ 
        type: 'INITIALIZE_PROJECT_SUCCESS', 
        payload: {
            newProject: newProjectForState,
            finalCashAccounts: newCashAccountsData.map(acc => ({
                id: acc.id, projectId: acc.project_id, mainCategoryId: acc.main_category_id,
                name: acc.name, initialBalance: acc.initial_balance, initialBalanceDate: acc.initial_balance_date,
                isClosed: acc.is_closed, closureDate: acc.closure_date
            })),
            newAllEntries: newEntriesData.map(entry => ({
              id: entry.id, type: entry.type, category: entry.category, frequency: entry.frequency,
              amount: entry.amount, date: entry.date, startDate: entry.start_date,
              supplier: entry.supplier, description: entry.description
            })),
            newAllActuals: newActualsToInsert.map(a => ({ ...a, payments: [] })),
            newTiers: createdTiers.map(t => ({ id: t.id, name: t.name, type: t.type })),
            newLoans: [],
            newCategories,
        }
    });
    uiDispatch({ type: 'CANCEL_ONBOARDING' });

  } catch (error) {
    console.error("Onboarding failed:", error);
    uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur lors de la création du projet: ${error.message}`, type: 'error' } });
    throw error;
  }
};

export const saveProject = async ({ dataDispatch, uiDispatch }, projectData, user) => {
  try {
    if (!projectData.name.trim()) {
      throw new Error("Le nom du projet ne peut pas être vide.");
    }

    if (projectData.id) {
      // Update existing project
      const { data, error: updateError } = await supabase
        .from('projects')
        .update({ 
            name: projectData.name, 
            description: projectData.description,
            icon: projectData.icon,
            color: projectData.color,
        })
        .eq('id', projectData.id)
        .select()
        .single();
      if (updateError) throw updateError;

      dataDispatch({
        type: 'UPDATE_PROJECT_SETTINGS_SUCCESS',
        payload: { projectId: data.id, newSettings: { 
            name: data.name, 
            description: data.description,
            icon: data.icon,
            color: data.color
        } }
      });
      uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Projet mis à jour.', type: 'success' } });
    } else {
      // Create new project
      const { name, description, startDate, endDate, isEndDateIndefinite, projectType, icon, color } = projectData;
      
      const { data: newProjectData, error: projectError } = await supabase
        .from('projects')
        .insert({
            user_id: user.id,
            name,
            description,
            start_date: startDate,
            end_date: isEndDateIndefinite ? null : endDate,
            currency: 'EUR', // Default currency
            currency_symbol: '€',
            expense_targets: getDefaultExpenseTargets(),
            type: projectType || 'business',
            onboarding_step: 'budget',
            icon: icon,
            color: color,
        })
        .select().single();
      if (projectError) throw projectError;

      dataDispatch({ type: 'ADD_PROJECT_SUCCESS', payload: newProjectData });

      const { data: defaultAccount, error: accountError } = await supabase
        .from('cash_accounts')
        .insert({
            project_id: newProjectData.id, 
            user_id: user.id, 
            main_category_id: 'bank',
            name: 'Compte Principal', 
            initial_balance: 0, 
            initial_balance_date: startDate,
        })
        .select().single();
      if (accountError) throw accountError;
      
      dataDispatch({
        type: 'ADD_USER_CASH_ACCOUNT_SUCCESS',
        payload: {
            projectId: newProjectData.id,
            newAccount: {
                id: defaultAccount.id,
                projectId: defaultAccount.project_id,
                mainCategoryId: defaultAccount.main_category_id,
                name: defaultAccount.name,
                initialBalance: defaultAccount.initial_balance,
                initialBalanceDate: defaultAccount.initial_balance_date,
                isClosed: defaultAccount.is_closed,
                closureDate: defaultAccount.closure_date,
            }
        }
      });

      uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Projet créé avec succès.', type: 'success' } });
      uiDispatch({ type: 'SET_ACTIVE_PROJECT', payload: newProjectData.id });
    }

  } catch (error) {
    console.error("Error saving project:", error);
    uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur lors de l'enregistrement du projet: ${error.message}`, type: 'error' } });
  }
};

export const updateProjectOnboardingStep = async ({ dataDispatch, uiDispatch }, { projectId, step }) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update({ onboarding_step: step })
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;

    dataDispatch({ type: 'UPDATE_PROJECT_ONBOARDING_STEP', payload: { projectId, step } });
    uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Étape validée !', type: 'success' } });
  } catch (error) {
    console.error('Error updating onboarding step:', error);
    uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
  }
};

// ... (rest of the actions file)
export const updateProjectSettings = async ({ dataDispatch, uiDispatch }, { projectId, newSettings }) => {
    try {
        const updates = {};
        if (newSettings.name !== undefined) updates.name = newSettings.name;
        if (newSettings.description !== undefined) updates.description = newSettings.description;
        if (newSettings.startDate !== undefined) updates.start_date = newSettings.startDate;
        if (newSettings.endDate !== undefined) updates.end_date = newSettings.endDate;
        if (newSettings.currency !== undefined) updates.currency = newSettings.currency;
        if (newSettings.currency_symbol !== undefined) updates.currency_symbol = newSettings.currency_symbol;
        if (newSettings.display_unit !== undefined) updates.display_unit = newSettings.display_unit;
        if (newSettings.decimal_places !== undefined) updates.decimal_places = newSettings.decimal_places;
        if (newSettings.timezone_offset !== undefined) updates.timezone_offset = newSettings.timezone_offset;
        if (newSettings.dashboard_widgets !== undefined) updates.dashboard_widgets = newSettings.dashboard_widgets;

        if (Object.keys(updates).length === 0) {
            return;
        }

        const { data, error } = await supabase
            .from('projects')
            .update(updates)
            .eq('id', projectId)
            .select()
            .single();

        if (error) throw error;

        dataDispatch({
            type: 'UPDATE_PROJECT_SETTINGS_SUCCESS',
            payload: {
                projectId,
                newSettings: {
                    name: data.name,
                    description: data.description,
                    startDate: data.start_date,
                    endDate: data.end_date,
                    currency: data.currency,
                    currency_symbol: data.currency_symbol,
                    display_unit: data.display_unit,
                    decimal_places: data.decimal_places,
                    timezone_offset: data.timezone_offset,
                    dashboard_widgets: data.dashboard_widgets,
                }
            }
        });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Paramètres du projet mis à jour.', type: 'success' } });
    } catch (error) {
        console.error("Error updating project settings:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const saveEntry = async ({ dataDispatch, uiDispatch, dataState }, { entryData, editingEntry, user, tiers, cashAccounts, exchangeRates, activeProjectId }) => {
    try {
        const { collaborators, allEntries } = dataState;

        const targetProjectId = entryData.projectId || activeProjectId;

        if (!targetProjectId) {
            throw new Error("L'identifiant du projet est manquant. Impossible de sauvegarder.");
        }

        // --- Budget Limit Check ---
        const collaboratorRecord = collaborators.find(c => c.userId === user.id && c.projectIds?.includes(targetProjectId));

        if (collaboratorRecord && collaboratorRecord.role === 'editor' && collaboratorRecord.budgetLimit != null) {
            const collaboratorBudgetLimit = collaboratorRecord.budgetLimit;

            const collaboratorEntries = (allEntries[targetProjectId] || []).filter(e => e.userId === user.id);
            
            const currentTotal = collaboratorEntries.reduce((sum, e) => {
                if (editingEntry && e.id === editingEntry.id) {
                    return sum;
                }
                return sum + e.amount;
            }, 0);

            const newAmount = parseFloat(entryData.amount) || 0;
            const projectedTotal = currentTotal + newAmount;

            if (projectedTotal > collaboratorBudgetLimit) {
                uiDispatch({ 
                    type: 'ADD_TOAST', 
                    payload: { 
                        message: `Action impossible. Votre budget alloué pour ce projet est de ${collaboratorBudgetLimit} et vous tentez de le dépasser.`, 
                        type: 'error',
                        duration: 6000
                    } 
                });
                return; // Stop the save operation
            }
        }
        // --- End of Budget Limit Check ---

        const { supplier, type } = entryData;
        const tierType = type === 'revenu' ? 'client' : 'fournisseur';
        const existingTier = tiers.find(t => t.name.toLowerCase() === supplier.toLowerCase() && t.type === tierType);
        let newTierData = null;

        if (!existingTier && supplier) {
            const { data: insertedTier, error: tierError } = await supabase
                .from('tiers')
                .upsert({ name: supplier, type: tierType, user_id: user.id }, { onConflict: 'user_id,name,type' })
                .select()
                .single();
            if (tierError) throw tierError;
            newTierData = insertedTier;
        }
        
        const projectCurrency = entryData.projectCurrency || 'EUR';
        const transactionCurrency = entryData.currency || projectCurrency;
        
        let convertedTtcAmount = entryData.ttc_amount;

        if (transactionCurrency !== projectCurrency && exchangeRates) {
            const baseRate = exchangeRates[projectCurrency];
            const transactionRate = exchangeRates[transactionCurrency];
            if (baseRate && transactionRate) {
                const conversionRate = baseRate / transactionRate;
                convertedTtcAmount = entryData.ttc_amount * conversionRate;
            }
        }
        
        const finalEntryDataForDB = {
            project_id: targetProjectId,
            user_id: user.id,
            type: entryData.type,
            category: entryData.category,
            frequency: entryData.frequency,
            amount: convertedTtcAmount,
            date: entryData.date || null,
            start_date: entryData.startDate || null,
            end_date: entryData.endDate || null,
            supplier: entryData.supplier,
            description: entryData.description,
            is_off_budget: entryData.isOffBudget || false,
            payments: entryData.payments,
            provision_details: entryData.provisionDetails,
            is_provision: entryData.isProvision,
            currency: entryData.currency,
            original_amount: entryData.amount,
            amount_type: entryData.amount_type,
            vat_rate_id: entryData.vat_rate_id,
            ht_amount: entryData.ht_amount,
            ttc_amount: entryData.ttc_amount,
        };

        let savedEntryFromDB;
        if (editingEntry && editingEntry.id) {
            const { data, error } = await supabase
                .from('budget_entries')
                .update(finalEntryDataForDB)
                .eq('id', editingEntry.id)
                .select()
                .single();
            if (error) {
                console.error("Supabase update error:", error);
                throw error;
            }
            savedEntryFromDB = data;
        } else {
            const { data, error } = await supabase
                .from('budget_entries')
                .insert(finalEntryDataForDB)
                .select()
                .single();
            if (error) {
                console.error("Supabase insert error:", error);
                throw error;
            }
            savedEntryFromDB = data;
        }
        
        const unsettledStatuses = ['pending', 'partially_paid', 'partially_received'];
        const { error: deleteError } = await supabase
            .from('actual_transactions')
            .delete()
            .eq('budget_id', savedEntryFromDB.id)
            .in('status', unsettledStatuses);
        if (deleteError) throw deleteError;

        const savedEntryForClient = {
            id: savedEntryFromDB.id,
            loanId: savedEntryFromDB.loan_id,
            type: savedEntryFromDB.type,
            category: savedEntryFromDB.category,
            frequency: savedEntryFromDB.frequency,
            amount: savedEntryFromDB.amount,
            date: savedEntryFromDB.date,
            startDate: savedEntryFromDB.start_date,
            endDate: savedEntryFromDB.end_date,
            supplier: savedEntryFromDB.supplier,
            description: savedEntryFromDB.description,
            isOffBudget: savedEntryFromDB.is_off_budget,
            payments: savedEntryFromDB.payments,
            provisionDetails: savedEntryFromDB.provision_details,
            isProvision: savedEntryFromDB.is_provision,
            currency: savedEntryFromDB.currency,
            original_amount: savedEntryFromDB.original_amount,
            amount_type: savedEntryFromDB.amount_type,
            vat_rate_id: savedEntryFromDB.vat_rate_id,
            ht_amount: savedEntryFromDB.ht_amount,
            ttc_amount: savedEntryFromDB.ttc_amount,
            userId: savedEntryFromDB.user_id,
        };

        const tier = existingTier || newTierData;
        const paymentTerms = tier?.payment_terms;

        const newActuals = deriveActualsFromEntry(savedEntryForClient, savedEntryFromDB.project_id, cashAccounts, paymentTerms);
        
        if (newActuals.length > 0) {
            const { error: insertError } = await supabase
                .from('actual_transactions')
                .insert(newActuals.map(a => ({
                    id: a.id,
                    budget_id: a.budgetId,
                    project_id: a.projectId,
                    user_id: user.id,
                    type: a.type,
                    category: a.category,
                    third_party: a.thirdParty,
                    description: a.description,
                    date: a.date,
                    amount: a.amount,
                    status: a.status,
                    is_off_budget: a.isOffBudget,
                    is_provision: a.isProvision,
                    is_final_provision_payment: a.isFinalProvisionPayment,
                    provision_details: a.provisionDetails,
                    is_internal_transfer: a.isInternalTransfer,
                    currency: a.currency,
                    original_amount: a.original_amount,
                })));
            if (insertError) throw insertError;
        }

        dataDispatch({
            type: 'SAVE_ENTRY_SUCCESS',
            payload: {
                savedEntry: savedEntryForClient,
                newActuals: newActuals,
                targetProjectId: savedEntryFromDB.project_id,
                newTier: newTierData ? { id: newTierData.id, name: newTierData.name, type: newTierData.type } : null,
            }
        });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Entrée budgétaire enregistrée.', type: 'success' } });
        uiDispatch({ type: 'CLOSE_BUDGET_DRAWER' });

    } catch (error) {
        console.error("Error saving entry:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur lors de l'enregistrement: ${error.message}`, type: 'error' } });
    }
};

export const deleteEntry = async ({ dataDispatch, uiDispatch }, { entryId, entryProjectId }) => {
    try {
        if (!entryProjectId || entryProjectId === 'consolidated' || entryProjectId.startsWith('consolidated_view_')) {
            uiDispatch({ type: 'ADD_TOAST', payload: { message: "Impossible de supprimer une entrée en vue consolidée.", type: 'error' } });
            return;
        }
        const unsettledStatuses = ['pending', 'partially_paid', 'partially_received'];
        await supabase
            .from('actual_transactions')
            .delete()
            .eq('budget_id', entryId)
            .in('status', unsettledStatuses);
        const { error: deleteEntryError } = await supabase
            .from('budget_entries')
            .delete()
            .eq('id', entryId);
        if (deleteEntryError) throw deleteEntryError;
        dataDispatch({
            type: 'DELETE_ENTRY_SUCCESS',
            payload: { entryId, entryProjectId }
        });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Entrée budgétaire supprimée.', type: 'success' } });
        uiDispatch({ type: 'CLOSE_BUDGET_DRAWER' });
    } catch (error) {
        console.error("Error deleting entry:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur lors de la suppression: ${error.message}`, type: 'error' } });
    }
};

export const deleteProject = async ({ dataDispatch, uiDispatch }, projectId) => {
    try {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId);

        if (error) throw error;

        dataDispatch({ type: 'DELETE_PROJECT_SUCCESS', payload: projectId });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Projet supprimé avec succès.', type: 'success' } });
        uiDispatch({ type: 'SET_ACTIVE_PROJECT', payload: 'consolidated' });
    } catch (error) {
        console.error("Error deleting project:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur lors de la suppression du projet: ${error.message}`, type: 'error' } });
    }
};

export const updateUserCashAccount = async ({ dataDispatch, uiDispatch }, { projectId, accountId, accountData }) => {
    try {
        const updates = {
            name: accountData.name,
            initial_balance: accountData.initialBalance,
            initial_balance_date: accountData.initialBalanceDate,
            currency: accountData.currency,
        };
        const { data, error } = await supabase
            .from('cash_accounts')
            .update(updates)
            .eq('id', accountId)
            .select()
            .single();
        if (error) throw error;
        dataDispatch({
            type: 'UPDATE_USER_CASH_ACCOUNT_SUCCESS',
            payload: {
                projectId,
                accountId,
                accountData: {
                    name: data.name,
                    initialBalance: data.initial_balance,
                    initialBalanceDate: data.initial_balance_date,
                    currency: data.currency,
                }
            }
        });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Compte mis à jour.', type: 'success' } });
    } catch (error) {
        console.error("Error updating cash account:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const addUserCashAccount = async ({ dataDispatch, uiDispatch }, { projectId, mainCategoryId, name, initialBalance, initialBalanceDate, currency, user }) => {
    try {
        const { data, error } = await supabase
            .from('cash_accounts')
            .insert({
                project_id: projectId,
                user_id: user.id,
                main_category_id: mainCategoryId,
                name: name,
                initial_balance: initialBalance,
                initial_balance_date: initialBalanceDate,
                currency: currency,
            })
            .select()
            .single();
        if (error) throw error;
        dataDispatch({
            type: 'ADD_USER_CASH_ACCOUNT_SUCCESS',
            payload: {
                projectId,
                newAccount: {
                    id: data.id,
                    projectId: data.project_id,
                    mainCategoryId: data.main_category_id,
                    name: data.name,
                    initialBalance: data.initial_balance,
                    initialBalanceDate: data.initial_balance_date,
                    isClosed: data.is_closed,
                    closureDate: data.closure_date,
                    currency: data.currency,
                }
            }
        });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Compte ajouté.', type: 'success' } });
    } catch (error) {
        console.error("Error adding cash account:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const saveActual = async ({ dataDispatch, uiDispatch }, { actualData, editingActual, user, tiers }) => {
  try {
    const { thirdParty, type } = actualData;
    const tierType = type === 'receivable' ? 'client' : 'fournisseur';
    let newTierData = null;
    const existingTier = tiers.find(t => t.name.toLowerCase() === thirdParty.toLowerCase());
    if (!existingTier && thirdParty) {
      const { data: insertedTier, error: tierError } = await supabase
        .from('tiers')
        .upsert({ name: thirdParty, type: tierType, user_id: user.id }, { onConflict: 'user_id,name,type' })
        .select().single();
      if (tierError) throw tierError;
      newTierData = insertedTier;
    }
    const dataToSave = {
      project_id: actualData.projectId,
      user_id: user.id,
      type: actualData.type,
      category: actualData.category,
      third_party: actualData.thirdParty,
      description: actualData.description,
      date: actualData.date,
      amount: actualData.amount,
      status: actualData.status,
      is_off_budget: actualData.isOffBudget,
    };
    let savedActual;
    if (editingActual) {
      const { data, error } = await supabase.from('actual_transactions').update(dataToSave).eq('id', editingActual.id).select().single();
      if (error) throw error;
      savedActual = data;
    } else {
      const { data, error } = await supabase.from('actual_transactions').insert(dataToSave).select().single();
      if (error) throw error;
      savedActual = data;
    }
    const finalActualData = {
        id: savedActual.id,
        budgetId: savedActual.budget_id,
        projectId: savedActual.project_id,
        type: savedActual.type,
        category: savedActual.category,
        thirdParty: savedActual.third_party,
        description: savedActual.description,
        date: savedActual.date,
        amount: savedActual.amount,
        status: savedActual.status,
        isOffBudget: savedActual.is_off_budget,
        payments: []
    };
    dataDispatch({
      type: 'SAVE_ACTUAL_SUCCESS',
      payload: {
        finalActualData,
        newTier: newTierData ? { id: newTierData.id, name: newTierData.name, type: newTierData.type } : null,
      }
    });
    uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Transaction enregistrée.', type: 'success' } });
    uiDispatch({ type: 'CLOSE_ACTUAL_TRANSACTION_MODAL' });
  } catch (error) {
    console.error("Error saving actual transaction:", error);
    uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
  }
};

export const deleteActual = async ({ dataDispatch, uiDispatch }, actualId) => {
    try {
        const { error } = await supabase.from('actual_transactions').delete().eq('id', actualId);
        if (error) throw error;
        dataDispatch({ type: 'DELETE_ACTUAL_SUCCESS', payload: actualId });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Transaction supprimée.', type: 'success' } });
    } catch (error) {
        console.error("Error deleting actual:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const recordPayment = async ({ dataDispatch, uiDispatch }, { actualId, paymentData, allActuals, user }) => {
    try {
        if (!user || !user.id) {
            throw new Error("ID utilisateur manquant.");
        }
        const { data: payment, error: paymentError } = await supabase.from('payments').insert({
            actual_id: actualId,
            user_id: user.id,
            payment_date: paymentData.paymentDate,
            paid_amount: paymentData.paidAmount,
            cash_account: paymentData.cashAccount,
        }).select().single();
        if (paymentError) throw paymentError;
        const actual = Object.values(allActuals).flat().find(a => a.id === actualId);
        const totalPaid = (actual.payments || []).reduce((sum, p) => sum + p.paidAmount, 0) + paymentData.paidAmount;
        let newStatus = actual.status;
        if (paymentData.isFinalPayment || totalPaid >= actual.amount) {
            newStatus = actual.type === 'payable' ? 'paid' : 'received';
        } else if (totalPaid > 0) {
            newStatus = actual.type === 'payable' ? 'partially_paid' : 'partially_received';
        }
        const { data: updatedActual, error: actualError } = await supabase
            .from('actual_transactions')
            .update({ status: newStatus })
            .eq('id', actualId)
            .select('*, payments(*)')
            .single();
        if (actualError) throw actualError;
        dataDispatch({ type: 'RECORD_PAYMENT_SUCCESS', payload: { updatedActual } });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Paiement enregistré.', type: 'success' } });
        uiDispatch({ type: 'CLOSE_PAYMENT_MODAL' });
    } catch (error) {
        console.error("Error recording payment:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const writeOffActual = async ({ dataDispatch, uiDispatch }, actualId) => {
    try {
        const { data: updatedActual, error } = await supabase
            .from('actual_transactions')
            .update({ 
                status: 'written_off',
                description: `(Write-off) ${new Date().toLocaleDateString()}` 
            })
            .eq('id', actualId)
            .select()
            .single();
        if (error) throw error;
        dataDispatch({ type: 'WRITE_OFF_ACTUAL_SUCCESS', payload: updatedActual });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Transaction passée en perte.', type: 'success' } });
    } catch (error) {
        console.error("Error writing off actual:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const saveConsolidatedView = async ({ dataDispatch, uiDispatch }, { viewData, editingView, user }) => {
  try {
    const dataToSave = {
      user_id: user.id,
      name: viewData.name,
      project_ids: viewData.project_ids,
    };
    let savedView;
    if (editingView) {
      const { data, error } = await supabase
        .from('consolidated_views')
        .update(dataToSave)
        .eq('id', editingView.id)
        .select()
        .single();
      if (error) throw error;
      savedView = data;
      dataDispatch({ type: 'UPDATE_CONSOLIDATED_VIEW_SUCCESS', payload: { id: savedView.id, name: savedView.name, project_ids: savedView.project_ids, is_archived: savedView.is_archived } });
      uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Vue consolidée mise à jour.', type: 'success' } });
    } else {
      const { data, error } = await supabase
        .from('consolidated_views')
        .insert(dataToSave)
        .select()
        .single();
      if (error) throw error;
      savedView = data;
      dataDispatch({ type: 'ADD_CONSOLIDATED_VIEW_SUCCESS', payload: { id: savedView.id, name: savedView.name, project_ids: savedView.project_ids, is_archived: savedView.is_archived } });
      uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Vue consolidée créée.', type: 'success' } });
    }
    uiDispatch({ type: 'CLOSE_CONSOLIDATED_VIEW_MODAL' });
  } catch (error) {
    console.error("Error saving consolidated view:", error);
    uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
  }
};

export const deleteConsolidatedView = async ({ dataDispatch, uiDispatch }, viewId) => {
    try {
        const { error } = await supabase.from('consolidated_views').delete().eq('id', viewId);
        if (error) throw error;
        dataDispatch({ type: 'DELETE_CONSOLIDATED_VIEW_SUCCESS', payload: viewId });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Vue consolidée supprimée.', type: 'success' } });
    } catch (error) {
        console.error("Error deleting consolidated view:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const archiveConsolidatedView = async ({ dataDispatch, uiDispatch }, viewId) => {
    try {
        const { error } = await supabase
            .from('consolidated_views')
            .update({ is_archived: true })
            .eq('id', viewId);
        if (error) throw error;
        dataDispatch({ type: 'ARCHIVE_CONSOLIDATED_VIEW_SUCCESS', payload: viewId });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Vue consolidée archivée.', type: 'info' } });
    } catch (error) {
        console.error("Error archiving consolidated view:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const restoreConsolidatedView = async ({ dataDispatch, uiDispatch }, viewId) => {
    try {
        const { error } = await supabase
            .from('consolidated_views')
            .update({ is_archived: false })
            .eq('id', viewId);
        if (error) throw error;
        dataDispatch({ type: 'RESTORE_CONSOLIDATED_VIEW_SUCCESS', payload: viewId });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Vue consolidée restaurée.', type: 'success' } });
    } catch (error) {
        console.error("Error restoring consolidated view:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const inviteCollaborator = async ({ dataDispatch, uiDispatch }, { email, projectIds, permissions }) => {
    try {
        const { data, error } = await supabase.rpc('invite_collaborator', {
            p_invitee_email: email,
            p_project_ids: projectIds,
            p_permissions: permissions,
        });

        if (error) {
            if (error.message && error.message.includes('déjà un collaborateur')) {
                uiDispatch({ type: 'ADD_TOAST', payload: { message: error.message, type: 'info' } });
                return;
            }
            throw new Error(error.message.replace('error: ', ''));
        }

        if (data) {
            const newCollaborator = data;
            
            if (newCollaborator.status === 'accepted') {
                uiDispatch({ type: 'ADD_TOAST', payload: { message: `Accès accordé à ${email}.`, type: 'success' } });
            } else {
                uiDispatch({ type: 'ADD_TOAST', payload: { message: `Invitation en attente pour ${email}. L'accès sera accordé après son inscription.`, type: 'info' } });
            }
            
            dataDispatch({ 
                type: 'INVITE_COLLABORATOR_SUCCESS', 
                payload: { newCollaborator, newProfile: { id: newCollaborator.user_id, email: newCollaborator.email, full_name: 'Nouvel Utilisateur' } } 
            });
        }

    } catch (error) {
        console.error("Error inviting collaborator:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const revokeCollaborator = async ({ dataDispatch, uiDispatch }, collaboratorId) => {
    try {
        const { error } = await supabase.from('collaborators').delete().eq('id', collaboratorId);
        if (error) throw error;
        dataDispatch({ type: 'REVOKE_COLLABORATOR_SUCCESS', payload: collaboratorId });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Accès révoqué.', type: 'info' } });
    } catch (error) {
        console.error("Error revoking collaborator access:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

const SCENARIO_COLORS = ['#8b5cf6', '#f97316', '#d946ef'];

export const saveScenario = async ({ dataDispatch, uiDispatch }, { scenarioData, editingScenario, activeProjectId, user, existingScenariosCount }) => {
    try {
        if (activeProjectId === 'consolidated' || activeProjectId.startsWith('consolidated_view_')) {
            throw new Error("Les scénarios ne peuvent être créés que sur des projets individuels.");
        }
        let savedScenario;
        if (editingScenario) {
            const dataToUpdate = {
                name: scenarioData.name,
                description: scenarioData.description,
            };
            const { data, error } = await supabase
                .from('scenarios')
                .update(dataToUpdate)
                .eq('id', editingScenario.id)
                .select()
                .single();
            if (error) throw error;
            savedScenario = data;
            dataDispatch({ type: 'UPDATE_SCENARIO_SUCCESS', payload: {
                id: savedScenario.id,
                projectId: savedScenario.project_id,
                name: savedScenario.name,
                description: savedScenario.description,
                color: savedScenario.color,
                isVisible: savedScenario.is_visible,
                isArchived: savedScenario.is_archived
            }});
            uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Scénario mis à jour.', type: 'success' } });
        } else {
            const dataToInsert = {
                project_id: activeProjectId,
                user_id: user.id,
                name: scenarioData.name,
                description: scenarioData.description,
                color: SCENARIO_COLORS[existingScenariosCount % SCENARIO_COLORS.length],
                is_visible: true,
            };
            const { data, error } = await supabase
                .from('scenarios')
                .insert(dataToInsert)
                .select()
                .single();
            if (error) throw error;
            savedScenario = data;
            dataDispatch({ type: 'ADD_SCENARIO_SUCCESS', payload: {
                id: savedScenario.id,
                projectId: savedScenario.project_id,
                name: savedScenario.name,
                description: savedScenario.description,
                color: savedScenario.color,
                isVisible: savedScenario.is_visible,
                isArchived: savedScenario.is_archived
            }});
            uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Scénario créé.', type: 'success' } });
        }
    } catch (error) {
        console.error("Error saving scenario:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const deleteScenario = async ({dataDispatch, uiDispatch}, scenarioId) => {
    try {
        const { error } = await supabase.from('scenarios').delete().eq('id', scenarioId);
        if (error) throw error;
        dataDispatch({ type: 'DELETE_SCENARIO', payload: scenarioId });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Scénario supprimé.', type: 'success' } });
    } catch (error) {
        console.error("Error deleting scenario:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const deleteScenarioEntry = async ({ dataDispatch, uiDispatch }, { scenarioId, entryId }) => {
    try {
        const { error } = await supabase
            .from('scenario_entries')
            .upsert({ scenario_id: scenarioId, id: entryId, is_deleted: true }, { onConflict: 'scenario_id,id' });
        if (error) throw error;
        dataDispatch({ type: 'DELETE_SCENARIO_ENTRY_SUCCESS', payload: { scenarioId, entryId } });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Modification supprimée du scénario.', type: 'success' } });
    } catch (error) {
        console.error("Error deleting scenario entry:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const saveTemplate = async ({dataDispatch, uiDispatch}, { templateData, editingTemplate, projectStructure, user }) => {
    try {
        const dataToSave = {
            ...templateData,
            user_id: user.id,
            structure: projectStructure,
        };
        let savedTemplate;
        if (editingTemplate) {
            const { data, error } = await supabase
                .from('templates')
                .update(dataToSave)
                .eq('id', editingTemplate.id)
                .select()
                .single();
            if (error) throw error;
            savedTemplate = data;
            dataDispatch({ type: 'UPDATE_TEMPLATE_SUCCESS', payload: savedTemplate });
            uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Modèle mis à jour.', type: 'success' } });
        } else {
            const { data, error } = await supabase
                .from('templates')
                .insert(dataToSave)
                .select()
                .single();
            if (error) throw error;
            savedTemplate = data;
            dataDispatch({ type: 'ADD_TEMPLATE_SUCCESS', payload: savedTemplate });
            uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Modèle créé.', type: 'success' } });
        }
        uiDispatch({ type: 'CLOSE_SAVE_TEMPLATE_MODAL' });
    } catch (error) {
        console.error("Error saving template:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const deleteTemplate = async ({dataDispatch, uiDispatch}, templateId) => {
    try {
        const { error } = await supabase.from('templates').delete().eq('id', templateId);
        if (error) throw error;
        dataDispatch({ type: 'DELETE_TEMPLATE_SUCCESS', payload: templateId });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Modèle supprimé.', type: 'success' } });
    } catch (error) {
        console.error("Error deleting template:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const saveMainCategory = async ({dataDispatch, uiDispatch}, { type, name, user }) => {
    try {
        const { data, error } = await supabase
            .from('user_categories')
            .insert({ user_id: user.id, name, type, is_fixed: false })
            .select()
            .single();
        if (error) throw error;

        const newCategory = { id: data.id, name: data.name, isFixed: data.is_fixed, subCategories: [] };
        dataDispatch({ type: 'ADD_MAIN_CATEGORY_SUCCESS', payload: { type, newCategory } });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Catégorie principale créée.', type: 'success' } });
        return newCategory;
    } catch (error) {
        console.error("Error saving main category:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
        return null;
    }
};

export const saveSubCategory = async ({dataDispatch, uiDispatch}, { type, mainCategoryId, subCategoryName, user, categories }) => {
    try {
        let parentId = mainCategoryId;
        const mainCategory = categories[type].find(c => c.id === mainCategoryId);

        if (mainCategory && mainCategory.isDefault) {
            const { data: existingUserMainCat, error: findError } = await supabase
                .from('user_categories')
                .select('id')
                .eq('user_id', user.id)
                .eq('default_id', mainCategoryId)
                .single();

            if (findError && findError.code !== 'PGRST116') throw findError;

            if (existingUserMainCat) {
                parentId = existingUserMainCat.id;
            } else {
                const { data: newMainCat, error: createError } = await supabase
                    .from('user_categories')
                    .insert({ user_id: user.id, name: mainCategory.name, type: type, is_fixed: mainCategory.isFixed, default_id: mainCategoryId })
                    .select()
                    .single();
                if (createError) throw createError;
                parentId = newMainCat.id;
                const newCatForState = { id: newMainCat.id, name: newMainCat.name, isFixed: newMainCat.is_fixed, subCategories: [] };
                dataDispatch({ type: 'ADD_MAIN_CATEGORY_SUCCESS', payload: { type, newCategory: newCatForState } });
            }
        }
        
        const { data, error } = await supabase
            .from('user_categories')
            .insert({ user_id: user.id, name: subCategoryName, type: type, parent_id: parentId, is_fixed: false })
            .select()
            .single();
        if (error) throw error;
        
        const newSubCategory = { id: data.id, name: data.name, isFixed: data.is_fixed, criticality: data.criticality || 'essential' };
        dataDispatch({ type: 'ADD_SUB_CATEGORY_SUCCESS', payload: { type, mainCategoryId: parentId, newSubCategory } });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Sous-catégorie créée.', type: 'success' } });
        return newSubCategory;
    } catch (error) {
        console.error("Error saving sub category:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
        return null;
    }
};

export const updateSubCategoryCriticality = async ({dataDispatch, uiDispatch}, { subCategoryId, newCriticality }) => {
    try {
        const { data, error } = await supabase
            .from('user_categories')
            .update({ criticality: newCriticality })
            .eq('id', subCategoryId)
            .select()
            .single();

        if (error) throw error;

        dataDispatch({ type: 'UPDATE_SUB_CATEGORY_CRITICALITY', payload: { subCategoryId: data.id, newCriticality: data.criticality, type: data.type, parentId: data.parent_id } });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Criticité mise à jour.', type: 'success' } });
    } catch (error) {
        console.error("Error updating criticality:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const saveTaxConfig = async ({dataDispatch, uiDispatch}, config) => {
    try {
        const { data, error } = await supabase
            .from('tax_configs')
            .upsert(config, { onConflict: 'id' })
            .select()
            .single();

        if (error) throw error;

        dataDispatch({ type: 'SAVE_TAX_CONFIG_SUCCESS', payload: data });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Configuration fiscale enregistrée.', type: 'success' } });
        return data;
    } catch (error) {
        console.error("Error saving tax config:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
        return null;
    }
};

export const deleteTaxConfig = async ({dataDispatch, uiDispatch}, taxId) => {
    try {
        const { error } = await supabase.from('tax_configs').delete().eq('id', taxId);
        if (error) throw error;
        dataDispatch({ type: 'DELETE_TAX_CONFIG_SUCCESS', payload: taxId });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Impôt/Taxe supprimé.', type: 'success' } });
    } catch (error) {
        console.error("Error deleting tax config:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const updateTierPaymentTerms = async ({dataDispatch, uiDispatch}, { tierId, terms }) => {
    try {
        const { data, error } = await supabase
            .from('tiers')
            .update({ payment_terms: terms })
            .eq('id', tierId)
            .select()
            .single();
        if (error) throw error;
        dataDispatch({ type: 'UPDATE_TIER_SUCCESS', payload: data });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Conditions de paiement mises à jour.', type: 'success' } });
    } catch (error) {
        console.error("Error updating payment terms:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const addComment = async ({ dataDispatch, uiDispatch }, { projectId, rowId, columnId, content, authorId }) => {
    try {
        const mentionedUsers = [];
        const mentionRegex = /@\[[^\]]+\]\(([^)]+)\)/g;
        let match;
        while ((match = mentionRegex.exec(content)) !== null) {
            mentionedUsers.push(match[1]);
        }

        const commentToInsert = {
            project_id: projectId === 'consolidated' || projectId.startsWith('consolidated_view_') ? null : projectId,
            user_id: authorId,
            row_id: rowId,
            column_id: columnId,
            content: content,
            mentioned_users: mentionedUsers.length > 0 ? mentionedUsers : null,
        };

        const { data: newComment, error } = await supabase
            .from('comments')
            .insert(commentToInsert)
            .select()
            .single();

        if (error) throw error;
        
        const commentForState = {
            id: newComment.id,
            projectId: newComment.project_id,
            userId: newComment.user_id,
            rowId: newComment.row_id,
            columnId: newComment.column_id,
            content: newComment.content,
            createdAt: newComment.created_at,
            mentionedUsers: newComment.mentioned_users,
        };

        dataDispatch({ type: 'ADD_COMMENT_SUCCESS', payload: commentForState });

    } catch (error) {
        console.error("Error adding comment:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur lors de l'ajout du commentaire: ${error.message}`, type: 'error' } });
    }
};

export const savePersonnelCharge = async ({ dataDispatch, uiDispatch }, chargeData) => {
    try {
        const { data, error } = await supabase
            .from('personnel_charges')
            .upsert(chargeData, { onConflict: 'id' })
            .select()
            .single();

        if (error) throw error;

        dataDispatch({ type: 'SAVE_PERSONNEL_CHARGE_SUCCESS', payload: data });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Charge sociale enregistrée.', type: 'success' } });
        return data;
    } catch (error) {
        console.error("Error saving personnel charge:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
        return null;
    }
};

export const deletePersonnelCharge = async ({ dataDispatch, uiDispatch }, chargeId) => {
    try {
        const { error } = await supabase.from('personnel_charges').delete().eq('id', chargeId);
        if (error) throw error;

        dataDispatch({ type: 'DELETE_PERSONNEL_CHARGE_SUCCESS', payload: chargeId });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Charge sociale supprimée.', type: 'success' } });
    } catch (error) {
        console.error("Error deleting personnel charge:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};
