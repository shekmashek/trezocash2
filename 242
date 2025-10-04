import React from 'react';
import { BookOpen, Receipt } from 'lucide-react';
import BudgetJournal from '../components/BudgetJournal';
import PaymentJournal from '../components/PaymentJournal';
import { useUI } from '../context/UIContext';

const JournalsView = ({ type = 'budget' }) => {
  const { uiDispatch } = useUI();

  const handleEditEntry = (entry) => {
    uiDispatch({ type: 'OPEN_BUDGET_MODAL', payload: entry });
  };

  const config = {
    budget: {
      component: <BudgetJournal onEditEntry={handleEditEntry} />,
    },
    payment: {
      component: <PaymentJournal />,
    }
  };
  const currentConfig = config[type];

  return (
    <div className="p-6 max-w-full">
      <div>
        {currentConfig.component}
      </div>
    </div>
  );
};

export default JournalsView;
