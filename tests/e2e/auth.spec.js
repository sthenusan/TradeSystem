describe('Authentication', () => {
    beforeEach(() => {
        cy.visit('/');
    });

    it('should navigate to login page', () => {
        cy.get('a[href="/users/login"]').click();
        cy.url().should('include', '/users/login');
        cy.get('h1').should('contain', 'Login');
    });

    it('should navigate to register page', () => {
        cy.get('a[href="/users/register"]').click();
        cy.url().should('include', '/users/register');
        cy.get('h1').should('contain', 'Register');
    });

    it('should register a new user', () => {
        cy.visit('/users/register');

        cy.get('input[name="name"]').type('Test User');
        cy.get('input[name="email"]').type('test@example.com');
        cy.get('input[name="password"]').type('password123');
        cy.get('input[name="password2"]').type('password123');

        cy.get('button[type="submit"]').click();

        cy.url().should('include', '/users/login');
        cy.get('.alert-success').should('contain', 'You are now registered');
    });

    it('should login with valid credentials', () => {
        cy.visit('/users/login');

        cy.get('input[name="email"]').type('test@example.com');
        cy.get('input[name="password"]').type('password123');

        cy.get('button[type="submit"]').click();

        cy.url().should('include', '/dashboard');
        cy.get('.navbar').should('contain', 'Test User');
    });

    it('should show error with invalid login credentials', () => {
        cy.visit('/users/login');

        cy.get('input[name="email"]').type('wrong@example.com');
        cy.get('input[name="password"]').type('wrongpassword');

        cy.get('button[type="submit"]').click();

        cy.url().should('include', '/users/login');
        cy.get('.alert-danger').should('contain', 'Invalid credentials');
    });

    it('should logout successfully', () => {
        // First login
        cy.visit('/users/login');
        cy.get('input[name="email"]').type('test@example.com');
        cy.get('input[name="password"]').type('password123');
        cy.get('button[type="submit"]').click();

        // Then logout
        cy.get('a[href="/users/logout"]').click();

        cy.url().should('include', '/users/login');
        cy.get('.alert-success').should('contain', 'You are logged out');
    });

    it('should redirect to dashboard when accessing protected routes while logged in', () => {
        // First login
        cy.visit('/users/login');
        cy.get('input[name="email"]').type('test@example.com');
        cy.get('input[name="password"]').type('password123');
        cy.get('button[type="submit"]').click();

        // Try to access login page while logged in
        cy.visit('/users/login');
        cy.url().should('include', '/dashboard');
    });

    it('should redirect to login when accessing protected routes while logged out', () => {
        cy.visit('/dashboard');
        cy.url().should('include', '/users/login');
        cy.get('.alert-danger').should('contain', 'Please log in');
    });
}); 