import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import { errorHandlerMiddleware } from './common/middlewares/error-handler.middleware.js';
import { notFoundMiddleware } from './common/middlewares/not-found.middleware.js';
import { apiRouter } from './routes/index.js';

export const app = express();

app.use(helmet());

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json());

app.use(env.API_PREFIX, apiRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);
