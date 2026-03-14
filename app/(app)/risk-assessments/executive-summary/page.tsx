import React from 'react';

const ExecutiveSummaryPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Executive Summary
          </h1>
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Executive Risk Summary
            </h2>
            <p className="text-gray-500 mb-6">
              Coming Soon
            </p>
            <p className="text-gray-600">
              Generate executive-level risk summaries tailored for stakeholders, including key risk indicators, trend analysis, and risk-adjusted project forecasts. Customizable reporting formats for different audience types.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSummaryPage;