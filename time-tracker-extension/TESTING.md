# Manual Testing Guide

This guide provides a set of manual tests you can perform to ensure the Website Time Tracker extension is working correctly after the refactoring.

## Prerequisites

Before you begin, make sure you have loaded the extension into your browser as an "unpacked extension". Instructions are in the `README.md` file.

## Test Cases

### Test Case 1: Basic Time Tracking

**Goal**: Verify that time is being tracked for visited websites.

1.  Navigate to a website (e.g., `https://www.google.com`).
2.  Stay on the page for at least 10-15 seconds.
3.  Navigate to another website (e.g., `https://www.github.com`).
4.  Stay on this second page for at least 10-15 seconds.
5.  Click the extension icon in your browser toolbar to open the popup.

**Expected Result**: The popup should display both `google.com` and `github.com` with approximately the time you spent on each.

### Test Case 2: Idle Detection

**Goal**: Verify that the timer pauses when you are inactive.

1.  Open a new tab with any website.
2.  Open the extension popup and note the current time tracked for this site. If it's a new site, the time will be 0.
3.  On the webpage, do not move your mouse, scroll, or type for **at least 35 seconds**.
4.  After the idle period, move your mouse or press a key to become active again.
5.  Wait for another 10 seconds.
6.  Open the popup again.

**Expected Result**: The time tracked should have increased by approximately 10 seconds (the time after you became active again), not the full 45+ seconds. This confirms the idle timer is working.

### Test Case 3: Tab and Window Switching

**Goal**: Verify that only the active tab is being tracked.

1.  Open two different websites in two separate tabs.
2.  Spend about 15 seconds on the first tab.
3.  Switch to the second tab and spend about 10 seconds there.
4.  Switch back to the first tab.
5.  Minimize the browser window for 15 seconds, then restore it.
6.  Open the popup.

**Expected Result**: The time for the first tab should be a little over 15 seconds, and the time for the second tab should be around 10 seconds. The time when the window was minimized should not be counted for any tab.

### Test Case 4: Data Persistence

**Goal**: Verify that data is saved correctly when the browser closes.

1.  Track some time on a few websites.
2.  Open the popup to confirm the time is there.
3.  Completely close your browser.
4.  Re-open the browser and navigate to one of the websites you visited before.
5.  Spend another 10 seconds on that site.
6.  Open the popup.

**Expected Result**: The popup should show the time from your previous session combined with the new 10 seconds you just spent.

---

If all these tests pass, the extension's core functionality is working as expected.
