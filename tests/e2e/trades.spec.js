describe('Trade Management', () => {
    beforeEach(() => {
        // Login before each test
        cy.visit('/users/login');
        cy.get('input[name="email"]').type('test@example.com');
        cy.get('input[name="password"]').type('password123');
        cy.get('button[type="submit"]').click();
    });

    it('should navigate to trades page', () => {
        cy.get('a[href="/trades"]').click();
        cy.url().should('include', '/trades');
        cy.get('h1').should('contain', 'My Trades');
    });

    it('should create a new trade proposal', () => {
        // First create an item to trade
        cy.visit('/items/create');
        cy.get('input[name="title"]').type('Item for Trade');
        cy.get('textarea[name="description"]').type('This item will be traded');
        cy.get('select[name="category"]').select('Electronics');
        cy.get('select[name="condition"]').select('Good');
        cy.get('input[name="location"]').type('Test Location');
        cy.get('input[name="tags"]').type('test, electronics');
        cy.get('input[type="file"]').attachFile('test-image.jpg');
        cy.get('button[type="submit"]').click();

        // Then create another item to offer
        cy.visit('/items/create');
        cy.get('input[name="title"]').type('Item to Offer');
        cy.get('textarea[name="description"]').type('This item will be offered');
        cy.get('select[name="category"]').select('Electronics');
        cy.get('select[name="condition"]').select('Good');
        cy.get('input[name="location"]').type('Test Location');
        cy.get('input[name="tags"]').type('test, electronics');
        cy.get('input[type="file"]').attachFile('test-image.jpg');
        cy.get('button[type="submit"]').click();

        // Create trade proposal
        cy.visit('/items');
        cy.get('.item-card').first().click();
        cy.get('button.propose-trade').click();

        cy.get('select[name="offeredItems"]').select('Item to Offer');
        cy.get('textarea[name="message"]').type('I would like to trade this item');
        cy.get('button[type="submit"]').click();

        cy.url().should('include', '/trades/');
        cy.get('.alert-success').should('contain', 'Trade proposal sent successfully');
    });

    it('should view trade details', () => {
        cy.visit('/trades');
        cy.get('.trade-card').first().click();
        cy.url().should('include', '/trades/');
        cy.get('h1').should('contain', 'Trade Details');
    });

    it('should accept a trade', () => {
        // First create a trade (using the previous test's setup)
        // Then accept it
        cy.visit('/trades');
        cy.get('.trade-card').first().click();
        cy.get('button.accept-trade').click();
        cy.get('.confirm-accept').click();

        cy.get('.alert-success').should('contain', 'Trade accepted successfully');
        cy.get('.trade-status').should('contain', 'Accepted');
    });

    it('should reject a trade', () => {
        cy.visit('/trades');
        cy.get('.trade-card').first().click();
        cy.get('button.reject-trade').click();
        cy.get('.confirm-reject').click();

        cy.get('.alert-success').should('contain', 'Trade rejected successfully');
        cy.get('.trade-status').should('contain', 'Rejected');
    });

    it('should add message to trade', () => {
        cy.visit('/trades');
        cy.get('.trade-card').first().click();

        cy.get('textarea[name="message"]').type('This is a test message');
        cy.get('button.send-message').click();

        cy.get('.message-list').should('contain', 'This is a test message');
    });

    it('should show error when creating trade without selecting items', () => {
        cy.visit('/items');
        cy.get('.item-card').first().click();
        cy.get('button.propose-trade').click();
        cy.get('button[type="submit"]').click();

        cy.get('.alert-danger').should('contain', 'Please select items to trade');
    });

    it('should show error when trying to trade own items', () => {
        cy.visit('/items');
        cy.get('.item-card').first().click();
        cy.get('button.propose-trade').click();

        cy.get('select[name="offeredItems"]').select('Item for Trade');
        cy.get('button[type="submit"]').click();

        cy.get('.alert-danger').should('contain', 'Cannot trade with yourself');
    });
}); 