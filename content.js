const TONES = [
  { key: "professional", label: "Professional", icon: "💼" },
  { key: "casual", label: "Casual", icon: "😎" },
  { key: "friendly", label: "Friendly", icon: "😊" },
  { key: "concise", label: "Concise", icon: "✂️" },
  { key: "assertive", label: "Assertive", icon: "💪" },
];

const PROCESSED_ATTR = "data-ai-reply-injected";

const PLATFORM = detectPlatform();

function detectPlatform() {
  const host = window.location.hostname;
  if (host.includes("linkedin.com")) return "linkedin";
  if (host.includes("x.com") || host.includes("twitter.com")) return "x";
  return "unknown";
}

function getEditorText(editor) {
  return editor.innerText.trim();
}

function setEditorText(editor, text) {
  editor.focus();

  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(editor);
  selection.removeAllRanges();
  selection.addRange(range);

  document.execCommand("insertText", false, text);

  editor.dispatchEvent(new Event("input", { bubbles: true }));
  editor.dispatchEvent(new Event("change", { bubbles: true }));
}

function createSpellCheckButton(editor) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "ai-reply-btn ai-reply-btn--spell";
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg> Spell`;
  btn.title = "Fix spelling & grammar";

  btn.addEventListener("click", async (e) => {
    e.stopPropagation();
    e.stopImmediatePropagation();
    e.preventDefault();

    const text = getEditorText(editor);
    if (!text) {
      showToast("Write a reply first, then click Spell", "error");
      return;
    }

    const originalHTML = btn.innerHTML;
    btn.innerHTML = `<span class="ai-reply-spinner"></span>`;
    btn.disabled = true;

    const response = await chrome.runtime.sendMessage({
      action: "spellcheck",
      text,
      platform: PLATFORM,
    });

    if (response.error) {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
      showToast(response.error, "error");
      return;
    }

    setEditorText(editor, response.result);
    btn.innerHTML = originalHTML;
    btn.disabled = false;
    showToast("Spelling & grammar fixed!", "success");
  });

  return btn;
}

function createRephraseButton(editor) {
  const wrapper = document.createElement("div");
  wrapper.className = "ai-reply-wrapper";
  wrapper.setAttribute("data-platform", PLATFORM);
  wrapper.addEventListener("click", (e) => e.stopPropagation());
  wrapper.addEventListener("mousedown", (e) => e.stopPropagation());
  wrapper.addEventListener("submit", (e) => { e.stopPropagation(); e.preventDefault(); });

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "ai-reply-btn";
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> Rephrase`;
  btn.title = "Rephrase with AI";

  const dropdown = document.createElement("div");
  dropdown.className = "ai-reply-dropdown";
  dropdown.style.display = "none";

  TONES.forEach(({ key, label, icon }) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "ai-reply-tone-btn";
    item.textContent = `${icon} ${label}`;
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      e.stopImmediatePropagation();
      e.preventDefault();
      dropdown.style.display = "none";
      triggerRephrase(editor, btn, key);
    });
    dropdown.appendChild(item);
  });

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    e.stopImmediatePropagation();
    e.preventDefault();

    const text = getEditorText(editor);
    if (!text) {
      showToast("Write a reply first, then click Rephrase", "error");
      return;
    }

    const isVisible = dropdown.style.display === "flex";
    closeAllDropdowns();
    dropdown.style.display = isVisible ? "none" : "flex";
  });

  const spellBtn = createSpellCheckButton(editor);

  wrapper.appendChild(spellBtn);
  wrapper.appendChild(btn);
  wrapper.appendChild(dropdown);

  return wrapper;
}

function closeAllDropdowns() {
  document.querySelectorAll(".ai-reply-dropdown").forEach((d) => {
    d.style.display = "none";
  });
}

async function triggerRephrase(editor, btn, tone) {
  const text = getEditorText(editor);
  if (!text) return;

  const originalHTML = btn.innerHTML;
  btn.innerHTML = `<span class="ai-reply-spinner"></span>`;
  btn.disabled = true;

  const response = await chrome.runtime.sendMessage({
    action: "rephrase",
    text,
    tone,
    platform: PLATFORM,
  });

  if (response.error) {
    btn.innerHTML = originalHTML;
    btn.disabled = false;
    showToast(response.error, "error");
    return;
  }

  setEditorText(editor, response.result);
  btn.innerHTML = originalHTML;
  btn.disabled = false;
  showToast("Reply rephrased!", "success");
}

function showToast(message, type) {
  const existing = document.querySelector(".ai-reply-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `ai-reply-toast ai-reply-toast--${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("ai-reply-toast--visible"), 10);
  setTimeout(() => {
    toast.classList.remove("ai-reply-toast--visible");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// --- LinkedIn-specific logic ---

function linkedinFindContainer(editor) {
  let el = editor.parentElement;
  while (el && el !== document.body) {
    const cls = el.className || "";
    if (
      cls.includes("comment") ||
      cls.includes("editor") ||
      cls.includes("reply") ||
      el.tagName === "FORM"
    ) {
      return el;
    }
    el = el.parentElement;
  }
  return editor.parentElement;
}

function linkedinInject(editor) {
  if (editor.closest('[class*="messaging"]')) return;
  if (editor.closest('[class*="msg"]')) return;

  const container = linkedinFindContainer(editor);
  if (!container) return;
  if (container.querySelector(".ai-reply-wrapper")) return;

  editor.setAttribute(PROCESSED_ATTR, "true");
  const btnWrapper = createRephraseButton(editor);

  const submitBtn =
    container.querySelector("button.comments-comment-box__submit-button") ||
    container.querySelector('button[class*="submit"]') ||
    container.querySelector('button[type="submit"]');

  if (submitBtn && submitBtn.parentElement) {
    submitBtn.parentElement.insertBefore(btnWrapper, submitBtn);
  } else {
    const actionBar =
      container.querySelector('[class*="action"]') ||
      container.querySelector('[class*="toolbar"]');
    if (actionBar) {
      actionBar.prepend(btnWrapper);
    } else {
      container.appendChild(btnWrapper);
    }
  }
}

function linkedinScan() {
  const selectors = [
    'div.ql-editor[contenteditable="true"]',
    'div[contenteditable="true"][role="textbox"]',
    'div.editor-content[contenteditable="true"]',
    '[class*="comment"] div[contenteditable="true"]',
    '[class*="reply"] div[contenteditable="true"]',
  ];
  const editors = document.querySelectorAll(selectors.join(", "));
  editors.forEach((editor) => {
    if (editor.hasAttribute(PROCESSED_ATTR)) return;
    if (editor.closest(".ai-reply-wrapper")) return;
    linkedinInject(editor);
  });
}

// --- X/Twitter-specific logic ---

function xFindToolbar(editor) {
  let el = editor.parentElement;
  while (el && el !== document.body) {
    const toolbar = el.querySelector('[data-testid="toolBar"]');
    if (toolbar) return toolbar;
    const group = el.querySelector('[role="group"]');
    if (group) return group;
    el = el.parentElement;
  }
  return null;
}

function xInject(editor) {
  if (editor.closest('[data-testid="DMComposer"]')) return;
  if (editor.closest('[data-testid="dmComposerTextInput"]')) return;

  let root = editor.parentElement;
  while (root && root !== document.body) {
    if (
      root.querySelector('[data-testid="toolBar"]') ||
      root.querySelector('[role="group"]')
    ) {
      break;
    }
    root = root.parentElement;
  }
  if (!root || root === document.body) root = editor.parentElement;

  if (root.querySelector(".ai-reply-wrapper")) return;

  editor.setAttribute(PROCESSED_ATTR, "true");
  const btnWrapper = createRephraseButton(editor);

  const toolbar = xFindToolbar(editor);
  if (toolbar) {
    const tweetBtn = toolbar.querySelector(
      '[data-testid="tweetButton"], [data-testid="tweetButtonInline"]'
    );
    if (tweetBtn) {
      tweetBtn.parentElement.insertBefore(btnWrapper, tweetBtn);
    } else {
      toolbar.appendChild(btnWrapper);
    }
  } else {
    root.appendChild(btnWrapper);
  }
}

function xScan() {
  const selectors = [
    '[data-testid="tweetTextarea_0"] [contenteditable="true"]',
    'div[contenteditable="true"][role="textbox"]',
  ];
  const editors = document.querySelectorAll(selectors.join(", "));
  editors.forEach((editor) => {
    if (editor.hasAttribute(PROCESSED_ATTR)) return;
    if (editor.closest(".ai-reply-wrapper")) return;
    if (editor.closest('[data-testid="DMComposer"]')) return;
    if (editor.closest('[data-testid="dmComposerTextInput"]')) return;
    xInject(editor);
  });
}

// --- Platform router ---

function scan() {
  if (PLATFORM === "linkedin") linkedinScan();
  else if (PLATFORM === "x") xScan();
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".ai-reply-wrapper")) {
    closeAllDropdowns();
  }
});

document.addEventListener("focusin", () => {
  setTimeout(scan, 300);
});

const observer = new MutationObserver(() => {
  scan();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

scan();

console.log(`[AI Reply] Extension loaded on ${PLATFORM}`);
