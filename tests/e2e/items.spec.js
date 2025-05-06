describe('Item Management', () => {
    beforeEach(() => {
        // Login before each test
        cy.visit('/users/login');
        cy.get('input[name="email"]').type('test@example.com');
        cy.get('input[name="password"]').type('password123');
        cy.get('button[type="submit"]').click();
    });

    it('should navigate to items page', () => {
        cy.get('a[href="/items"]').click();
        cy.url().should('include', '/items');
        cy.get('h1').should('contain', 'Items');
    });

    it('should create a new item', () => {
        cy.visit('/items/create');

        cy.get('input[name="title"]').type('Test Item');
        cy.get('textarea[name="description"]').type('This is a test item description');
        cy.get('select[name="category"]').select('Electronics');
        cy.get('select[name="condition"]').select('Good');
        cy.get('input[name="location"]').type('Test Location');
        cy.get('input[name="tags"]').type('test, electronics');

        // Upload image
        cy.get('input[type="file"]').attachFile('test-image.jpg');

        cy.get('button[type="submit"]').click();

        cy.url().should('include', '/items/');
        cy.get('.alert-success').should('contain', 'Item created successfully');
    });

    it('should view item details', () => {
        cy.visit('/items');
        cy.get('.item-card').first().click();
        cy.url().should('include', '/items/');
        cy.get('h1').should('contain', 'Test Item');
    });

    it('should edit an item', () => {
        // First create an item
        cy.visit('/items/create');
        cy.get('input[name="title"]').type('Item to Edit');
        cy.get('textarea[name="description"]').type('This item will be edited');
        cy.get('select[name="category"]').select('Electronics');
        cy.get('select[name="condition"]').select('Good');
        cy.get('input[name="location"]').type('Test Location');
        cy.get('input[name="tags"]').type('test, electronics');
        cy.get('input[type="file"]').attachFile('test-image.jpg');
        cy.get('button[type="submit"]').click();

        // Then edit it
        cy.get('a[href*="/edit"]').click();
        cy.get('input[name="title"]').clear().type('Updated Item Title');
        cy.get('button[type="submit"]').click();

        cy.url().should('include', '/items/');
        cy.get('.alert-success').should('contain', 'Item updated successfully');
        cy.get('h1').should('contain', 'Updated Item Title');
    });

    it('should delete an item', () => {
        // First create an item
        cy.visit('/items/create');
        cy.get('input[name="title"]').type('Item to Delete');
        cy.get('textarea[name="description"]').type('This item will be deleted');
        cy.get('select[name="category"]').select('Electronics');
        cy.get('select[name="condition"]').select('Good');
        cy.get('input[name="location"]').type('Test Location');
        cy.get('input[name="tags"]').type('test, electronics');
        cy.get('input[type="file"]').attachFile('test-image.jpg');
        cy.get('button[type="submit"]').click();

        // Then delete it
        cy.get('button.delete-item').click();
        cy.get('.confirm-delete').click();

        cy.url().should('include', '/items');
        cy.get('.alert-success').should('contain', 'Item deleted successfully');
    });

    it('should filter items by category', () => {
        cy.visit('/items');
        cy.get('select[name="category"]').select('Electronics');
        cy.get('button[type="submit"]').click();

        cy.url().should('include', 'category=Electronics');
        cy.get('.item-card').each(($el) => {
            cy.wrap($el).should('contain', 'Electronics');
        });
    });

    it('should search items', () => {
        cy.visit('/items');
        cy.get('input[name="search"]').type('Test Item');
        cy.get('button[type="submit"]').click();

        cy.url().should('include', 'search=Test+Item');
        cy.get('.item-card').should('contain', 'Test Item');
    });

    it('should show error when creating item without required fields', () => {
        cy.visit('/items/create');
        cy.get('button[type="submit"]').click();

        cy.url().should('include', '/items/create');
        cy.get('.alert-danger').should('contain', 'Please fill in all required fields');
    });
}); 