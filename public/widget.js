/**
 * ClinicBoost enquiry widget.
 *
 * Drop on a WordPress or Elementor page:
 *   <script src="https://reply.clinicboost.com.au/widget.js" data-clinic="beauty-soiree"></script>
 *
 * Or mount into a placeholder:
 *   <div data-clinicboost="beauty-soiree"></div>
 *   <script src="https://reply.clinicboost.com.au/widget.js"></script>
 *
 * Collapsed: circular bubble, preview text, dismiss.
 * Expanded: header, intro, name, phone, question, send.
 * Theme comes from the clinic: colours, header, intro, icon URL.
 * Renders inside a shadow root so page styles cannot leak in. No build step.
 */
(function () {
  var ATTR_READY = "data-clinicboost-ready";

  function scriptEl() {
    if (document.currentScript) return document.currentScript;
    var list = document.querySelectorAll('script[src*="widget.js"]');
    return list.length ? list[list.length - 1] : null;
  }

  function apiBase(script) {
    if (script && script.src) {
      return script.src.replace(/\/widget\.js(?:\?.*)?$/i, "");
    }
    return "";
  }

  function dismissKey(slug) {
    return "clinicboost-widget-dismissed:" + slug;
  }

  function css(accent) {
    var colour = accent || "#171717";
    return (
      ":host{all:initial;display:block;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#171717;line-height:1.4;}" +
      ".cb *,.cb *::before,.cb *::after{box-sizing:border-box;}" +
      ".cb-collapsed{display:flex;align-items:center;gap:0.75rem;}" +
      ".cb-bubble{width:3.25rem;height:3.25rem;border-radius:999px;border:0;padding:0;background:" +
      colour +
      ";color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;}" +
      ".cb-bubble img{width:100%;height:100%;object-fit:cover;}" +
      ".cb-bubble-fallback{font-size:1.15rem;font-weight:600;line-height:1;}" +
      ".cb-preview{margin:0;font-size:0.875rem;color:#404040;max-width:14rem;}" +
      ".cb-dismiss{border:0;background:transparent;color:#737373;cursor:pointer;font-size:1.1rem;line-height:1;padding:0.25rem;}" +
      ".cb-panel{box-sizing:border-box;max-width:28rem;padding:1rem;border:1px solid #e5e5e5;border-radius:8px;background:#fff;}" +
      ".cb-head{display:flex;align-items:flex-start;justify-content:space-between;gap:0.75rem;margin:0 0 0.5rem;}" +
      "h2{margin:0;font-size:1.05rem;font-weight:600;}" +
      ".cb-intro{margin:0 0 0.85rem;font-size:0.875rem;color:#525252;}" +
      ".cb-close{border:0;background:transparent;color:#737373;cursor:pointer;font-size:1.2rem;line-height:1;padding:0;}" +
      "label{display:block;margin:0 0 0.75rem;font-size:0.875rem;}" +
      "label span{display:block;margin-bottom:0.25rem;font-weight:500;}" +
      "input,textarea{width:100%;padding:0.5rem 0.6rem;border:1px solid #d4d4d4;border-radius:6px;font:inherit;background:#fff;color:#171717;}" +
      "input:focus,textarea:focus,.cb-bubble:focus,.cb-dismiss:focus,.cb-close:focus,button[type=submit]:focus{outline:2px solid " +
      colour +
      ";outline-offset:2px;}" +
      "button[type=submit]{display:inline-block;margin-top:0.25rem;padding:0.5rem 0.9rem;border:0;border-radius:6px;background:" +
      colour +
      ";color:#fff;font:inherit;font-weight:500;cursor:pointer;}" +
      "button:disabled{opacity:0.45;cursor:not-allowed;}" +
      ".cb-msg{margin:0.75rem 0 0;font-size:0.875rem;}" +
      ".cb-msg.is-error{color:#b91c1c;}" +
      ".cb-msg.is-ok{color:#166534;}"
    );
  }

  function mount(host, slug, base) {
    if (host.getAttribute(ATTR_READY)) return;
    host.setAttribute(ATTR_READY, "1");

    try {
      if (window.sessionStorage.getItem(dismissKey(slug))) return;
    } catch (e) {
      /* sessionStorage can be blocked; the widget still works. */
    }

    var root = host.attachShadow({ mode: "open" });
    var wrap = document.createElement("div");
    wrap.className = "cb";
    wrap.setAttribute("data-clinicboost-widget", slug);

    var style = document.createElement("style");
    root.appendChild(style);
    root.appendChild(wrap);

    var heading = "Ask us a question";
    var intro = "Leave your name, mobile and question. We will text you back.";
    var preview = "Ask us a question";
    var buttonLabel = "Send";
    var accent = "#171717";
    var iconUrl = "";

    function renderCollapsed() {
      wrap.className = "cb cb-collapsed";
      wrap.innerHTML =
        "<button type='button' class='cb-bubble' aria-label='Open enquiry form'></button>" +
        "<p class='cb-preview'></p>" +
        "<button type='button' class='cb-dismiss' aria-label='Dismiss'>&times;</button>";
      var bubble = wrap.querySelector(".cb-bubble");
      var previewEl = wrap.querySelector(".cb-preview");
      var dismiss = wrap.querySelector(".cb-dismiss");
      previewEl.textContent = preview;
      if (iconUrl) {
        var img = document.createElement("img");
        img.src = iconUrl;
        img.alt = "";
        bubble.appendChild(img);
      } else {
        var mark = document.createElement("span");
        mark.className = "cb-bubble-fallback";
        mark.textContent = (heading || "A").charAt(0).toUpperCase();
        bubble.appendChild(mark);
      }
      bubble.addEventListener("click", renderPanel);
      dismiss.addEventListener("click", function () {
        try {
          window.sessionStorage.setItem(dismissKey(slug), "1");
        } catch (e) {
          /* ignore */
        }
        wrap.remove();
      });
    }

    function renderPanel() {
      wrap.className = "cb";
      wrap.innerHTML =
        "<div class='cb-panel'>" +
        "<div class='cb-head'><h2></h2><button type='button' class='cb-close' aria-label='Collapse'>&times;</button></div>" +
        "<p class='cb-intro'></p>" +
        "<form>" +
        "<label><span>Name</span><input name='name' type='text' autocomplete='name' required maxlength='100'></label>" +
        "<label><span>Mobile</span><input name='mobile' type='tel' autocomplete='tel' required placeholder='0405 000 000'></label>" +
        "<label><span>Question</span><textarea name='question' rows='4' required maxlength='1000'></textarea></label>" +
        "<button type='submit'></button>" +
        "</form>" +
        "<p class='cb-msg' hidden></p>" +
        "</div>";

      var title = wrap.querySelector("h2");
      var introEl = wrap.querySelector(".cb-intro");
      var form = wrap.querySelector("form");
      var button = wrap.querySelector("button[type=submit]");
      var msg = wrap.querySelector(".cb-msg");
      var close = wrap.querySelector(".cb-close");
      title.textContent = heading;
      introEl.textContent = intro;
      button.textContent = buttonLabel;
      close.addEventListener("click", renderCollapsed);

      function show(kind, text) {
        msg.hidden = false;
        msg.className = "cb-msg " + (kind === "error" ? "is-error" : "is-ok");
        msg.textContent = text;
      }

      form.addEventListener("submit", function (event) {
        event.preventDefault();
        msg.hidden = true;
        button.disabled = true;
        button.textContent = "Sending...";

        var data = {
          name: form.name.value,
          mobile: form.mobile.value,
          question: form.question.value,
        };

        fetch(endpoint, {
          method: "POST",
          credentials: "omit",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
          .then(function (res) {
            return res.json().then(function (body) {
              return { ok: res.ok, status: res.status, body: body };
            });
          })
          .then(function (result) {
            if (result.ok && result.body && result.body.received) {
              form.reset();
              show("ok", "Thanks. We will text you shortly.");
              return;
            }
            var err =
              (result.body && result.body.error) ||
              "Could not send. Please try again.";
            show("error", err);
          })
          .catch(function () {
            show("error", "Could not send. Please try again.");
          })
          .then(function () {
            button.disabled = false;
            button.textContent = buttonLabel;
          });
      });
    }

    var endpoint = (base || "") + "/api/widget/" + encodeURIComponent(slug);
    style.textContent = css(accent);
    renderCollapsed();

    fetch(endpoint, { method: "GET", credentials: "omit" })
      .then(function (res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function (config) {
        if (!config) return;
        var theme = config.theme || {};
        if (theme.heading) heading = theme.heading;
        else if (config.name) heading = config.name;
        if (theme.intro) intro = theme.intro;
        if (theme.preview) preview = theme.preview;
        if (theme.buttonLabel) buttonLabel = theme.buttonLabel;
        if (theme.accent) accent = theme.accent;
        if (theme.iconUrl) iconUrl = theme.iconUrl;
        style.textContent = css(accent);
        if (wrap.classList.contains("cb-collapsed")) renderCollapsed();
        else {
          var title = wrap.querySelector("h2");
          var introEl = wrap.querySelector(".cb-intro");
          var button = wrap.querySelector("button[type=submit]");
          if (title) title.textContent = heading;
          if (introEl) introEl.textContent = intro;
          if (button) button.textContent = buttonLabel;
        }
      })
      .catch(function () {
        /* Form still works with defaults if theme fetch fails. */
      });
  }

  function boot() {
    var script = scriptEl();
    var base = apiBase(script);

    if (script) {
      var fromScript = script.getAttribute("data-clinic");
      if (fromScript && !script.getAttribute(ATTR_READY)) {
        var host = document.createElement("div");
        script.parentNode.insertBefore(host, script.nextSibling);
        mount(host, fromScript, base);
        script.setAttribute(ATTR_READY, "1");
      }
    }

    var nodes = document.querySelectorAll(
      "[data-clinicboost]:not([" + ATTR_READY + "])",
    );
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var slug = node.getAttribute("data-clinicboost");
      if (slug) mount(node, slug, base);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  var observer = new MutationObserver(function () {
    boot();
  });
  if (document.documentElement) {
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }
})();
