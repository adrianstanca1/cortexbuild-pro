import React from 'react';
import { Screen, User, PermissionAction, PermissionSubject } from '../../../types';
import { ChevronLeftIcon } from '../../Icons';
import { CISCalculator } from '../../dashboard/CISCalculator';

interface CISCalculatorScreenProps {
    currentUser: User;
    navigateTo: (screen: Screen, params?: any) => void;
    goBack: () => void;
    can: (action: PermissionAction, subject: PermissionSubject) => boolean;
}

const CISCalculatorScreen: React.FC<CISCalculatorScreenProps> = ({ currentUser, goBack }) => {
    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto">
            <header className="bg-white p-4 flex items-center border-b mb-8">
                <button onClick={goBack} className="mr-4 p-2 rounded-full hover:bg-gray-100">
                    <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">CIS Calculator</h1>
                    <p className="text-sm text-gray-500">Calculate CIS deductions and retention for subcontractor payments.</p>
                </div>
            </header>
            <main className="flex-grow">
                <CISCalculator />
            </main>
        </div>
    );
};

export default CISCalculatorScreen;
