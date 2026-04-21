// options.js
document.addEventListener("DOMContentLoaded", () => {
  const enableToggle = document.getElementById("enable-toggle");
  const statusBadge = document.getElementById("status-badge");
  const clearBtn = document.getElementById("clear-logs");
  const patternToggles = {
    "pattern-email": "email",
    "pattern-phone": "phone",
    "pattern-ssn": "ssn",
    "pattern-cc": "creditCard",
    "pattern-apikey": "apiKey",
    "pattern-ip": "ipAddress",
  };

  chrome.storage.local.get(["isEnabled", "isActivated", "patterns"], (data) => {
    enableToggle.checked = data.isEnabled !== false;
    updateStatus(data.isEnabled !== false);

    for (const [id, key] of Object.entries(patternToggles)) {
      const toggle = document.getElementById(id);
      if (toggle) {
        const patterns = data.patterns || {};
        toggle.checked = patterns[key] !== false;
      }
    }
  });

  enableToggle.addEventListener("change", () => {
    const enabled = enableToggle.checked;
    chrome.storage.local.set({ isEnabled: enabled, isActivated: enabled });
    updateStatus(enabled);
  });

  for (const [id, key] of Object.entries(patternToggles)) {
    const toggle = document.getElementById(id);
    toggle.addEventListener("change", () => {
      chrome.storage.local.get("patterns", (data) => {
        const patterns = data.patterns || {};
        patterns[key] = toggle.checked;
        chrome.storage.local.set({ patterns });
      });
    });
  }

  clearBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear all logs?")) {
      chrome.storage.local.set({ totalBlocked: 0, redactionLogs: [] });
    }
  });

  function updateStatus(enabled) {
    if (enabled) {
      statusBadge.textContent = "Active";
      statusBadge.className = "status-badge status-active";
    } else {
      statusBadge.textContent = "Inactive";
      statusBadge.className = "status-badge status-inactive";
    }
  }
});