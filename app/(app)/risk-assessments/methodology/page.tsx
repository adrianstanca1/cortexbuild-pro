import React from 'react';

const MethodologyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Risk Assessment Methodology
          </h1>
          <p className="text-gray-500 mb-8">
            Coming Soon
          </p>
          <p className="text-gray-600">
            This section will outline our comprehensive risk assessment methodology, including risk identification techniques, analysis frameworks, and mitigation strategies specific to construction projects.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MethodologyPage;