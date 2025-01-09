//import { defineConfig } from 'cypress'

module.exports = {
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.{ts,tsx}',
    supportFile:false,
    setupNodeEvents(on, config) {
      // Implement node event listeners here
    },
  },
}