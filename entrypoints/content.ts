export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('Usage tracker content script loaded on:', window.location.hostname);
  },
});
