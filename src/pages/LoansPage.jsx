import React from 'react';
import LoansView from '../components/LoansView';
import { Banknote, Coins } from 'lucide-react';

const LoansPage = () => {
    return (
        <div className="p-6 max-w-full">
            <div className="space-y-12">
                <section>
                    <LoansView type="borrowing" />
                </section>
                <section>
                    <LoansView type="lending" />
                </section>
            </div>
        </div>
    );
};

export default LoansPage;
