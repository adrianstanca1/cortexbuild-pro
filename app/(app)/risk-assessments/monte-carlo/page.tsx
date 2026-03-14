import React from 'react';

const MonteCarloPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Monte Carlo Simulation
          </h1>
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Advanced Risk Modeling
            </h2>
            <p className="text-gray-500 mb-6">
              Coming Soon
            </p>
            <p className="text-gray-600">
              Perform sophisticated risk analysis using Monte Carlo simulation to model uncertainty and predict outcomes. Generate probability distributions for project costs, schedules, and success rates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonteCarloPage;