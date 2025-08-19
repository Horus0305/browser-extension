function formatTime(ms) {
    if (ms < 0) ms = 0;
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60));

    let formatted = '';
    if (hours > 0) formatted += `${hours}h `;
    if (minutes > 0) formatted += `${minutes}m `;
    if (seconds > 0 || formatted === '') formatted += `${seconds}s`;

    return formatted.trim();
}

export function renderSessions(sessions) {
    const sessionList = document.getElementById('session-list');
    if (!sessionList) return;

    if (!sessions || sessions.length === 0) {
        sessionList.innerHTML = "<p>No activity tracked today. Start browsing!</p>";
        return;
    }

    // Sort by time spent
    sessions.sort((a, b) => b.timeSpent - a.timeSpent);

    sessionList.innerHTML = ''; // Clear previous list
    sessions.forEach(session => {
        const item = document.createElement('div');
        item.className = 'session-item';

        const domainSpan = document.createElement('span');
        domainSpan.className = 'domain';
        domainSpan.textContent = session.domain;
        domainSpan.title = session.domain;

        const timeSpan = document.createElement('span');
        timeSpan.className = 'time';
        timeSpan.textContent = formatTime(session.timeSpent);

        item.appendChild(domainSpan);
        item.appendChild(timeSpan);
        sessionList.appendChild(item);
    });
}

export function renderError(message) {
    const sessionList = document.getElementById('session-list');
    if (!sessionList) return;
    sessionList.innerHTML = `<p>${message}</p>`;
}
