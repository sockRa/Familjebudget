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
});
