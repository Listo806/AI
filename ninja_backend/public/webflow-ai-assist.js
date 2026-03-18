/**
 * CORTEXA AI Assist — Webflow widget (hosted).
 * Webflow → Site settings → Custom code → Footer:
 *   <script src="https://YOUR_API_HOST/static/webflow-ai-assist.js" defer></script>
 * Optional before that script:
 *   <script>window.CORTEXA_AI_CONFIG={ footerSelector:'#site-footer', buttonMargin:20, buttonLiftMobile:88 };</script>
 */
(function () {
  function boot() {
    if (window.__CORTEXA_AI_ASSIST__ || !document.body) return;
    window.__CORTEXA_AI_ASSIST__ = true;

    var userCfg = window.CORTEXA_AI_CONFIG || {};
    var CONFIG = {
      footerSelector: userCfg.footerSelector || 'footer, [data-footer], .footer, #footer',
      buttonMargin: userCfg.buttonMargin != null ? userCfg.buttonMargin : 20,
      buttonLiftMobile: userCfg.buttonLiftMobile != null ? userCfg.buttonLiftMobile : 88
    };

    var NS = 'cortexa-ai';
    var style = document.createElement('style');
    style.textContent = [
      '.' + NS + '-root { --cortexa-blue1: #0f62fe; --cortexa-blue2: #3d8bfd; --cortexa-radius: 16px; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }',
      '.' + NS + '-fab { position: fixed; z-index: 2147483000; right: max(16px, env(safe-area-inset-right)); bottom: calc(' + CONFIG.buttonMargin + 'px + env(safe-area-inset-bottom)); padding: 12px 18px; border: none; border-radius: 999px; cursor: pointer; font-size: 15px; font-weight: 600; color: #fff; background: linear-gradient(135deg, var(--cortexa-blue1), var(--cortexa-blue2)); box-shadow: 0 8px 28px rgba(15,98,254,.35); transition: transform .2s, box-shadow .2s, bottom .35s ease; }',
      '.' + NS + '-fab:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(15,98,254,.42); }',
      '@media (max-width: 768px) { .' + NS + '-fab { bottom: calc(' + (CONFIG.buttonMargin + CONFIG.buttonLiftMobile) + 'px + env(safe-area-inset-bottom)); font-size: 14px; padding: 10px 16px; } }',
      '.' + NS + '-panel { position: fixed; z-index: 2147482999; right: max(16px, env(safe-area-inset-right)); width: min(400px, calc(100vw - 32px)); max-height: min(560px, calc(100vh - 120px - env(safe-area-inset-bottom) - env(safe-area-inset-top))); display: flex; flex-direction: column; background: #fff; border-radius: var(--cortexa-radius); box-shadow: 0 20px 60px rgba(15,23,42,.18), 0 0 0 1px rgba(15,23,42,.06); overflow: hidden; opacity: 0; transform: translateY(16px) scale(.98); pointer-events: none; transition: opacity .28s ease, transform .32s cubic-bezier(.22,1,.36,1); }',
      '.' + NS + '-panel.' + NS + '-open { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }',
      '@media (max-width: 768px) { .' + NS + '-panel { width: calc(100vw - 24px); right: 12px; max-height: min(70vh, calc(100dvh - 140px)); } }',
      '.' + NS + '-close { position: absolute; top: 10px; right: 10px; z-index: 2; width: 36px; height: 36px; border: none; border-radius: 10px; background: rgba(15,23,42,.06); color: #64748b; cursor: pointer; font-size: 18px; line-height: 1; display: flex; align-items: center; justify-content: center; transition: background .15s, color .15s; }',
      '.' + NS + '-close:hover { background: rgba(15,23,42,.1); color: #0f172a; }',
      '.' + NS + '-chat { flex: 1; min-height: 0; overflow-y: auto; padding: 44px 16px 12px; -webkit-overflow-scrolling: touch; }',
      '.' + NS + '-welcome { font-size: 14px; line-height: 1.55; color: #334155; margin-bottom: 14px; padding: 12px 14px; background: linear-gradient(135deg, rgba(15,98,254,.08), rgba(61,139,253,.06)); border-radius: 12px; border: 1px solid rgba(15,98,254,.12); }',
      '.' + NS + '-prompts { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }',
      '.' + NS + '-chip { font-size: 12px; padding: 8px 12px; border-radius: 999px; border: 1px solid #e2e8f0; background: #f8fafc; color: #475569; cursor: pointer; text-align: left; transition: border-color .15s, background .15s; max-width: 100%; }',
      '.' + NS + '-chip:active, .' + NS + '-chip:hover { border-color: var(--cortexa-blue2); background: #eff6ff; color: var(--cortexa-blue1); }',
      '.' + NS + '-msg { margin-bottom: 10px; max-width: 92%; padding: 10px 14px; border-radius: 14px; font-size: 14px; line-height: 1.5; word-break: break-word; }',
      '.' + NS + '-msg-user { margin-left: auto; background: linear-gradient(135deg, var(--cortexa-blue1), var(--cortexa-blue2)); color: #fff; border-bottom-right-radius: 4px; }',
      '.' + NS + '-msg-ai { margin-right: auto; background: #f1f5f9; color: #1e293b; border-bottom-left-radius: 4px; border: 1px solid #e2e8f0; }',
      '.' + NS + '-foot { flex-shrink: 0; padding: 12px; border-top: 1px solid #e2e8f0; background: #fafafa; display: flex; gap: 8px; align-items: stretch; }',
      '.' + NS + '-input { flex: 1; min-width: 0; padding: 12px 14px; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 15px; outline: none; transition: border-color .15s; }',
      '.' + NS + '-input:focus { border-color: var(--cortexa-blue2); }',
      '.' + NS + '-iconbtn { flex-shrink: 0; width: 44px; min-height: 44px; border: none; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; transition: background .15s, opacity .15s; }',
      '.' + NS + '-mic { background: #f1f5f9; color: #475569; }',
      '.' + NS + '-mic:hover { background: #e2e8f0; }',
      '.' + NS + '-mic.' + NS + '-listening { background: #fee2e2; color: #b91c1c; }',
      '.' + NS + '-send { background: linear-gradient(135deg, var(--cortexa-blue1), var(--cortexa-blue2)); color: #fff; }',
      '.' + NS + '-send:hover { opacity: .92; }',
      '.' + NS + '-typing { font-size: 12px; color: #94a3b8; padding: 0 4px 8px; }'
    ].join('');
    document.head.appendChild(style);

    var root = document.createElement('div');
    root.className = NS + '-root';
    root.setAttribute('aria-live', 'polite');

    var fab = document.createElement('button');
    fab.type = 'button';
    fab.className = NS + '-fab';
    fab.setAttribute('aria-label', 'Open AI Assist');
    fab.textContent = '\uD83E\uDD16 AI Assist';

    var panel = document.createElement('div');
    panel.className = NS + '-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'AI Assist');

    // var closeBtn = document.createElement('button');
    // closeBtn.type = 'button';
    // closeBtn.className = NS + '-close';
    // closeBtn.setAttribute('aria-label', 'Close');
    // closeBtn.innerHTML = '&times;';

    var chat = document.createElement('div');
    chat.className = NS + '-chat';

    var welcome = document.createElement('div');
    welcome.className = NS + '-welcome';
    welcome.textContent = "Hi, I'm your AI Real Estate Assistant. What would you like to explore today?";

    var promptsWrap = document.createElement('div');
    promptsWrap.className = NS + '-prompts';
    var prompts = [
      'Find homes under $200K',
      'Best areas for families in Quito',
      'Compare Cumbayá vs Tumbaco',
      'Best investment zones right now',
      'Show me 3-bedroom homes in La Carolina',
      'How do I list my property?',
      'How does your AI match buyers?'
    ];
    var input = document.createElement('input');
    prompts.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = NS + '-chip';
      b.textContent = t;
      b.addEventListener('click', function () {
        input.value = t;
        input.focus();
      });
      promptsWrap.appendChild(b);
    });

    var messagesEl = document.createElement('div');
    messagesEl.className = NS + '-messages';

    chat.appendChild(welcome);
    chat.appendChild(promptsWrap);
    chat.appendChild(messagesEl);

    var foot = document.createElement('div');
    foot.className = NS + '-foot';
    input.type = 'text';
    input.className = NS + '-input';
    input.placeholder = 'Ask anything…';
    input.autocomplete = 'off';

    var mic = document.createElement('button');
    mic.type = 'button';
    mic.className = NS + '-iconbtn ' + NS + '-mic';
    mic.setAttribute('aria-label', 'Voice input');
    mic.textContent = '\uD83C\uDFA4';

    var send = document.createElement('button');
    send.type = 'button';
    send.className = NS + '-iconbtn ' + NS + '-send';
    send.setAttribute('aria-label', 'Send');
    send.textContent = '\u279C';

    foot.appendChild(input);
    foot.appendChild(mic);
    foot.appendChild(send);

    // panel.appendChild(closeBtn);
    panel.appendChild(chat);
    panel.appendChild(foot);
    root.appendChild(panel);
    root.appendChild(fab);
    document.body.appendChild(root);

    /**
     * Panel uses position:fixed; bottom = px from viewport bottom to panel's BOTTOM edge.
     * It must sit just above the FAB — NOT (panel height + fab), which wrongly shoves the panel to the top.
     */
    function positionPanel() {
      if (!open) return;
      var gap = 12;
      var fabTop = fab.getBoundingClientRect().top;
      var bottomPx = window.innerHeight - fabTop + gap;
      if (bottomPx < 8) bottomPx = 8;
      panel.style.bottom = bottomPx + 'px';
      panel.style.top = 'auto';
    }

    var open = false;
    function setOpen(v) {
      open = v;
      panel.classList.toggle(NS + '-open', v);
      fab.setAttribute('aria-expanded', v ? 'true' : 'false');
      if (v) {
        positionPanel();
        requestAnimationFrame(function () {
          positionPanel();
          input.focus();
        });
      }
    }

    fab.addEventListener('click', function () { setOpen(!open); });
    // closeBtn.addEventListener('click', function () { setOpen(false); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) setOpen(false);
    });

    document.addEventListener('click', function (e) {
      if (!open) return;
      if (root.contains(e.target)) return;
      setOpen(false);
    });

    function scrollChat() {
      chat.scrollTop = chat.scrollHeight;
    }

    function addMsg(text, isUser) {
      var d = document.createElement('div');
      d.className = NS + '-msg ' + (isUser ? NS + '-msg-user' : NS + '-msg-ai');
      d.textContent = text;
      messagesEl.appendChild(d);
      scrollChat();
      positionPanel();
    }

    function sendMessage() {
      var t = (input.value || '').trim();
      if (!t) return;
      input.value = '';
      addMsg(t, true);
      if (typeof console !== 'undefined' && console.log) console.log('[CORTEXA AI Assist] send:', t);
      var typing = document.createElement('div');
      typing.className = NS + '-typing';
      typing.textContent = '…';
      messagesEl.appendChild(typing);
      scrollChat();
      setTimeout(function () {
        typing.remove();
        addMsg('Thanks for your message. Connect your webhook or API here to return real answers. (Placeholder response)', false);
      }, 600);
    }

    send.addEventListener('click', sendMessage);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); sendMessage(); }
    });

    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    var recog = null;
    if (SpeechRecognition) {
      recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = 'en-US';
      recog.onresult = function (e) {
        var txt = e.results[0] && e.results[0][0] && e.results[0][0].transcript;
        if (txt) input.value = (input.value ? input.value + ' ' : '') + txt.trim();
        mic.classList.remove(NS + '-listening');
      };
      recog.onerror = function () { mic.classList.remove(NS + '-listening'); };
      recog.onend = function () { mic.classList.remove(NS + '-listening'); };
    }
    mic.addEventListener('click', function () {
      if (!recog) {
        alert('Speech recognition is not supported in this browser.');
        return;
      }
      try {
        mic.classList.add(NS + '-listening');
        recog.start();
      } catch (err) {
        mic.classList.remove(NS + '-listening');
      }
    });

    window.addEventListener('resize', function () { if (open) positionPanel(); });

    var footers = [];
    try {
      document.querySelectorAll(CONFIG.footerSelector).forEach(function (el) { footers.push(el); });
    } catch (e) {}
    if (footers.length && 'IntersectionObserver' in window) {
      var extraBottom = 0;
      var obs = new IntersectionObserver(function (entries) {
        var any = entries.some(function (en) { return en.isIntersecting; });
        extraBottom = any ? 72 : 0;
        fab.style.bottom = 'calc(' + (CONFIG.buttonMargin + extraBottom) + 'px + env(safe-area-inset-bottom)' + (window.innerWidth <= 768 ? ' + ' + CONFIG.buttonLiftMobile + 'px' : '') + ')';
        if (open) positionPanel();
      }, { root: null, rootMargin: '0px', threshold: 0.05 });
      footers.forEach(function (f) { obs.observe(f); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
