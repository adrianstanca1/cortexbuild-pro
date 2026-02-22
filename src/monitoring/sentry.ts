import * as Sentry from "@sentry/react";

if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.MODE || 'development',
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration(),
        ],
        // Tracing
        tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
        //Session Replay
        replaysSessionSampleRate: 0.1, // Sample 10% of sessions
        replaysOnErrorSampleRate: 1.0, // Sample 100% of sessions with errors

        // Filter out expected errors
        beforeSend(event, hint) {
            const error = hint.originalException;

            // Don't send expected authentication/authorization errors
            if (error instanceof Error) {
                const message = error.message.toLowerCase();
                if (
                    message.includes('401') ||
                    message.includes('403') ||
                    message.includes('unauthorized') ||
                    message.includes('forbidden')
                ) {
                    console.log('Sentry: Filtered expected auth error:', message);
                    return null;
                }
            }

            // Send all other errors
            return event;
        },

        // Ignore certain errors
        ignoreErrors: [
            // Browser extensions
            'top.GLOBALS',
            // Random plugins/extensions
            'originalCreateNotification',
            'canvas.contentDocument',
            'MyApp_RemoveAllHighlights',
            // Facebook errors
            'fb_xd_fragment',
        ],
    });

    console.log(`Sentry initialized for ${import.meta.env.MODE} environment`);
} else {
    console.warn('Sentry DSN not found. Error tracking disabled.');
}
