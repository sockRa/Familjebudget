import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from './index.js';

describe('Security Middleware', () => {
    it('should set security headers', async () => {
        const res = await request(app).get('/api/health');

        expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });

    it('should remove sensitive headers', async () => {
        const res = await request(app).get('/api/health');

        expect(res.headers['x-powered-by']).toBeUndefined();
    });

    describe('CORS', () => {
        it('should allow requests from allowed origin', async () => {
            const res = await request(app)
                .get('/api/health')
                .set('Origin', 'http://localhost:5173');

            expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
        });

        it('should NOT allow requests from disallowed origin', async () => {
            const res = await request(app)
                .get('/api/health')
                .set('Origin', 'http://evil.com');

            // Default cors() reflects the origin, so this would currently be 'http://evil.com'
            // We want it to be undefined or not matching
            expect(res.headers['access-control-allow-origin']).toBeUndefined();
        });
    });
});
