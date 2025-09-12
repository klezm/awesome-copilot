from playwright.sync_api import sync_playwright, expect
import sys

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            print("Navigating to http://localhost:4321...")
            page.goto("http://localhost:4321", timeout=120000)

            print("Checking page title...")
            expect(page).to_have_title("Collection Explorer | Docs with Tailwind", timeout=10000)
            print("Title is correct.")

            page.wait_for_timeout(2000)

            print("Taking initial screenshot...")
            page.screenshot(path="jules-scratch/verification/01_initial_load.png")

            print("Testing search filter...")
            search_input = page.get_by_label("Search Description")
            search_input.fill("agent")
            page.wait_for_timeout(1000)
            page.screenshot(path="jules-scratch/verification/02_search_results.png")
            print("Search filter tested.")

            print("Testing reset button...")
            reset_button = page.get_by_role("button", name="Reset Filters")
            reset_button.click()
            page.wait_for_timeout(1000)
            page.screenshot(path="jules-scratch/verification/03_after_reset.png")
            print("Reset button tested.")

            print("Verification script completed successfully.")

        except Exception as e:
            print(f"An error occurred: {e}", file=sys.stderr)
            page.screenshot(path="jules-scratch/verification/error.png")
            sys.exit(1)
        finally:
            browser.close()

if __name__ == "__main__":
    run_verification()
