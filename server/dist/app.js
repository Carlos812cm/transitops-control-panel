import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { sendError, sendSuccess } from './common/responses/api-response.js';
export const app = express();
app.use(helmet());
app.use(cors({
    origin: env.CLIENT_URL,
    credentials: true,
}));
app.use(express.json());
app.get(`${env.API_PREFIX}/health`, (_request, response) => {
    return sendSuccess(response, 'TransitOps real API is running.', {
        service: 'transitops-api',
        environment: env.NODE_ENV,
        uptimeSeconds: Math.floor(process.uptime()),
    });
});
app.use(env.API_PREFIX, (_request, response) => {
    return sendError(response, 404, 'Endpoint not found.');
});
