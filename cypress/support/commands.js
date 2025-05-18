// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command for login
Cypress.Commands.add('login', (email, password) => {
    cy.session([email, password], () => {
        cy.visit('/users/login');
        cy.get('input[name="email"]').type(email);
        cy.get('input[name="password"]').type(password);
        cy.get('button[type="submit"]').click();
        cy.url().should('include', '/dashboard');
    });
});

// Custom command for register
Cypress.Commands.add('register', (firstName, lastName, email, password) => {
    cy.visit('/users/register');
    cy.get('input[name="firstName"]').clear().type(firstName);
    cy.get('input[name="lastName"]').clear().type(lastName);
    cy.get('input[name="email"]').clear().type(email);
    cy.get('input[name="password"]').clear().type(password);
    cy.get('input[name="confirmPassword"]').clear().type(password);
    cy.get('input[name="terms"]').check();
    cy.get('button[type="submit"]').click();
    
    // Add a small delay to allow for server response
    cy.wait(1000);
    
    // Check for both success and error cases
    cy.url().then((url) => {
        if (url.includes('/users/login')) {
            // Success case - should be redirected to login
            cy.get('.card-panel.green').should('exist');
        } else if (url.includes('/users/register')) {
            // Still on register page - might have validation errors
            cy.get('.card-panel.red').then(($el) => {
                if ($el.length) {
                    throw new Error(`Registration failed: ${$el.text()}`);
                }
            });
        }
    });
}); 