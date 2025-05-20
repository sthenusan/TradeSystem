const puppeteer = require('puppeteer');

async function testTradeWorkflow() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1280, height: 800 }
    });

    try {
        const page = await browser.newPage();
        console.log('Starting trade workflow test...');

        // Login as first user
        console.log('Logging in as first user...');
        await page.goto('http://localhost:3000/users/login');
        await page.type('input[name="email"]', 'thenusan1997@gmail.com');
        await page.type('input[name="password"]', 'Thenu@1997');
        await page.click('button[type="submit"]');
        await page.waitForNavigation();

        // Browse items
        console.log('Browsing items...');
        await page.goto('http://localhost:3000/items');
        await page.waitForSelector('.card');

        // Click on first item
        console.log('Viewing item details...');
        const itemCards = await page.$$('.card');
        if (itemCards.length === 0) {
            throw new Error('No items found');
        }
        await itemCards[0].click();
        await page.waitForNavigation();

        // Propose trade
        console.log('Proposing trade...');
        await page.waitForSelector('a[href^="/trades/create/"]');
        await page.click('a[href^="/trades/create/"]');
        await page.waitForNavigation();

        // Select items to offer
        console.log('Selecting items to offer...');
        await page.waitForSelector('input[name="offeredItemIds"]');
        const checkboxes = await page.$$('input[name="offeredItemIds"]');
        if (checkboxes.length > 0) {
            await checkboxes[0].click();
        }

        // Add message
        await page.type('textarea[name="message"]', 'I would like to trade for this item!');
        await page.click('button[type="submit"]');
        await page.waitForNavigation();

        // Logout
        console.log('Logging out...');
        await page.click('a[href="/users/logout"]');
        await page.waitForNavigation();

        // Login as second user
        console.log('Logging in as second user...');
        await page.goto('http://localhost:3000/users/login');
        await page.type('input[name="email"]', 'sthenusan.17@cse.mrt.ac.lk');
        await page.type('input[name="password"]', 'Thenu@1997');
        await page.click('button[type="submit"]');
        await page.waitForNavigation();

        // View trades
        console.log('Viewing trades...');
        await page.goto('http://localhost:3000/trades');
        await page.waitForSelector('.card');

        // Click on trade
        const tradeCards = await page.$$('.card');
        if (tradeCards.length === 0) {
            throw new Error('No trades found');
        }
        await tradeCards[0].click();
        await page.waitForNavigation();

        // Accept trade
        console.log('Accepting trade...');
        await page.waitForSelector('form[action$="/status"]');
        const acceptForm = await page.$('form[action$="/status"] input[value="Accepted"]');
        if (acceptForm) {
            await acceptForm.click();
            await page.waitForNavigation();
        }

        // Send message
        console.log('Sending message...');
        await page.type('textarea[name="content"]', 'I accept your trade offer!');
        await page.click('button[type="submit"]');
        await page.waitForNavigation();

        // Complete trade
        console.log('Completing trade...');
        const completeForm = await page.$('form[action$="/status"] input[value="Completed"]');
        if (completeForm) {
            await completeForm.click();
            await page.waitForNavigation();
        }

        console.log('Trade workflow test completed successfully!');
    } catch (error) {
        console.error('Error during trade workflow test:', error);
    } finally {
        await browser.close();
    }
}

testTradeWorkflow(); 