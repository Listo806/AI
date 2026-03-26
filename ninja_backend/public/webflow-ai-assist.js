/**
 * CORTEXA AI Assist — Webflow widget (hosted).
 *
 * Webflow → Site settings → Custom code → Footer:
 *   <script src="https://YOUR_API_HOST/static/webflow-ai-assist.js" defer></script>
 *
 * Base URL (first match wins):
 *   1) CORTEXA_AI_CONFIG.apiBaseUrl
 *   2) window.BACKEND_API_BASE_URL
 *   3) Global BACKEND_API_BASE_URL from another classic script (const/var — NOT type="module")
 *
 * Script order: define BACKEND_API_BASE_URL in a <script> that runs BEFORE this file.
 * Optional CORTEXA_AI_CONFIG: apiPrefix, siteAssistApiKey, footerSelector, …
 *
 * Locale: uses session-locked language (sessionStorage "marketplace_ai_lang_lock")
 *   derived from marketplace_lang/browser on first use; never changes mid-conversation.
 * Session: in-memory only (per page load). Each new visit / reload gets welcome + buttons again;
 *   same tab keeps chat while the page stays open.
 *
 * Optional: footerSelector, buttonMargin, buttonLiftMobile
 */
(function () {
    function boot() {
      if (window.__CORTEXA_AI_ASSIST__ || !document.body) return;
      window.__CORTEXA_AI_ASSIST__ = true;
  
      var userCfg = window.CORTEXA_AI_CONFIG || {};
  
      /**
       * Same host may define `const BACKEND_API_BASE_URL = "..."` in another script — that is NOT
       * on window, but (classic scripts) it is a global binding. `typeof NAME` is safe if missing.
       */
      function resolveRawApiBase() {
        var cfg = window.CORTEXA_AI_CONFIG || {};
        var a = cfg.apiBaseUrl && String(cfg.apiBaseUrl).trim();
        if (a) return a;
        if (typeof window.BACKEND_API_BASE_URL === 'string' && window.BACKEND_API_BASE_URL.trim()) {
          return window.BACKEND_API_BASE_URL.trim();
        }
        if (typeof BACKEND_API_BASE_URL !== 'undefined' && BACKEND_API_BASE_URL != null) {
          var g = String(BACKEND_API_BASE_URL).trim();
          if (g) return g;
        }
        return '';
      }
  
      var CONFIG = {
        footerSelector: userCfg.footerSelector || 'footer, [data-footer], .footer, #footer',
        buttonMargin: userCfg.buttonMargin != null ? userCfg.buttonMargin : 20,
        buttonLiftMobile: userCfg.buttonLiftMobile != null ? userCfg.buttonLiftMobile : 88,
        apiBaseUrl: resolveRawApiBase().replace(/\/$/, ''),
        apiPrefix: (userCfg.apiPrefix || 'api').replace(/^\/|\/$/g, ''),
        siteAssistApiKey: userCfg.siteAssistApiKey || userCfg.siteAssistKey || ''
      };
  
      var useApi = !!CONFIG.apiBaseUrl;
  
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
        '.' + NS + '-chat.' + NS + '-api-mode { padding-top: 16px; }',
        '.' + NS + '-welcome { font-size: 14px; line-height: 1.55; color: #334155; margin-bottom: 14px; padding: 12px 14px; background: linear-gradient(135deg, rgba(15,98,254,.08), rgba(61,139,253,.06)); border-radius: 12px; border: 1px solid rgba(15,98,254,.12); }',
        '.' + NS + '-hint { font-size: 12px; color: #64748b; margin-bottom: 10px; padding: 0 4px; }',
        '.' + NS + '-prompts { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }',
        '.' + NS + '-chip { font-size: 12px; padding: 8px 12px; border-radius: 999px; border: 1px solid #e2e8f0; background: #f8fafc; color: #475569; cursor: pointer; text-align: left; transition: border-color .15s, background .15s; max-width: 100%; }',
        '.' + NS + '-chip:active, .' + NS + '-chip:hover { border-color: var(--cortexa-blue2); background: #eff6ff; color: var(--cortexa-blue1); }',
        '.' + NS + '-chip:disabled { opacity: 0.5; cursor: not-allowed; }',
        '.' + NS + '-turn { margin-bottom: 14px; }',
        '.' + NS + '-msg { margin-bottom: 10px; max-width: 92%; padding: 10px 14px; border-radius: 14px; font-size: 14px; line-height: 1.5; word-break: break-word; }',
        '.' + NS + '-msg-user { margin-left: auto; background: linear-gradient(135deg, var(--cortexa-blue1), var(--cortexa-blue2)); color: #fff; border-bottom-right-radius: 4px; }',
        '.' + NS + '-msg-ai { margin-right: auto; background: #f1f5f9; color: #1e293b; border-bottom-left-radius: 4px; border: 1px solid #e2e8f0; }',
        '.' + NS + '-msg-ai .' + NS + '-inmsg-link { color: var(--cortexa-blue1); font-weight: 600; text-decoration: underline; word-break: break-all; }',
        '.' + NS + '-msg-ai .' + NS + '-inmsg-link:hover { opacity: 0.9; }',
        '.' + NS + '-api-btns { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; margin-bottom: 4px; }',
        '.' + NS + '-linkrow { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }',
        '.' + NS + '-linkbtn { display: inline-flex; align-items: center; padding: 8px 12px; border-radius: 10px; background: #eff6ff; color: var(--cortexa-blue1); font-size: 13px; font-weight: 600; text-decoration: none; border: 1px solid rgba(15,98,254,.2); }',
        '.' + NS + '-linkbtn:hover { background: #dbeafe; }',
        '.' + NS + '-foot { flex-shrink: 0; padding: 12px; border-top: 1px solid #e2e8f0; background: #fafafa; display: flex; gap: 8px; align-items: stretch; }',
        '.' + NS + '-input { flex: 1; min-width: 0; padding: 12px 14px; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 15px; outline: none; transition: border-color .15s; }',
        '.' + NS + '-input:focus { border-color: var(--cortexa-blue2); }',
        '.' + NS + '-input:disabled { background: #f1f5f9; color: #94a3b8; }',
        '.' + NS + '-iconbtn { flex-shrink: 0; width: 44px; min-height: 44px; border: none; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; transition: background .15s, opacity .15s; }',
        '.' + NS + '-iconbtn:disabled { opacity: 0.45; cursor: not-allowed; }',
        '.' + NS + '-mic { background: #f1f5f9; color: #475569; }',
        '.' + NS + '-mic:hover { background: #e2e8f0; }',
        '.' + NS + '-mic.' + NS + '-listening { background: #fee2e2; color: #b91c1c; }',
        '.' + NS + '-send { background: linear-gradient(135deg, var(--cortexa-blue1), var(--cortexa-blue2)); color: #fff; }',
        '.' + NS + '-send:hover { opacity: .92; }',
        '.' + NS + '-typing { font-size: 12px; color: #94a3b8; padding: 0 4px 8px; }',
        '.' + NS + '-err { font-size: 13px; color: #b91c1c; padding: 8px 12px; background: #fef2f2; border-radius: 10px; margin-bottom: 8px; }'
      ].join('');
      document.head.appendChild(style);
  
      function normalizeLocale(raw) {
        var code = String(raw || '').toLowerCase().split('-')[0];
        if (code === 'es') return 'es';
        if (code === 'pt') return 'pt';
        return 'en';
      }
  
      function getLocale() {
        try {
          return normalizeLocale(localStorage.getItem('marketplace_lang') || 'en');
        } catch (e) {
          return 'en';
        }
      }
  
      function getSpeechLang(locale) {
        if (locale === 'es') return 'es-ES';
        if (locale === 'pt') return 'pt-BR';
        return 'en-US';
      }
  
      /** Input placeholder strings — follow site/toggle language (uiLocale), not API lock. */
      function placeholderAsk(loc) {
        if (loc === 'es') return 'Pregunta lo que quieras...';
        if (loc === 'pt') return 'Pergunte qualquer coisa...';
        return 'Ask anything...';
      }
      function placeholderThinking(loc) {
        if (loc === 'es' || loc === 'pt') return 'Pensando...';
        return 'Thinking...';
      }
  
      /** Site-visible language (localStorage + toggle). API body still uses getLockedLocale(). */
      var uiLocale = getLocale();
  
      var sessionId = '';
      var requestBusy = false;
      var panelBootstrapped = false;
      var warnedNoApi = false;
      var messagesCount = 0;
      var AI_LANG_LOCK_KEY = 'marketplace_ai_lang_lock';
  
      function hasConversationStarted() {
        return !!sessionId || messagesCount > 0;
      }
  
      function getLockedLocale() {
        try {
          var locked = sessionStorage.getItem(AI_LANG_LOCK_KEY);
          if (locked) return normalizeLocale(locked);
        } catch (e) {}
        var initial = getLocale();
        try {
          sessionStorage.setItem(AI_LANG_LOCK_KEY, initial);
        } catch (e) {}
        return initial;
      }
  
      function setLockedLocale(nextLocale, force) {
        var next = normalizeLocale(nextLocale || 'en');
        if (!force && hasConversationStarted()) return getLockedLocale();
        try {
          sessionStorage.setItem(AI_LANG_LOCK_KEY, next);
        } catch (e) {}
        return next;
      }
  
      function turnUrl() {
        return CONFIG.apiBaseUrl + '/' + CONFIG.apiPrefix + '/public/site-assist/turn';
      }
  
      function callTurn(body) {
        var headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
        if (CONFIG.siteAssistApiKey) headers['X-Site-Assist-Key'] = CONFIG.siteAssistApiKey;
        return fetch(turnUrl(), {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(body),
          credentials: 'omit'
        }).then(function (res) {
          return res.text().then(function (text) {
            var data = null;
            try {
              data = text ? JSON.parse(text) : null;
            } catch (e) {}
            if (!res.ok) {
              var msg = (data && data.message) || text || res.statusText || 'Request failed';
              if (Array.isArray(msg)) msg = msg.join(' ');
              throw new Error(typeof msg === 'string' ? msg : 'Request failed');
            }
            return data;
          });
        });
      }
  
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
  
      var chat = document.createElement('div');
      chat.className = NS + '-chat' + (useApi ? ' ' + NS + '-api-mode' : '');
  
      var welcome = document.createElement('div');
      welcome.className = NS + '-welcome';
      if (useApi) {
        welcome.style.display = 'none';
      } else {
        welcome.innerHTML = "AI Property Matchmaker <br> Tell me what you're looking for";
      }
  
      var promptsWrap = document.createElement('div');
      promptsWrap.className = NS + '-prompts';
      promptsWrap.style.display = useApi ? 'none' : '';
  
      var messagesEl = document.createElement('div');
      messagesEl.className = NS + '-messages';
  
      chat.appendChild(welcome);
      chat.appendChild(promptsWrap);
      chat.appendChild(messagesEl);
  
      function syncApiBaseFromPage() {
        var next = resolveRawApiBase().replace(/\/$/, '');
        if (!next) return;
        var wasOff = !useApi;
        CONFIG.apiBaseUrl = next;
        useApi = true;
        if (wasOff) {
          chat.classList.add(NS + '-api-mode');
          welcome.style.display = 'none';
          promptsWrap.style.display = 'none';
        }
      }
  
      var foot = document.createElement('div');
      foot.className = NS + '-foot';
      var input = document.createElement('input');
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
      var sendDefaultLabel = send.textContent;
      var inputDefaultPlaceholder = input.placeholder;
      input.placeholder = placeholderAsk(uiLocale);
      inputDefaultPlaceholder = input.placeholder;
  
      foot.appendChild(input);
      foot.appendChild(mic);
      foot.appendChild(send);
  
      panel.appendChild(chat);
      panel.appendChild(foot);
      root.appendChild(panel);
      root.appendChild(fab);
      document.body.appendChild(root);
  
      function positionPanel() {
        if (!open) return;
        var gap = 4;
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
          syncApiBaseFromPage();
          if (!useApi && !warnedNoApi && typeof console !== 'undefined' && console.warn) {
            warnedNoApi = true;
            console.warn(
              '[CORTEXA AI Assist] No API base URL — placeholder mode. ' +
                'Use const BACKEND_API_BASE_URL = "https://..."; in a script that runs before this file, ' +
                'or window.BACKEND_API_BASE_URL / CORTEXA_AI_CONFIG.apiBaseUrl. Check script order in Webflow (head vs footer).'
            );
          }
          if (useApi && !panelBootstrapped) {
            panelBootstrapped = true;
            bootstrapPanel();
          }
          positionPanel();
          requestAnimationFrame(function () {
            positionPanel();
            input.focus();
          });
        }
      }
  
      function setBusy(b) {
        requestBusy = b;
        input.disabled = b;
        send.disabled = b;
        mic.disabled = b;
        if (b) {
          send.textContent = '...';
          input.placeholder = placeholderThinking(uiLocale);
        } else {
          send.textContent = sendDefaultLabel;
          input.placeholder = inputDefaultPlaceholder;
        }
      }
  
      function scrollChat() {
        chat.scrollTop = chat.scrollHeight;
      }
  
      /** Strip trailing punctuation often glued to pasted URLs */
      function trimUrlForHref(raw) {
        return raw.replace(/[),.;:!?'"\]]+$/g, '');
      }
  
      /** Assistant bubbles: turn http(s) URLs into real <a> links (safe — no HTML injection). */
      function fillAssistantMessageEl(el, text) {
        var s = text == null ? '' : String(text);
        var re = /https?:\/\/[^\s<>\u00A0]+/gi;
        var last = 0;
        var m;
        while ((m = re.exec(s)) !== null) {
          if (m.index > last) {
            el.appendChild(document.createTextNode(s.slice(last, m.index)));
          }
          var raw = m[0];
          var href = trimUrlForHref(raw);
          var a = document.createElement('a');
          a.href = href;
          a.textContent = raw;
          a.className = NS + '-inmsg-link';
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          el.appendChild(a);
          last = m.index + raw.length;
        }
        if (last < s.length) {
          el.appendChild(document.createTextNode(s.slice(last)));
        }
      }
  
      function addMsg(text, isUser) {
        var d = document.createElement('div');
        d.className = NS + '-msg ' + (isUser ? NS + '-msg-user' : NS + '-msg-ai');
        if (isUser) {
          d.textContent = text;
        } else {
          fillAssistantMessageEl(d, text);
        }
        messagesEl.appendChild(d);
        messagesCount += 1;
        scrollChat();
        positionPanel();
      }
  
      function addError(text) {
        var d = document.createElement('div');
        d.className = NS + '-err';
        d.textContent = text;
        messagesEl.appendChild(d);
        scrollChat();
        positionPanel();
      }
  
      function addAssistantTurn(data) {
        if (data.sessionId) sessionId = data.sessionId;
        var wrap = document.createElement('div');
        wrap.className = NS + '-turn';
  
        var msg = document.createElement('div');
        msg.className = NS + '-msg ' + NS + '-msg-ai';
        fillAssistantMessageEl(msg, data.text || '');
        wrap.appendChild(msg);
  
        if (data.links && data.links.length) {
          var lk = document.createElement('div');
          lk.className = NS + '-linkrow';
          data.links.forEach(function (l) {
            if (!l || !l.url) return;
            var a = document.createElement('a');
            a.href = l.url;
            a.textContent = l.label || l.url;
            a.className = NS + '-linkbtn';
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            lk.appendChild(a);
          });
          if (lk.children.length) wrap.appendChild(lk);
        }
  
        if (data.buttons && data.buttons.length) {
          var br = document.createElement('div');
          br.className = NS + '-api-btns';
          data.buttons.forEach(function (b) {
            if (!b || !b.id) return;
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = NS + '-chip';
            btn.textContent = b.label || b.id;
            (function (actionId, label) {
              btn.addEventListener('click', function () {
                if (requestBusy) return;
                addMsg(label, true);
                sendTurn({ actionId: actionId });
              });
            })(b.id, b.label || b.id);
            br.appendChild(btn);
          });
          if (br.children.length) wrap.appendChild(br);
        }
  
        messagesEl.appendChild(wrap);
        messagesCount += 1;
        scrollChat();
        positionPanel();
      }
  
      function removeTyping() {
        var t = messagesEl.querySelector('.' + NS + '-typing');
        if (t) t.remove();
      }
  
      function showTyping() {
        removeTyping();
        var typing = document.createElement('div');
        typing.className = NS + '-typing';
        typing.textContent = '…';
        messagesEl.appendChild(typing);
        scrollChat();
      }
  
      function sendTurn(opts) {
        opts = opts || {};
        if (!useApi) return;
        if (requestBusy) return;
  
        var body = { locale: getLockedLocale() };
        if (sessionId) body.sessionId = sessionId;
        if (opts.message) body.message = opts.message;
        if (opts.actionId) body.actionId = opts.actionId;
  
        if (body.sessionId && !body.message && !body.actionId) {
          addError('Invalid request.');
          return;
        }
  
        setBusy(true);
        showTyping();
  
        callTurn(body)
          .then(function (data) {
            removeTyping();
            if (!data) return;
            if (data.sessionId) sessionId = data.sessionId;
            addAssistantTurn(data);
          })
          .catch(function (err) {
            removeTyping();
            var m = (err && err.message) || 'Something went wrong.';
            if (m.indexOf('404') !== -1 || /session not found/i.test(m)) {
              sessionId = '';
              messagesEl.innerHTML = '';
              messagesCount = 0;
              setLockedLocale(getLocale(), true);
              if (open) bootstrapPanel();
              return;
            }
            if (!sessionId) panelBootstrapped = false;
            addError(m);
          })
          .finally(function () {
            setBusy(false);
            positionPanel();
            if (open) {
              requestAnimationFrame(function () {
                try {
                  input.focus({ preventScroll: true });
                } catch (e) {
                  input.focus();
                }
              });
            }
          });
      }
  
      function bootstrapPanel() {
        setLockedLocale(getLocale(), false);
        sendTurn({});
      }
  
      fab.addEventListener('click', function () {
        setOpen(!open);
      });
  
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && open) setOpen(false);
      });
  
      document.addEventListener('click', function (e) {
        if (!open) return;
        if (root.contains(e.target)) return;
        setOpen(false);
      });
  
      function sendMessage() {
        var t = (input.value || '').trim();
        if (!t || requestBusy) return;
        input.value = '';
        addMsg(t, true);
  
        if (useApi) {
          sendTurn({ message: t });
          return;
        }
  
        if (typeof console !== 'undefined' && console.log) console.log('[CORTEXA AI Assist] send:', t);
        showTyping();
        setTimeout(function () {
          removeTyping();
          addMsg('Thanks for your message. Connect your webhook or API here to return real answers. (Placeholder response)', false);
        }, 600);
      }
  
      send.addEventListener('click', sendMessage);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          sendMessage();
        }
      });
  
      var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      var recog = null;
      if (SpeechRecognition) {
        recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = false;
        recog.lang = getSpeechLang(uiLocale);
        recog.onresult = function (e) {
          var txt = e.results[0] && e.results[0][0] && e.results[0][0].transcript;
          if (txt) input.value = (input.value ? input.value + ' ' : '') + txt.trim();
          mic.classList.remove(NS + '-listening');
        };
        recog.onerror = function () {
          mic.classList.remove(NS + '-listening');
        };
        recog.onend = function () {
          mic.classList.remove(NS + '-listening');
        };
      }
      mic.addEventListener('click', function () {
        if (requestBusy) return;
        if (!recog) {
          alert('Speech recognition is not supported in this browser.');
          return;
        }
        try {
          recog.lang = getSpeechLang(uiLocale);
          mic.classList.add(NS + '-listening');
          recog.start();
        } catch (err) {
          mic.classList.remove(NS + '-listening');
        }
      });
  
      window.addEventListener('resize', function () {
        if (open) positionPanel();
      });
  
      // UI follows site toggle immediately; API locale remains getLockedLocale() after chat starts.
      window.addEventListener('languageChanged', function (ev) {
        var raw = ev && ev.detail && ev.detail.language != null ? ev.detail.language : getLocale();
        uiLocale = normalizeLocale(raw);
        setLockedLocale(uiLocale, false);
        if (recog) recog.lang = getSpeechLang(uiLocale);
        inputDefaultPlaceholder = placeholderAsk(uiLocale);
        input.placeholder = requestBusy ? placeholderThinking(uiLocale) : inputDefaultPlaceholder;
      });
  
      var footers = [];
      try {
        document.querySelectorAll(CONFIG.footerSelector).forEach(function (el) {
          footers.push(el);
        });
      } catch (e) {}
      if (footers.length && 'IntersectionObserver' in window) {
        var extraBottom = 0;
        var obs = new IntersectionObserver(
          function (entries) {
            var any = entries.some(function (en) {
              return en.isIntersecting;
            });
            extraBottom = any ? 72 : 0;
            fab.style.bottom =
              'calc(' +
              (CONFIG.buttonMargin + extraBottom) +
              'px + env(safe-area-inset-bottom)' +
              (window.innerWidth <= 768 ? ' + ' + CONFIG.buttonLiftMobile + 'px' : '') +
              ')';
            if (open) positionPanel();
          },
          { root: null, rootMargin: '0px', threshold: 0.05 }
        );
        footers.forEach(function (f) {
          obs.observe(f);
        });
      }
    }
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  })();
  