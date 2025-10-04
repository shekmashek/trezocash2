import React from 'react';
import { ArrowRight } from 'lucide-react';

const ActionCard = ({ icon: Icon, title, description, onClick, colorClass, iconColorClass }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full h-full text-left bg-white p-6 rounded-lg shadow-sm border hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group ${colorClass}`}
    >
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-lg ${iconColorClass.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Icon className={`w-6 h-6 ${iconColorClass}`} />
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />
      </div>
      <h3 className="mt-4 font-bold text-gray-800 text-lg">{title}</h3>
      <p className="mt-1 text-sm text-gray-600">{description}</p>
    </button>
  );
};

export default ActionCard;
