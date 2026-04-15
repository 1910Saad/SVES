const request = require('supertest');
const { app, server } = require('../src/server');

describe('SVES Backend API', () => {
    // Gracefully close server after tests
    afterAll(done => {
        server.close(done);
    });

    test('GET /api/health should return 200 and healthy status', async () => {
        const response = await request(app).get('/api/health');
        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe('healthy');
    });

    test('GET /api/venues should return a list of venues', async () => {
        const response = await request(app).get('/api/venues');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test('CORS headers should be present', async () => {
        const response = await request(app).get('/api/health');
        expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    test('Security headers (Helmet) should be present', async () => {
        const response = await request(app).get('/api/health');
        expect(response.headers['x-content-type-options']).toBe('nosniff');
        expect(response.headers['x-dns-prefetch-control']).toBe('off');
    });
});
