import { renderSessions, renderError } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    chrome.runtime.sendMessage({ type: 'fetchTodaySessions' }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Error sending message:", chrome.runtime.lastError.message);
            renderError('Error loading data. Try reopening the popup.');
            return;
        }

        if (response.error) {
            console.error("Error fetching sessions:", response.error);
            renderError('Error loading data.');
            return;
        }

        renderSessions(response.data);
    });
});
