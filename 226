import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import TaxList from '../components/TaxList';

const TaxManagementPage = () => {
    const navigate = useNavigate();

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8 flex justify-end">
                <button
                    onClick={() => navigate('/app/fiscalite/new')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Créer un impôt
                </button>
            </div>
            <TaxList />
        </div>
    );
};

export default TaxManagementPage;
