/**
 * Hotel AI Concierge — embeddable widget.
 *
 * Install on any page with:
 *   <script src="https://YOUR-BACKEND-URL.com/widget.js" data-backend="https://YOUR-BACKEND-URL.com"></script>
 *
 * Everything hotel-specific (name, colors, knowledge, greeting) is pulled from
 * the backend's /api/config and /api/chat endpoints — this file never needs editing per client.
 */
(function () {
  const scriptTag = document.currentScript;
  const BACKEND = (scriptTag && scriptTag.getAttribute("data-backend")) || "";
  if (!BACKEND) {
    console.error("Hotel chatbot: missing data-backend attribute on the script tag.");
    return;
  }

  let cfg = { hotelName: "Hotel", greeting: "Hello! How can I help with your stay?", primaryColor: "#122129", accentColor: "#C9A66B", bookingUrl: "" };
  let history = [];
  let language = "auto";

  const css = `
    .hcw-bubble{position:fixed;right:24px;bottom:24px;width:58px;height:58px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;cursor:pointer;
      box-shadow:0 6px 18px rgba(0,0,0,0.35);z-index:999998;transition:transform .15s ease;}
    .hcw-bubble:hover{transform:scale(1.06);}
    .hcw-bubble svg{width:24px;height:24px;}
    .hcw-panel{position:fixed;right:20px;bottom:20px;width:370px;height:540px;max-height:80vh;
      background:#fff;border-radius:10px;box-shadow:0 20px 50px rgba(0,0,0,0.35);
      display:none;flex-direction:column;overflow:hidden;z-index:999999;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;}
    .hcw-panel.hcw-open{display:flex;}
    .hcw-head{padding:14px 16px;display:flex;align-items:center;justify-content:space-between;color:#fff;}
    .hcw-head .hcw-name{font-size:14px;font-weight:600;}
    .hcw-head .hcw-sub{font-size:9px;letter-spacing:.5px;text-transform:uppercase;opacity:.65;margin-top:2px;}
    .hcw-head-right{display:flex;align-items:center;gap:8px;}
    .hcw-lang{background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.3);color:#fff;
      font-size:10px;border-radius:12px;padding:4px 6px;cursor:pointer;}
    .hcw-close{cursor:pointer;background:none;border:none;color:#fff;opacity:.75;font-size:15px;}
    .hcw-close:hover{opacity:1;}
    .hcw-log{flex:1;overflow-y:auto;padding:12px 0;background:#FAFAF8;}
    .hcw-entry{padding:5px 14px;display:flex;}
    .hcw-entry.hcw-user{justify-content:flex-end;}
    .hcw-bubble-msg{font-size:13.5px;line-height:1.45;padding:9px 12px;border-radius:10px;max-width:260px;}
    .hcw-entry.hcw-bot .hcw-bubble-msg{background:#fff;border:1px solid rgba(0,0,0,0.08);border-bottom-left-radius:2px;}
    .hcw-entry.hcw-user .hcw-bubble-msg{color:#fff;border-bottom-right-radius:2px;}
    .hcw-quickrow{display:flex;gap:6px;padding:8px 14px 4px;flex-wrap:wrap;}
    .hcw-chip-btn{background:#fff;border:1px solid rgba(0,0,0,0.15);font-size:11px;padding:6px 10px;
      border-radius:14px;cursor:pointer;color:#122129;}
    .hcw-chip-btn:hover{border-color:currentColor;}
    .hcw-upsell{margin:4px 14px 8px;display:inline-flex;align-items:center;gap:6px;
      border-radius:14px;font-size:11.5px;padding:7px 11px;cursor:pointer;}
    .hcw-escalation{margin:6px 14px;padding:8px 11px;border-radius:6px;background:rgba(166,67,46,0.08);
      border:1px solid rgba(166,67,46,0.3);color:#8A3A34;font-size:11.5px;}
    .hcw-typing{display:flex;gap:4px;padding:8px 16px;}
    .hcw-typing span{width:5px;height:5px;border-radius:50%;background:rgba(0,0,0,0.3);
      animation:hcw-blink 1.2s infinite ease-in-out;}
    .hcw-typing span:nth-child(2){animation-delay:.15s;}
    .hcw-typing span:nth-child(3){animation-delay:.3s;}
    @keyframes hcw-blink{0%,80%,100%{opacity:.25;}40%{opacity:1;}}
    .hcw-emailrow{display:none;gap:8px;padding:0 12px 10px;}
    .hcw-emailrow.hcw-show{display:flex;}
    .hcw-emailrow input{flex:1;border:1px solid rgba(0,0,0,0.15);border-radius:20px;padding:8px 12px;font-size:12px;}
    .hcw-emailrow button{border:none;border-radius:20px;padding:0 14px;font-size:11px;cursor:pointer;}
    .hcw-inputbar{display:flex;gap:8px;padding:10px;border-top:1px solid rgba(0,0,0,0.08);}
    .hcw-inputbar input{flex:1;border:1px solid rgba(0,0,0,0.15);border-radius:20px;padding:9px 14px;font-size:13px;}
    .hcw-inputbar input:focus{outline:none;}
    .hcw-send{border:none;width:36px;height:36px;border-radius:50%;cursor:pointer;color:#fff;
      display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .hcw-send:disabled{opacity:.4;cursor:default;}
    .hcw-send svg{width:15px;height:15px;}
    @media (max-width:460px){ .hcw-panel{width:calc(100% - 20px);height:75%;right:10px;bottom:10px;} }
  `;
  const styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  const bubble = document.createElement("div");
  bubble.className = "hcw-bubble";
  bubble.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`;

  const panel = document.createElement("div");
  panel.className = "hcw-panel";
  panel.innerHTML = `
    <div class="hcw-head">
      <div>
        <div class="hcw-name" id="hcw-hotel-name">Hotel</div>
        <div class="hcw-sub">AI-assisted · staff notified when needed</div>
      </div>
      <div class="hcw-head-right">
        <select class="hcw-lang" id="hcw-lang">
          <option value="auto">Auto</option>
          <option value="English">EN</option>
          <option value="Spanish">ES</option>
          <option value="French">FR</option>
          <option value="German">DE</option>
          <option value="Arabic">AR</option>
          <option value="Mandarin Chinese">中文</option>
          <option value="Japanese">日本語</option>
          <option value="Hindi">हिंदी</option>
        </select>
        <button class="hcw-close" id="hcw-close">✕</button>
      </div>
    </div>
    <div class="hcw-log" id="hcw-log"></div>
    <div class="hcw-quickrow">
      <button class="hcw-chip-btn" id="hcw-book-btn">Check rates &amp; book direct</button>
      <button class="hcw-chip-btn" id="hcw-upgrade-btn">See upgrades</button>
    </div>
    <div class="hcw-emailrow" id="hcw-emailrow">
      <input id="hcw-email-input" placeholder="best email or room number" />
      <button id="hcw-email-send">Send</button>
    </div>
    <div class="hcw-inputbar">
      <input id="hcw-input" placeholder="Ask about rooms, check-in, parking…" />
      <button class="hcw-send" id="hcw-send"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z"/></svg></button>
    </div>
  `;

  document.body.appendChild(bubble);
  document.body.appendChild(panel);

  function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function applyBranding() {
    panel.querySelectorAll(".hcw-head")[0].style.background = cfg.primaryColor;
    bubble.style.background = cfg.primaryColor;
    document.getElementById("hcw-hotel-name").textContent = cfg.hotelName;
    document.getElementById("hcw-send").style.background = cfg.primaryColor;
    document.getElementById("hcw-email-send").style.background = cfg.accentColor;
    document.getElementById("hcw-email-send").style.color = cfg.primaryColor;
    panel.querySelectorAll(".hcw-entry.hcw-user .hcw-bubble-msg").forEach((el) => (el.style.background = cfg.primaryColor));
  }

  function open() {
    panel.classList.add("hcw-open");
    bubble.style.display = "none";
    if (history.length === 0) renderBot(cfg.greeting);
  }
  function close() {
    panel.classList.remove("hcw-open");
    bubble.style.display = "flex";
  }

  function renderUser(text) {
    const log = document.getElementById("hcw-log");
    const el = document.createElement("div");
    el.className = "hcw-entry hcw-user";
    el.innerHTML = `<div class="hcw-bubble-msg" style="background:${cfg.primaryColor}">${escapeHtml(text)}</div>`;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
  }
  function renderBot(text) {
    const log = document.getElementById("hcw-log");
    const el = document.createElement("div");
    el.className = "hcw-entry hcw-bot";
    el.innerHTML = `<div class="hcw-bubble-msg">${escapeHtml(text)}</div>`;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
  }
  function renderEscalation(reason) {
    const log = document.getElementById("hcw-log");
    const el = document.createElement("div");
    el.className = "hcw-escalation";
    el.textContent = "🔔 Staff notified — " + reason;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    document.getElementById("hcw-emailrow").classList.add("hcw-show");
  }
  function renderUpsell(upsell) {
    const log = document.getElementById("hcw-log");
    const el = document.createElement("div");
    el.className = "hcw-upsell";
    el.style.background = cfg.accentColor + "26";
    el.style.border = "1px solid " + cfg.accentColor;
    el.style.color = cfg.primaryColor;
    el.textContent = "+ " + upsell.label;
    el.title = upsell.detail || "";
    el.onclick = () => quickAsk("Yes, tell me more about " + upsell.label.toLowerCase());
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
  }
  function typing(show) {
    let el = document.getElementById("hcw-typing-el");
    const log = document.getElementById("hcw-log");
    if (show && !el) {
      el = document.createElement("div");
      el.id = "hcw-typing-el";
      el.className = "hcw-typing";
      el.innerHTML = "<span></span><span></span><span></span>";
      log.appendChild(el);
      log.scrollTop = log.scrollHeight;
    } else if (!show && el) {
      el.remove();
    }
  }

  async function send() {
    const input = document.getElementById("hcw-input");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    document.getElementById("hcw-send").disabled = true;
    renderUser(text);
    history.push({ role: "user", content: text });
    typing(true);

    try {
      const res = await fetch(BACKEND + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, language })
      });
      const parsed = await res.json();
      typing(false);

      if (parsed.error) {
        renderBot(parsed.error);
      } else {
        renderBot(parsed.reply);
        history.push({ role: "assistant", content: JSON.stringify(parsed) });
        if (parsed.escalate) renderEscalation(parsed.reason || "needs staff attention");
        else if (parsed.upsell) renderUpsell(parsed.upsell);
      }
    } catch (err) {
      typing(false);
      renderBot("Something went wrong reaching support — please try again in a moment.");
    }
    document.getElementById("hcw-send").disabled = false;
    input.focus();
  }

  function quickAsk(text) {
    document.getElementById("hcw-input").value = text;
    send();
  }

  function submitEmail() {
    const emailInput = document.getElementById("hcw-email-input");
    const val = emailInput.value.trim();
    if (!val) return;
    document.getElementById("hcw-emailrow").classList.remove("hcw-show");
    emailInput.value = "";
    renderBot("Thank you — the team will follow up at " + val + " shortly. Anything else I can help with?");
  }

  // ---- Wire up events ----
  bubble.addEventListener("click", open);
  document.getElementById("hcw-close").addEventListener("click", close);
  document.getElementById("hcw-send").addEventListener("click", send);
  document.getElementById("hcw-input").addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
  document.getElementById("hcw-email-send").addEventListener("click", submitEmail);
  document.getElementById("hcw-lang").addEventListener("change", (e) => { language = e.target.value; });
  document.getElementById("hcw-upgrade-btn").addEventListener("click", () => quickAsk("What upgrades or add-ons would you recommend for my stay?"));
  document.getElementById("hcw-book-btn").addEventListener("click", () => {
    quickAsk("What are your current rates and how do I book directly?");
    if (cfg.bookingUrl) {
      setTimeout(() => {
        renderBot("You can also book directly on our site here: " + cfg.bookingUrl);
      }, 1200);
    }
  });

  // ---- Load hotel config, then apply branding ----
  fetch(BACKEND + "/api/config")
    .then((r) => r.json())
    .then((data) => {
      cfg = Object.assign(cfg, data);
      applyBranding();
    })
    .catch((e) => console.error("Hotel chatbot: failed to load config", e));
})();
