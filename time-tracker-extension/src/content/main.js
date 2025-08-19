// This script depends on messaging.js and activity.js being loaded first.

function handleVisibilityChange() {
    if (document.visibilityState === 'hidden') {
        sendMessage('pageHidden');
    } else {
        sendMessage('pageVisible');
        reportActivity();
    }
}

function initialize() {
    // Initial activity report
    reportActivity();

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', () => {
        sendMessage('windowFocus');
        reportActivity();
    });
    window.addEventListener('blur', () => sendMessage('windowBlur'));
    window.addEventListener('beforeunload', () => sendMessage('pageUnload'));

    ['mousemove', 'keydown', 'scroll', 'click'].forEach(event => {
        document.addEventListener(event, reportActivity, { passive: true });
    });

    console.log("Time Tracker content script initialized.");
}

initialize();
