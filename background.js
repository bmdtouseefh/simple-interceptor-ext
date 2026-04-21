chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    totalBlocked: 0,
    redactionLogs: [],
    isEnabled: true,
    isActivated: true,
  });
});
