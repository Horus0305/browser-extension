// This script depends on messaging.js being loaded first.

const IDLE_TIMEOUT = 30000; // 30 seconds
let activityTimeout;
let isIdle = false;

function reportActivity() {
    if (isIdle) {
        sendMessage('userActive');
        isIdle = false;
    }
    clearTimeout(activityTimeout);
    activityTimeout = setTimeout(() => {
        sendMessage('userInactive');
        isIdle = true;
    }, IDLE_TIMEOUT);
}
