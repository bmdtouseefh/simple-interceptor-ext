// popup.js
function updateUI() {
  chrome.storage.local.get(["totalBlocked", "redactionLogs", "isEnabled"], (data) => {
    const counterEl = document.getElementById("total-counter");
    if (counterEl) counterEl.innerText = data.totalBlocked || 0;

    const statusBadge = document.getElementById("status-badge");
    const enableToggle = document.getElementById("enable-toggle");
    const enabled = data.isEnabled !== false;
    enableToggle.checked = enabled;

    if (statusBadge) {
      if (enabled) {
        statusBadge.textContent = "Active";
        statusBadge.className = "status-badge";
        statusBadge.style.background = "#1c1917";
        statusBadge.style.color = "#10b981";
        statusBadge.style.border = "1px solid #064e3b";
      } else {
        statusBadge.textContent = "Inactive";
        statusBadge.className = "status-badge status-inactive";
        statusBadge.style.background = "#7f1d1d";
        statusBadge.style.color = "#fca5a5";
        statusBadge.style.border = "1px solid #7f1d1d";
      }
    }

    const logList = document.getElementById("log-list");
    if (logList && data.redactionLogs && data.redactionLogs.length > 0) {
      logList.innerHTML = data.redactionLogs
        .map(
          (log) => `
        <div class="log-item">
          <span class="category-tag">${log.category}</span>
          <span class="time-tag">${log.formattedDate}</span>
        </div>
      `
        )
        .join("");
    } else if (logList) {
      logList.innerHTML = '<div class="log-item" style="color: #57534e; justify-content: center">No activity detected yet</div>';
    }
  });
}

document.addEventListener("DOMContentLoaded", updateUI);
chrome.storage.onChanged.addListener(updateUI);

document.getElementById("enable-toggle").addEventListener("change", (e) => {
  const enabled = e.target.checked;
  chrome.storage.local.set({ isEnabled: enabled, isActivated: enabled });
  updateUI();
});

document.getElementById("options-link").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});