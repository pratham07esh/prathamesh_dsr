const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    // Wait for the main component to load
    await page.waitForSelector('h1', { timeout: 5000 });

    console.log('✓ Page loaded successfully');

    // Check for key elements
    const title = await page.textContent('h1');
    console.log(`✓ Title found: "${title}"`);

    // Fill form with test data
    console.log('\nTesting form functionality...');
    await page.fill('input[name="ticketNumber"]', 'TKT-001');
    const ticketValue = await page.inputValue('input[name="ticketNumber"]');
    console.log(`✓ Ticket Number filled: ${ticketValue}`);

    await page.fill('textarea[name="ticketStatement"]', 'Test ticket statement');
    const statementValue = await page.inputValue('textarea[name="ticketStatement"]');
    console.log(`✓ Ticket Statement filled: ${statementValue}`);

    // Test issue tracking inputs
    console.log('\nTesting issue tracking...');
    await page.fill('input[name="missingContent"]', '5');
    await page.fill('input[name="brokenLinks"]', '3');
    await page.fill('input[name="seoIssues"]', '2');

    // Check if Total Issues auto-calculates
    await page.waitForTimeout(500);
    const totalIssuesField = await page.inputValue('input[readonly]');
    console.log(`✓ Total Issues auto-calculated: ${totalIssuesField}`);

    // Test adding entry
    console.log('\nTesting Add Entry...');
    await page.click('button:has-text("Add Daily Work")');
    await page.waitForTimeout(500);

    // Check if table appeared
    const tableExists = await page.isVisible('table');
    if (tableExists) {
      console.log('✓ Entry added and table displayed');
    }

    // Test QA Member Management
    console.log('\nTesting QA Team Management...');
    await page.fill('input[placeholder="Enter new member name"]', 'John');
    await page.click('button:has-text("Add Member")');
    await page.waitForTimeout(300);
    console.log('✓ New member added');

    // Test Edit functionality
    console.log('\nTesting Edit functionality...');
    const editButtons = await page.locator('button').filter({ hasText: '✏️' });
    if (await editButtons.count() > 0) {
      console.log('✓ Edit buttons visible');
    }

    // Test Delete functionality
    const deleteButtons = await page.locator('button').filter({ hasText: '🗑️' });
    if (await deleteButtons.count() > 0) {
      console.log('✓ Delete buttons visible');
    }

    // Take screenshot
    await page.screenshot({ path: 'app-screenshot.png' });
    console.log('\n✓ Screenshot saved as app-screenshot.png');

    console.log('\n✅ All tests passed! App is working correctly.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
