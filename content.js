const TONES = [
  { key: "professional", label: "Professional", icon: "💼" },
  { key: "casual", label: "Casual", icon: "😎" },
  { key: "friendly", label: "Friendly", icon: "😊" },
  { key: "concise", label: "Concise", icon: "✂️" },
  { key: "assertive", label: "Assertive", icon: "💪" },
];

const PROCESSED_ATTR = "data-ai-reply-injected";

function getEditorText(editor) {
  return editor.innerText.trim();
}

function setEditorText(editor, text) {
  editor.focus();
  editor.innerHTML = "";

  const p = document.createElement("p");
  p.textContent = text;
  editor.appendChild(p);

  editor.dispatchEvent(new Event("input", { bubbles: true }));
}

function createRephraseButton(editor) {
  const wrapper = document.createElement("div");
  wrapper.className = "ai-reply-wrapper";

  const btn = document.createElement("button");
  btn.className = "ai-reply-btn";
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> Rephrase`;
  btn.title = "Rephrase with AI";

  const dropdown = document.createElement("div");
  dropdown.className = "ai-reply-dropdown";
  dropdown.style.display = "none";

  TONES.forEach(({ key, label, icon }) => {
    const item = document.createElement("button");
    item.className = "ai-reply-tone-btn";
    item.textContent = `${icon} ${label}`;
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.style.display = "none";
      triggerRephrase(editor, btn, key);
    });
    dropdown.appendChild(item);
  });

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();

    const text = getEditorText(editor);
    if (!text) return;

    const isVisible = dropdown.style.display === "flex";
    closeAllDropdowns();
    dropdown.style.display = isVisible ? "none" : "flex";
  });

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
  btn.innerHTML = `<span class="ai-reply-spinner"></span> Rephrasing...`;
  btn.disabled = true;

  const response = await chrome.runtime.sendMessage({
    action: "rephrase",
    text,
    tone,
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

function injectButtons() {
  const editors = document.querySelectorAll(
    '.ql-editor[contenteditable="true"], .editor-content[contenteditable="true"], div[contenteditable="true"][role="textbox"]'
  );

  editors.forEach((editor) => {
    if (editor.hasAttribute(PROCESSED_ATTR)) return;
    if (editor.closest(".ai-reply-wrapper")) return;

    const form =
      editor.closest(".comments-comment-box") ||
      editor.closest(".feed-shared-update-v2__comments-container") ||
      editor.closest('[class*="comment"]') ||
      editor.closest("form") ||
      editor.parentElement;

    if (!form) return;

    if (form.querySelector(".ai-reply-wrapper")) return;

    editor.setAttribute(PROCESSED_ATTR, "true");

    const btnWrapper = createRephraseButton(editor);

    const submitArea =
      form.querySelector(".comments-comment-box__submit-button") ||
      form.querySelector('[class*="submit"]') ||
      form.querySelector('button[type="submit"]');

    if (submitArea && submitArea.parentElement) {
      submitArea.parentElement.insertBefore(btnWrapper, submitArea);
    } else {
      form.appendChild(btnWrapper);
    }
  });
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".ai-reply-wrapper")) {
    closeAllDropdowns();
  }
});

const observer = new MutationObserver(() => {
  injectButtons();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

injectButtons();
