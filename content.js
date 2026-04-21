window.addEventListener("INTERCEPT_AI_REDACTION", (event) => {
  const { category, count, timestamp } = event.detail;

  chrome.storage.local.get(["totalBlocked", "redactionLogs"], (result) => {
    const data = result || {};
    const newTotal = (data.totalBlocked || 0) + count;

    const dateObj = new Date(timestamp);
    const readableDate = dateObj.toLocaleDateString();
    const readableTime = dateObj.toLocaleTimeString();

    const newLog = {
      category,
      count,
      formattedDate: `${readableDate} ${readableTime}`,
      url: window.location.hostname,
    };
    const updatedLogs = [newLog, ...(data.redactionLogs || [])].slice(0, 10);

    chrome.storage.local.set({
      totalBlocked: newTotal,
      redactionLogs: updatedLogs,
    });
  });
});

(function () {
  chrome.storage.local.get(["isEnabled", "isActivated"], (res) => {
    if (res.isEnabled && res.isActivated) {
      const script = document.createElement("script");
      script.src = chrome.runtime.getURL("inject.js");
      (document.head || document.documentElement).appendChild(script);
      script.onload = () => script.remove();
    }
  });
})();
