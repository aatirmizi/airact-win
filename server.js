import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApiRouter, setupWebSocketServer } from './server/routes.js';
import { defaultEngine } from './server/engine.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function startServer() {
    const app = express();
    app.set('trust proxy', true);
    const server = createServer(app);
    const PORT = process.env.PORT || 3000;
    // JSON and URL-encoded body parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    // Attach REST API routes
    app.use('/api', createApiRouter(defaultEngine));
    // Attach WebSocket server (/ws/p, /ws/projector, /ws/facilitator)
    setupWebSocketServer(server, defaultEngine);
    // Vite middleware in dev or static in prod
    if (process.env.NODE_ENV !== 'production') {
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({
            server: {
                middlewareMode: true,
                hmr: process.env.DISABLE_HMR !== 'true',
            },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    }
    else {
        app.use(express.static(path.resolve(__dirname, 'dist')));
        app.get('*', (_req, res) => {
            res.sendFile(path.resolve(__dirname, 'dist/index.html'));
        });
    }
    server.listen(Number(PORT), '0.0.0.0', () => {
        console.log(`PulseVote server running at http://0.0.0.0:${PORT}`);
    });
}
startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
