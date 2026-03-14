import React from 'react';

const MitigationPlanningPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Mitigation Planning
          </h1>
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Risk Mitigation & Response Planning
            </h2>
            <p className="text-gray-500 mb-6">
              Coming Soon
            </p>
            <p className="text-gray-600">
              Develop and track risk mitigation strategies, assign risk owners, establish contingency plans, and monitor the effectiveness of risk response actions throughout the project lifecycle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MitigationPlanningPage;