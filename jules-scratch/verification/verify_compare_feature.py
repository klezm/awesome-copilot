from playwright.sync_api import sync_playwright, Page, expect
import os

def run_verification(page: Page):
    """
    This script verifies the compare feature.
    """
    # 1. Navigate to the index page.
    page.goto('http://localhost:8080/docs/index.html')

    # Wait for the first card to be rendered
    expect(page.locator('.item-card').first).to_be_visible()

    # 2. Select two items to compare.
    # We'll select the first two checkboxes we find.
    checkboxes = page.locator('.compare-checkbox')
    checkboxes.nth(0).check()
    checkboxes.nth(1).check()

    # 3. Click the compare button.
    compare_btn = page.locator('#compare-btn')
    expect(compare_btn).to_be_enabled()
    compare_btn.click()

    # 4. Assert that the new page has loaded.
    expect(page).to_have_title("Compare Files")

    # 5. Take a screenshot.
    page.screenshot(path="jules-scratch/verification/verification.png")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    run_verification(page)
    browser.close()
