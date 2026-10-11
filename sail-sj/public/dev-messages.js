
(() => {
  const API = "/api/dev-message";
  const POLL_MS = 3000;

  let showing = false;
  let polling = false;
  let queue = [];
  const knownIds = new Set();

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
  }

  function showNext() {
    if (showing || !queue.length) return;

    const message = queue.shift();
    showing = true;

    const overlay = document.createElement("div");
    overlay.id = "sail-dev-message-overlay";
    overlay.innerHTML = `
      <div class="sail-dev-message-box" role="alertdialog" aria-modal="true" aria-labelledby="sail-dev-message-title">
        <div class="sail-dev-message-title" id="sail-dev-message-title">Message From Dev</div>
        <div class="sail-dev-message-text">${escapeHtml(message.message)}</div>
        <button class="sail-dev-message-ok" type="button">OK</button>
      </div>
    `;

    const style = document.createElement("style");
    style.textContent = `
      #sail-dev-message-overlay {
        position: fixed !important;
        inset: 0 !important;
        z-index: 2147483647 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 20px !important;
        background: rgba(0,0,0,.72) !important;
        backdrop-filter: blur(5px) !important;
        font-family: Arial, Helvetica, sans-serif !important;
        box-sizing: border-box !important;
      }
      .sail-dev-message-box {
        width: min(520px, 100%) !important;
        box-sizing: border-box !important;
        padding: 26px !important;
        border-radius: 14px !important;
        background: #111 !important;
        color: #fff !important;
        border: 1px solid rgba(255,255,255,.2) !important;
        box-shadow: 0 20px 70px rgba(0,0,0,.6) !important;
        text-align: left !important;
      }
      .sail-dev-message-title {
        font-size: 21px !important;
        font-weight: 700 !important;
        margin-bottom: 12px !important;
      }
      .sail-dev-message-text {
        font-size: 16px !important;
        line-height: 1.5 !important;
        white-space: pre-wrap !important;
        overflow-wrap: anywhere !important;
      }
      .sail-dev-message-ok {
        display: block !important;
        margin: 20px 0 0 auto !important;
        padding: 9px 20px !important;
        border: 0 !important;
        border-radius: 8px !important;
        background: #fff !important;
        color: #111 !important;
        cursor: pointer !important;
        font: inherit !important;
        font-weight: 700 !important;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(overlay);

    const button = overlay.querySelector(".sail-dev-message-ok");

    button.addEventListener("click", async () => {
      if (button.disabled) return;

      button.disabled = true;
      button.textContent = "Saving…";

      try {
        const response = await fetch(API, {
          method: "POST",
          cache: "no-store",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "dismiss",
            id: message.id,
          }),
        });

        if (!response.ok) {
          button.disabled = false;
          button.textContent = "Try Again";
          return;
        }

        overlay.remove();
        style.remove();
        showing = false;
        showNext();
      } catch (_) {
        button.disabled = false;
        button.textContent = "Try Again";
      }
    });
  }

  async function poll() {
    if (polling) return;
    polling = true;

    try {
      const response = await fetch(API, {
        cache: "no-store",
        credentials: "same-origin",
      });

      if (!response.ok) return;

      const data = await response.json();
      if (!Array.isArray(data.messages)) return;

      for (const message of data.messages) {
        if (
          !message
          || typeof message.id !== "string"
          || typeof message.message !== "string"
          || knownIds.has(message.id)
        ) {
          continue;
        }

        knownIds.add(message.id);
        queue.push(message);
      }

      showNext();
    } catch (_) {
      // Announcement failures must not affect the rest of Sail.
    } finally {
      polling = false;
    }
  }

  poll();
  setInterval(poll, POLL_MS);
})();

