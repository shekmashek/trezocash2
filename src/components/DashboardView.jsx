import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { formatCurrency } from '../utils/formatting';
import { Wallet, TrendingDown, HandCoins, ArrowUp, ArrowDown, BookOpen, Lock, PiggyBank, Banknote, Coins, ListChecks, Calendar, PieChart, Layers, Table, AlertTriangle } from 'lucide-react';
import { useActiveProjectData, useDashboardKpis, useTrezoScore, useDailyForecast, useLoanSummary } from '../utils/selectors.jsx';
import TrezoScoreWidget from './TrezoScoreWidget';
import CurrentMonthBudgetWidget from './CurrentMonthBudgetWidget';
import ThirtyDayForecastWidget from './ThirtyDayForecastWidget';
import LoansSummaryWidget from './LoansSummaryWidget';
import { useNavigate } from 'react-router-dom';
import ActionCard from './ActionCard';
import IntelligentAlertWidget from './IntelligentAlertWidget';
import WidgetIcon from './WidgetIcon';
import AmbassadorWidget from './AmbassadorWidget';

const defaultWidgetSettings = {
    kpi_actionable_balance: true,
    kpi_overdue_payables: true,
    kpi_overdue_receivables: true,
    kpi_savings: true,
    kpi_provisions: true,
    kpi_borrowings: true,
    kpi_lendings: true,
    alerts: true,
    priorities: true,
    trezo_score: true,
    '30_day_forecast': true,
    monthly_budget: true,
    loans: true,
    ambassador_promo: true,
    actions: true,
    tutorials: true,
};

const DashboardView = () => {
  const { dataState } = useData();
  const { uiState, uiDispatch } = useUI();
  const { settings, projects, profile } = dataState;
  const navigate = useNavigate();
  
  const { activeProject, isConsolidated } = useActiveProjectData(dataState, uiState);
  const { totalActionableBalance, totalOverduePayables, totalOverdueReceivables, overdueItems, totalSavings, totalProvisions, totalBorrowings, totalLendings } = useDashboardKpis(dataState, uiState);
  const trezoScoreData = useTrezoScore(dataState, uiState);
  const dailyForecastData = useDailyForecast(dataState, uiState, 30);
  const { borrowings, lendings } = useLoanSummary(dataState, uiState);

  const widgetVisibility = { ...defaultWidgetSettings, ...(activeProject?.dashboard_widgets || {}) };

  const handleOpenSettings = () => {
    uiDispatch({ type: 'OPEN_CUSTOMIZATION_DRAWER', payload: 'dashboard' });
  };

  const currencySettings = {
    currency: activeProject?.currency || settings.currency,
    displayUnit: activeProject?.display_unit || settings.displayUnit,
    decimalPlaces: activeProject?.decimal_places ?? settings.decimalPlaces
  };

  const handleActionClick = (e, item) => {
    uiDispatch({ type: 'OPEN_TRANSACTION_ACTION_MENU', payload: { x: e.clientX, y: e.clientY, transaction: item } });
  };
  
  const greetingMessage = () => {
    const hour = new Date().getHours();
    const name = profile?.fullName?.split(' ')[0] || 'Utilisateur';
    if (hour < 12) return `Bonjour ${name}`;
    if (hour < 18) return `Bon après-midi ${name}`;
    return `Bonsoir ${name}`;
  }

  const actions = [
    { icon: ListChecks, title: "Saisir votre budget", description: "Définissez vos entrées et sorties prévisionnelles.", path: "/app/budget", colorClass: "border-blue-200 hover:border-blue-400", iconColorClass: "text-blue-600" },
    { icon: Table, title: "Voir votre trézo", description: "Voyez la projection de vos entrées et sorties ventilées par mois de cette année.", path: "/app/trezo", colorClass: "border-pink-200 hover:border-pink-400", iconColorClass: "text-pink-600" },
    { icon: Calendar, title: "Gérer l'échéancier", description: "Suivez et enregistrez vos paiements et encaissements réels.", path: "/app/echeancier", colorClass: "border-green-200 hover:border-green-400", iconColorClass: "text-green-600" },
    { icon: PieChart, title: "Analyser vos flux", description: "Comprenez la répartition de vos dépenses et revenus.", path: "/app/analyse", colorClass: "border-yellow-200 hover:border-yellow-400", iconColorClass: "text-yellow-600" },
    { icon: Layers, title: "Ajouter des simulations", description: "Anticipez l'impact de vos décisions avec les scénarios.", path: "/app/scenarios", colorClass: "border-purple-200 hover:border-purple-400", iconColorClass: "text-purple-600" },
    { icon: Wallet, title: "Ajuster vos comptes", description: "Consultez et mettez à jour vos soldes de trésorerie.", path: "/app/comptes", colorClass: "border-teal-200 hover:border-teal-400", iconColorClass: "text-teal-600" }
  ];

  const tutorials = [
    { id: 'L_jWHffIx5E', title: 'Prise en main de Trezocash' }, { id: '3qHkcs3kG44', title: 'Créer votre premier projet' },
    { id: 'g_t-s23-4U4', title: 'Maîtriser le tableau de trésorerie' }, { id: 'm_u6m3-L0gA', title: 'Utiliser les scénarios pour anticiper' },
    { id: 'a_p5-VvF-sI', title: 'Analyser vos dépenses efficacement' }, { id: 'k-rN9t_g-iA', title: 'Gérer vos comptes de trésorerie' },
    { id: 'r6-p_c-3_sI', title: 'Collaborer en équipe sur un projet' }, { id: 's_k9-t_g-iA', title: 'Comprendre l\'échéancier' },
    { id: 't_g-iA_r6-p', title: 'Créer et utiliser des modèles' }, { id: 'u_sI-k-rN9t', title: 'Gérer les fonds à provisionner' },
    { id: 'v_m3-L0gA_a', title: 'Consolider plusieurs projets' }, { id: 'w_4U4-s23-g', title: 'Personnaliser vos catégories' },
    { id: 'x_g-iA_k-rN', title: 'Suivre vos dettes et prêts' }, { id: 'y_p5-VvF-sI', title: 'Astuces pour le mode "État des lieux"' },
    { id: 'z_L0gA_m_u6', title: 'Paramètres avancés et personnalisation' }, { id: 'A_k-rN9t_g-iA', title: 'Comprendre l\'analyse des soldes' }
  ];

  const kpiCards = [
    { id: 'kpi_actionable_balance', icon: Wallet, color: 'green', label: 'Trésorerie Actionnable', value: totalActionableBalance, textColor: 'text-gray-800' },
    { id: 'kpi_overdue_payables', icon: TrendingDown, color: 'red', label: 'Dettes en Retard', value: totalOverduePayables, textColor: 'text-red-600' },
    { id: 'kpi_overdue_receivables', icon: HandCoins, color: 'yellow', label: 'Créances en Retard', value: totalOverdueReceivables, textColor: 'text-yellow-600' },
    { id: 'kpi_savings', icon: PiggyBank, color: 'teal', label: 'Épargne', value: totalSavings, textColor: 'text-gray-800' },
    { id: 'kpi_provisions', icon: Lock, color: 'indigo', label: 'Provisions', value: totalProvisions, textColor: 'text-gray-800' },
    { id: 'kpi_borrowings', icon: Banknote, color: 'red', label: 'Emprunts à rembourser', value: totalBorrowings, textColor: 'text-gray-800' },
    { id: 'kpi_lendings', icon: Coins, color: 'green', label: 'Prêts à recevoir', value: totalLendings, textColor: 'text-gray-800' },
  ];

  return (
    <>
      <div className="p-6 max-w-full space-y-8">
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-semibold text-gray-800">{greetingMessage()} !</h2>
                <p className="text-gray-500">Voici un aperçu de votre situation.</p>
            </div>
            {!isConsolidated && (
                <button
                    onClick={handleOpenSettings}
                    className="p-2 text-gray-600 bg-white border rounded-lg hover:bg-gray-100 transition-colors"
                    title="Personnaliser le tableau de bord"
                >
                    <WidgetIcon className="w-5 h-5" />
                </button>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {kpiCards.map(kpi => widgetVisibility[kpi.id] && (
                <div key={kpi.id} className="bg-white p-6 rounded-lg shadow-sm border flex items-start gap-4">
                    <div className={`bg-${kpi.color}-100 p-3 rounded-full`}>
                        <kpi.icon className={`w-6 h-6 text-${kpi.color}-600`} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">{kpi.label}</p>
                        <p className={`text-2xl font-bold ${kpi.textColor}`}>{formatCurrency(kpi.value, settings)}</p>
                    </div>
                </div>
            ))}
        </div>

        {widgetVisibility.alerts && <IntelligentAlertWidget forecastData={dailyForecastData} />}

        {widgetVisibility.actions && (
          <div className="pt-4">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Que voulez-vous faire maintenant ?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                {actions.map(action => (<ActionCard key={action.title} {...action} onClick={() => navigate(action.path)} />))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
              {widgetVisibility.trezo_score && <TrezoScoreWidget scoreData={trezoScoreData} />}
              {widgetVisibility['30_day_forecast'] && <ThirtyDayForecastWidget forecastData={dailyForecastData} />}
              {widgetVisibility.loans && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <LoansSummaryWidget title="Mes Emprunts" icon={Banknote} loans={borrowings} currencySettings={currencySettings} type="borrowing" />
                      <LoansSummaryWidget title="Mes Prêts Accordés" icon={Coins} loans={lendings} currencySettings={currencySettings} type="lending" />
                  </div>
              )}
          </div>
          <div className="space-y-8">
              {widgetVisibility.monthly_budget && <CurrentMonthBudgetWidget />}
              {widgetVisibility.ambassador_promo && <AmbassadorWidget />}
              {widgetVisibility.priorities && (
                  <div className="bg-white p-6 rounded-lg shadow-sm border flex flex-col">
                      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2 flex-shrink-0"><AlertTriangle className="w-5 h-5 text-yellow-500" />Actions Prioritaires</h2>
                      {overdueItems.length > 0 ? (
                          <div className="space-y-3 overflow-y-auto custom-scrollbar">
                              {overdueItems.map(item => {
                                  const project = isConsolidated ? projects.find(p => p.id === item.projectId) : null;
                                  return (
                                      <button key={item.id} onClick={(e) => handleActionClick(e, item)} className="w-full text-left p-2 rounded-lg border border-gray-200 bg-white transition-colors hover:bg-gray-50">
                                          <div className="flex justify-between items-center"><div className="flex items-center gap-3"><div className={`flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full ${item.type === 'payable' ? 'bg-red-100' : 'bg-green-100'}`}>{item.type === 'payable' ? <ArrowDown className="w-4 h-4 text-red-600" /> : <ArrowUp className="w-4 h-4 text-green-600" />}</div><div className="overflow-hidden"><p className="font-semibold truncate text-gray-800" title={item.thirdParty}>{item.thirdParty}{isConsolidated && project && <span className="text-xs font-normal text-gray-500 ml-1">({project.name})</span>}</p><div className="text-xs text-gray-500 flex items-center gap-1.5"><span>{new Date(item.date).toLocaleDateString('fr-FR')}</span><span className="text-gray-500">({Math.floor((new Date() - new Date(item.date)) / (1000 * 60 * 60 * 24))}j en retard)</span></div></div></div><p className="text-base font-normal whitespace-nowrap pl-2 text-gray-600">{formatCurrency(item.remainingAmount, settings)}</p></div>
                                      </button>
                                  )
                              })}
                          </div>
                      ) : (
                          <div className="h-full flex items-center justify-center"><div className="text-center text-gray-500 py-10"><p>Aucune action prioritaire. Tout est à jour !</p></div></div>
                      )}
                  </div>
              )}
          </div>
        </div>

        {widgetVisibility.tutorials && (
            <section id="tutoriels" className="pt-8">
                <div className="text-left mb-8"><h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3"><BookOpen className="w-6 h-6 text-blue-600" />Tutoriels Vidéo</h2><p className="mt-2 text-gray-600">Apprenez à maîtriser Trezocash avec nos guides pas à pas.</p></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {tutorials.map((video) => (<div key={video.id} className="bg-white rounded-lg shadow-sm border overflow-hidden group"><div className="w-full h-40 bg-black flex items-center justify-center"><iframe className="w-full h-full" src={`https://www.youtube.com/embed/${video.id}`} title={video.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe></div><div className="p-4"><h4 className="font-semibold text-sm text-gray-800 truncate group-hover:text-blue-600 transition-colors">{video.title}</h4></div></div>))}
                </div>
            </section>
        )}
      </div>
    </>
  );
};

export default DashboardView;
