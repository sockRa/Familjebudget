import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // Run tests sequentially to avoid SQLite database conflicts
        pool: 'forks',
        poolOptions: {
            forks: {
                singleFork: true,
            },
        },
        // Ensure each test file runs in isolation
        isolate: true,
        // Set a reasonable timeout
        testTimeout: 10000,
    },
});
