import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AmbassadorIcon from './AmbassadorIcon';

const AmbassadorWidget = () => {
    const navigate = useNavigate();

    const handleNavigate = () => {
        navigate('/app/parrainage');
    };

    return (
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 rounded-lg shadow-lg text-white">
            <div className="flex items-start gap-4">
                <div className="bg-white/20 p-3 rounded-full">
                    <AmbassadorIcon className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold">Devenez Ambassadeur</h2>
                    <p className="text-sm mt-1 opacity-90">
                        Vous aimez Trezocash ? Partagez-le avec votre réseau et soyez récompensé pour chaque nouvel utilisateur !
                    </p>
                </div>
            </div>
            <button
                onClick={handleNavigate}
                className="w-full mt-6 bg-white/90 hover:bg-white text-indigo-600 font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200"
            >
                Découvrir le programme
                <ArrowRight className="w-4 h-4" />
            </button>
        </div>
    );
};

export default AmbassadorWidget;
