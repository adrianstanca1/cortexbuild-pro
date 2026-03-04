import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
    onNeedRefresh() {
        // Show a subtle notification on iOS
        if ('serviceWorker' in navigator) {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #2563eb;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 99999;
                font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 12px;
            `;
            notification.innerHTML = `
                <span>🔄 Content nou disponibil!</span>
                <button onclick="location.reload()" style="
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 13px;
                ">Reîncarcă</button>
            `;
            document.body.appendChild(notification);
            
            // Auto-dismiss after 10 seconds
            setTimeout(() => {
                notification.remove();
            }, 10000);
        }
    },
    onOfflineReady() {
        console.log('✅ App ready to work offline');
        // Show offline indicator
        const offlineIndicator = document.createElement('div');
        offlineIndicator.id = 'offline-indicator';
        offlineIndicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #fbbf24;
            color: #92400e;
            padding: 8px 16px;
            border-radius: 6px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            z-index: 99999;
            font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
            font-size: 13px;
            display: none;
        `;
        offlineIndicator.innerHTML = '📴 Offline';
        document.body.appendChild(offlineIndicator);
    },
    onOffline() {
        const indicator = document.getElementById('offline-indicator');
        if (indicator) indicator.style.display = 'block';
    },
    onOnline() {
        const indicator = document.getElementById('offline-indicator');
        if (indicator) indicator.style.display = 'none';
    }
});

// Register service worker for iOS
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('✅ SW registered:', registration.scope);
            })
            .catch(error => {
                console.log('❌ SW registration failed:', error);
            });
    });
}
