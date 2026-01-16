from playwright.sync_api import sync_playwright, expect
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # 1. Open the app
    print("Navigating to app...")
    page.goto("http://localhost:5173")

    # Wait for app to load
    expect(page.get_by_text("Familjebudget")).to_be_visible()

    # 2. Add an expense so we have data
    print("Adding a test expense...")
    # Click FAB
    page.locator(".fab").click()

    # Wait for modal header
    expect(page.get_by_role("heading", name="Ny utgift")).to_be_visible()

    # Fill form using placeholders
    page.get_by_placeholder("T.ex. Hyra, Netflix...").fill("Test Expense")
    page.get_by_placeholder("0").fill("5000")

    # Click Spara
    page.get_by_role("button", name="Spara").click()

    # Wait for modal to close
    expect(page.get_by_role("heading", name="Ny utgift")).not_to_be_visible()

    # 3. Click "Planering" tab
    print("Clicking Planering tab...")
    page.get_by_text("Planering").click()

    # Wait for the panel to appear
    expect(page.get_by_text("Budgetsimulering")).to_be_visible()

    # 4. Take screenshot of initial state
    print("Taking initial screenshot...")
    page.screenshot(path="verification/planning_initial.png")

    # 5. Modify an expense
    print("Modifying expense...")

    expense_row = page.locator(".expense-item").filter(has_text="Test Expense")
    input_locator = expense_row.locator("input[type='number']")

    input_locator.fill("4500")

    # Wait for the "Spara ändringar" button to become enabled
    save_btn = page.get_by_role("button", name="Spara ändringar")
    expect(save_btn).to_be_enabled()

    # Take screenshot of modified state
    print("Taking modified screenshot...")
    page.screenshot(path="verification/planning_modified.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
