const apiKeyInput = document.getElementById("apiKey");
const saveBtn = document.getElementById("saveBtn");
const statusEl = document.getElementById("status");

chrome.storage.sync.get("apiKey", ({ apiKey }) => {
  if (apiKey) {
    apiKeyInput.value = apiKey;
    showStatus("Key saved and active", "success");
  }
});

saveBtn.addEventListener("click", () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    showStatus("Please enter an API key", "info");
    return;
  }

  chrome.storage.sync.set({ apiKey: key }, () => {
    showStatus("Key saved successfully!", "success");
  });
});

function showStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = `status status--${type}`;
}
