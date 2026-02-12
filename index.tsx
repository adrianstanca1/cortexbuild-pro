import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';
import './src/index.css'; // Tailwind CSS
import './styles.css';
import './src/monitoring/sentry';
import './src/utils/apiErrorHandler';
// import './src/pwa';

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error('Could not find root element to mount to');
}

import ErrorBoundary from './src/components/ErrorBoundary';

const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>
);
