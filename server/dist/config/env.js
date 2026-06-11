import dotenv from 'dotenv';
dotenv.config();
function parsePort(value) {
    const port = Number(value ?? 4000);
    if (!Number.isInteger(port) || port <= 0) {
        throw new Error('PORT must be a positive integer.');
    }
    return port;
}
export const env = {
    NODE_ENV: process.env['NODE_ENV'] ?? 'development',
    PORT: parsePort(process.env['PORT']),
    API_PREFIX: process.env['API_PREFIX'] ?? '/api',
    CLIENT_URL: process.env['CLIENT_URL'] ?? 'http://localhost:4200',
};
