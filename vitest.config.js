import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config'

export default defineWorkersConfig({
  test: {
    pool: '@cloudflare/vitest-pool-workers',
    include: ['tests/**/*.test.js'],
    poolOptions: {
      workers: {
        main: './src/worker.js',
        miniflare: {
          kvNamespaces: ['SIGYL_KV'],
          bindings: {
            MIRROR_DOMAIN: 'sigyl.test',
            ADMIN_TOKEN: 'test-token',
            ADMIN_EMAIL: 'test@test.com'
          },
          compatibilityDate: '2024-01-01',
          compatibilityFlags: ['nodejs_compat']
        }
      }
    }
  }
})
