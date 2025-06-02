---
sidebar_position: 4
---

# 🧪 Add Tests

This folder contains all end-to-end (E2E) and integration tests for your workspace, powered by **Playwright**.

## 📖 Overview

We use **Playwright** for running automated tests across various browsers. It provides capabilities to test web applications in a real-world environment and ensures that the app behaves as expected in different conditions.

## 📁 Folder Structure

```bash
/tests
  ├── e2e           # E2E test files go here
  ├── fixtures      # Data and configurations for the tests
  └── utils         # Utility functions used across tests
```

- `e2e`: This folder contains all your end-to-end test files. Each test file should correspond to a feature or functionality you want to test.
- `fixtures`: Store any test data or configuration files used for setting up your test environment.
- `utils`: Common utilities or helper functions that multiple test files can reuse.

## ▶️ Running the Tests

To run all tests, simply execute the following command from the root of your workspace:

```bash
npx playwright test
```

To open the Playwright test runner UI:

```bash
npx playwright test --ui
```

## 🧪 Example Test Using Playwright

Here's a basic example of how to write a test using Playwright:

### Example Test: `tests/e2e/sample.test.ts`

```typescript
import { test, expect } from '@playwright/test';

// Test description
test.describe('Homepage', () => {
  // Individual test case
  test('should display the correct title', async ({ page }) => {
    // Go to the homepage URL
    await page.goto('http://localhost:3005'); // Replace with your actual app URL

    // Verify that the page title is correct
    await expect(page).toHaveTitle(/App Boilerplate/);
  });

  // Another test case example
  test('should navigate to About page', async ({ page }) => {
    await page.goto('http://localhost:3005');
    
    // Click on the 'About' link
    await page.click('text=About');

    // Check if the URL contains /about
    await expect(page).toHaveURL(/.*about/);

    // Check if the heading is present
    const heading = await page.textContent('h1');
    expect(heading).toBe('About Us');
  });
});
```

### 📌 Notes

- The test suite consists of multiple `test` cases that use Playwright's APIs to interact with the application.
- Playwright provides a default `page` object to interact with the browser page, allowing actions like navigating to a URL, clicking elements, and asserting expectations.

## 🧰 Additional Configurations

You can configure/update Playwright settings and options in your `playwright.config.js` file located at the root of the workspace based on your project specifications.
