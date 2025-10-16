from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    try:
        page.goto("http://localhost:5173/#/p?id=p1", wait_until="networkidle", timeout=60000)
        page.wait_for_selector('text="لون:"', timeout=15000)
        page.screenshot(path="jules-scratch/verification/verification.png")
    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)