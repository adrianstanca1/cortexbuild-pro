import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react()
    ],
    define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@/components': path.resolve(__dirname, './src/components'),
            '@/contexts': path.resolve(__dirname, './src/contexts'),
            '@/services': path.resolve(__dirname, './src/services'),
            '@/utils': path.resolve(__dirname, './src/utils'),
            '@/hooks': path.resolve(__dirname, './src/hooks'),
            '@/types': path.resolve(__dirname, './src/types'),
            '@/views': path.resolve(__dirname, './src/views'),
            '@/assets': path.resolve(__dirname, './src/assets')
        }
    },
    server: {
        host: true,
        port: 3000,
        proxy: {
            '/api': {
                target: 'https://api.cortexbuildpro.com',
                changeOrigin: true,
                secure: true
            },
            '/socket.io': {
                target: 'https://api.cortexbuildpro.com',
                changeOrigin: true,
                secure: true,
                ws: true
            }
        }
    },
    preview: {
        host: '0.0.0.0',
        port: 3000,
        proxy: {
            '/api': {
                target: 'https://api.cortexbuildpro.com',
                changeOrigin: true,
                secure: true
            },
            '/socket.io': {
                target: 'https://api.cortexbuildpro.com',
                changeOrigin: true,
                secure: true,
                ws: true
            }
        }
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    utils: ['date-fns']
                }
            }
        },
        chunkSizeWarningLimit: 2000
    }
});
