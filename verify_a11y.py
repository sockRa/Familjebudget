
import time
from playwright.sync_api import sync_playwright, expect

def verify_statistics_a11y(page):
    # Go to app
    page.goto("http://localhost:5174")

    # Wait for loading to finish (if any)
    page.wait_for_selector(".app", state="visible")

    # Click on Statistics tab
    page.get_by_role("button", name="Statistik").click()

    # Wait for stats to load
    page.wait_for_selector(".statistics-panel", state="visible")

    # 1. Verify Bar Chart Container
    chart = page.locator(".simple-bar-chart")
    expect(chart).to_be_visible()

    role = chart.get_attribute("role")
    label = chart.get_attribute("aria-label")
    print(f"Chart container: role='{role}', aria-label='{label}'")

    if role != "list":
        print("FAIL: Chart role is not list")
    if label != "Utgifter per månad diagram":
        print("FAIL: Chart label is incorrect")

    # 2. Verify Bar Items
    items = chart.locator(".bar-item").all()
    print(f"Found {len(items)} bar items")

    if len(items) > 0:
        first_item = items[0]
        item_role = first_item.get_attribute("role")
        item_label = first_item.get_attribute("aria-label")
        item_tabindex = first_item.get_attribute("tabindex")

        print(f"First item: role='{item_role}', aria-label='{item_label}', tabindex='{item_tabindex}'")

        if item_role != "listitem":
            print("FAIL: Item role is not listitem")
        if not item_label:
            print("FAIL: Item label is missing")
        if item_tabindex != "0":
            print("FAIL: Item tabindex is not 0")

        # Verify children are hidden
        children_hidden = first_item.locator("div[aria-hidden='true']").count()
        print(f"Children with aria-hidden='true': {children_hidden}")

    # 3. Verify Category Breakdown (if visible)
    # Note: It might not be visible if no data
    category_chart = page.locator(".category-breakdown")
    if category_chart.is_visible():
        cat_role = category_chart.get_attribute("role")
        cat_label = category_chart.get_attribute("aria-label")
        print(f"Category chart: role='{cat_role}', aria-label='{cat_label}'")
    else:
        print("Category chart not visible (maybe no data)")

    # Take screenshot
    page.screenshot(path="/home/jules/verification/statistics_a11y.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_statistics_a11y(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
        finally:
            browser.close()
