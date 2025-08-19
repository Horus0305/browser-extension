export async function saveSession(domain, timeSpent) {
    if (timeSpent < 1000) { // Do not save sessions less than 1 second
        return;
    }

    try {
        const { sessions } = await chrome.storage.local.get('sessions');
        const existingSessions = new Map(sessions ? JSON.parse(sessions) : []);

        const today = new Date().toISOString().split('T')[0];
        const sessionKey = `${domain}_${today}`;

        const currentSession = existingSessions.get(sessionKey) || {
            domain: domain,
            date: today,
            timeSpent: 0,
        };

        currentSession.timeSpent += timeSpent;
        existingSessions.set(sessionKey, currentSession);

        await chrome.storage.local.set({ sessions: JSON.stringify(Array.from(existingSessions.entries())) });
    } catch (error) {
        console.error("Error saving session:", error);
    }
}

export async function getTodaySessions() {
    try {
        const { sessions } = await chrome.storage.local.get('sessions');
        const storedSessions = sessions ? new Map(JSON.parse(sessions)) : new Map();

        const today = new Date().toISOString().split('T')[0];
        const todaySessions = [];

        for (const [key, value] of storedSessions.entries()) {
            if (key.endsWith(today)) {
                todaySessions.push(value);
            }
        }
        return todaySessions;
    } catch (error) {
        console.error("Error retrieving sessions:", error);
        return [];
    }
}
