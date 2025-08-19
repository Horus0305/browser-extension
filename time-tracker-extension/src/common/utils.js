export function getDomain(url) {
    try {
        if (!url) return null;
        const urlObject = new URL(url);

        if (urlObject.protocol === 'file:') {
            return 'localfile';
        }

        if (urlObject.protocol.startsWith('chrome') || urlObject.protocol.startsWith('about') || urlObject.protocol.startsWith('moz-extension')) {
            return null;
        }

        return urlObject.hostname;
    } catch (e) {
        console.warn(`Could not parse URL: ${url}`, e);
        return null;
    }
}
