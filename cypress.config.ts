import { defineConfig } from 'cypress';

export default defineConfig({
  downloadsFolder: 'tmp/cypress-downloads',
  e2e: {
    baseUrl: 'http://localhost:4200',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    setupNodeEvents(on) {
      on('task', {
        sessionCheckpoint(elapsedMs: number) {
          console.log(`Session soak checkpoint: ${elapsedMs} ms`);
          return null;
        },
      });
    },
  },
});
