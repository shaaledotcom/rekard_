import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Global timeout for each test (30 seconds for API calls)
    testTimeout: 30000,
    
    // Hook timeout
    hookTimeout: 30000,
    
    // Include patterns
    include: ['integration/**/*.test.ts', 'integration/**/*.spec.ts'],
    
    // Exclude patterns
    exclude: ['node_modules', 'dist'],
    
    // Environment
    environment: 'node',
    
    // Globals (describe, it, expect available without imports)
    globals: true,
    
    // Reporter
    reporters: ['verbose'],
    
    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', 'dist', '**/*.d.ts'],
    },
    
    // Sequence - run tests in order for integration tests
    sequence: {
      shuffle: false,
    },
    
    // Pool options
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Run tests sequentially to avoid race conditions
      },
    },
    
    // Environment variables
    env: {
      API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:9999/v1',
      TEST_AUTH_TOKEN: process.env.TEST_AUTH_TOKEN || '',
      TEST_SESSION_COOKIES: process.env.TEST_SESSION_COOKIES || '',
    },
  },
});

