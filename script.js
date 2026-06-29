/* ==========================================================
   אתר מלווה לסדנת מצגות — מקצועות הבריאות · אונו — סקריפט ראשי
   - ראוטר לפי hash (#/, #/outline, #/images, #/notebook, #/canvas)
   - מרנדר כל מסלול מתוך content.js
   - כפתורי העתקת פרומפט
   - מסנן רעיונות לפי "סוג השימוש" (ציר יחיד)
   - הודעות Toast
   ========================================================== */

(function () {
  "use strict";

  // -------- עוזרי DOM --------
  const $ = (sel, scope = document) => scope.querySelector(sel);
  const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));
  const escapeHTML = (str) =>
    String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  // -------- Toast --------
  let toastTimer;
  function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  // -------- כפתור העתקה (HTML משותף) --------
  function copyButton(text, label) {
    return `
      <button type="button" class="prompt-box__copy" data-copy="${escapeHTML(text)}" aria-label="העתק טקסט">
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M16 1H4a2 2 0 00-2 2v14h2V3h12V1zm3 4H8a2 2 0 00-2 2v14a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2zm0 16H8V7h11v14z" fill="currentColor"/>
        </svg>
        <span>${escapeHTML(label || "העתק")}</span>
      </button>`;
  }

  // -------- רינדור מסלול --------
  function renderTrack(routeKey, data) {
    const section = document.querySelector(`.route[data-route="/${routeKey}"]`);
    if (!section || !data || section.dataset.rendered === "true") return;

    const metaPills = (data.meta || [])
      .map(
        (m) =>
          `<span class="meta-pill ${m.accent ? "meta-pill--accent" : ""}">${escapeHTML(m.text)}</span>`
      )
      .join("");

    const facts = ((data.intro && data.intro.facts) || [])
      .map(
        (f) => `
        <div class="fact">
          <div class="fact__label">${escapeHTML(f.label)}</div>
          <div class="fact__value">${escapeHTML(f.value)}</div>
        </div>`
      )
      .join("");

    const introParagraphs = ((data.intro && data.intro.paragraphs) || [])
      .map((p) => `<p>${p}</p>`)
      .join("");

    const stepsHTML = (data.steps || [])
      .map((step) => {
        const promptHTML = step.prompt
          ? `
            <div class="prompt-box">
              <div class="prompt-box__label">פרומפט מומלץ להעתקה</div>
              <div class="prompt-box__text">${escapeHTML(step.prompt)}</div>
              ${copyButton(step.prompt, "העתק")}
            </div>`
          : "";
        const tipHTML = step.tip ? `<div class="tip">${step.tip}</div>` : "";
        return `
        <li class="step">
          <div class="step__num" aria-hidden="true"></div>
          <div class="step__body">
            <h3 class="step__title">${escapeHTML(step.title)}</h3>
            <div class="step__text">${step.text}</div>
            ${promptHTML}
            ${tipHTML}
          </div>
        </li>`;
      })
      .join("");

    // ----- רעיונות + מסנן "סוג השימוש" (ציר יחיד) -----
    const ideas = data.ideas || [];
    const useCases = [...new Set(ideas.map((i) => i.useCase).filter(Boolean))];
    const showFilters = useCases.length > 1;

    const filtersHTML = showFilters
      ? `
      <div class="filters" role="group" aria-label="סינון לפי סוג השימוש">
        <span class="filters__label">סוג השימוש:</span>
        <button class="filter-chip is-active" data-value="all" type="button">הכל</button>
        ${useCases
          .map(
            (u) =>
              `<button class="filter-chip" data-value="${escapeHTML(u)}" type="button">${escapeHTML(u)}</button>`
          )
          .join("")}
      </div>`
      : "";

    const ideasHTML = ideas
      .map((idea) => {
        const tag = idea.useCase
          ? `<div class="idea__tags"><span class="idea__tag idea__tag--use">${escapeHTML(idea.useCase)}</span></div>`
          : "";
        return `
        <article class="idea" data-usecase="${escapeHTML(idea.useCase || "")}">
          ${tag}
          <h3 class="idea__title">${escapeHTML(idea.title)}</h3>
          <p class="idea__desc">${escapeHTML(idea.desc)}</p>
          <div class="idea__prompt-box">
            <div class="idea__prompt-label">${escapeHTML(idea.promptLabel || "פרומפט מוכן להעתקה")}</div>
            <div class="idea__prompt-text">${escapeHTML(idea.prompt)}</div>
            ${copyButton(idea.prompt, "העתק")}
          </div>
        </article>`;
      })
      .join("");

    const sources = data.sources || [];
    const sourcesHTML = sources
      .map(
        (src) => `
        <a class="source-link" href="${src.url}" target="_blank" rel="noopener">
          <span>${escapeHTML(src.title)}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3z M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7h-2v7z" fill="currentColor"/>
          </svg>
        </a>`
      )
      .join("");

    const moeBlock =
      data.moeNote && typeof MOE_GEMINI_NOTE !== "undefined"
        ? `
        <details class="moe-note">
          <summary class="moe-note__summary">
            <span class="moe-note__icon" aria-hidden="true">🇮🇱</span>
            <span>
              <strong>${escapeHTML(MOE_GEMINI_NOTE.title)}</strong>
              <span class="moe-note__sub">${escapeHTML(MOE_GEMINI_NOTE.summary)}</span>
            </span>
            <span class="moe-note__chev" aria-hidden="true">▾</span>
          </summary>
          <div class="moe-note__body">${MOE_GEMINI_NOTE.body}</div>
        </details>`
        : "";

    // ----- הרכבת מקטעים עם מספור דינמי -----
    const blocks = [];
    blocks.push({
      title: data.introTitle || "מה זה בכלל?",
      id: `intro-${routeKey}`,
      body: `<div class="prose">${introParagraphs}</div>${facts ? `<div class="facts-grid">${facts}</div>` : ""}`,
    });
    if (stepsHTML) {
      blocks.push({
        title: data.stepsTitle || "צעד אחר צעד — מתחילים",
        id: `steps-${routeKey}`,
        body: `<ol class="steps">${stepsHTML}</ol>`,
      });
    }
    if (ideas.length) {
      blocks.push({
        title: data.ideasTitle || "רעיונות ופרומפטים מוכנים",
        id: `ideas-${routeKey}`,
        body: `${filtersHTML}<div class="ideas">${ideasHTML}<div class="no-results" hidden>אין פריטים שמתאימים לסינון. נסו לבחור הכל.</div></div>`,
      });
    }
    if (sources.length) {
      blocks.push({
        title: data.sourcesTitle || "מקורות והעמקה",
        id: `sources-${routeKey}`,
        body: `<div class="sources">${sourcesHTML}</div>`,
      });
    }

    const blocksHTML = blocks
      .map(
        (b, i) => `
      <section class="section-block" aria-labelledby="${b.id}">
        <header class="section-head">
          <span class="section-head__num">${String(i + 1).padStart(2, "0")}</span>
          <h2 class="section-head__title" id="${b.id}">${escapeHTML(b.title)}</h2>
        </header>
        ${b.body}
      </section>`
      )
      .join("");

    section.innerHTML = `
      <header class="track-header">
        <a href="#/" class="track-back">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>חזרה לבחירת מסלול</span>
        </a>
        <div class="track-eyebrow">${escapeHTML(data.eyebrow || "")}</div>
        <h1 class="track-title">
          ${escapeHTML(data.title)}
          <span class="track-title__sub">${escapeHTML(data.subtitle || "")}</span>
        </h1>
        <div class="track-meta">${metaPills}</div>
      </header>

      ${moeBlock}

      ${blocksHTML}

      <div class="track-footer">
        <h3 class="track-footer__title">${escapeHTML(data.footerTitle || "סיימתם? יופי. רוצים לחקור עוד?")}</h3>
        <p class="track-footer__sub">${escapeHTML(data.footerSub || "חזרו לבחור מסלול אחר. כל אחד עצמאי לחלוטין.")}</p>
        <a href="#/" class="track-footer__cta">
          <span>חזרה לבחירת מסלול</span>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      </div>
    `;

    section.dataset.rendered = "true";
    bindTrackInteractions(section);
  }

  // -------- אינטראקציות לכל מסלול (אחרי רינדור) --------
  function bindTrackInteractions(section) {
    // כפתורי העתקה
    $$(".prompt-box__copy", section).forEach((btn) => {
      btn.addEventListener("click", async () => {
        const text = btn.dataset.copy || "";
        try {
          await navigator.clipboard.writeText(text);
          btn.classList.add("is-copied");
          const labelEl = btn.querySelector("span");
          const original = labelEl.textContent;
          labelEl.textContent = "הועתק!";
          showToast("הטקסט הועתק. הדביקו ב-ChatGPT / Gemini / NotebookLM.");
          setTimeout(() => {
            btn.classList.remove("is-copied");
            labelEl.textContent = original;
          }, 1800);
        } catch (err) {
          showToast("לא הצלחתי להעתיק. סמנו ידנית והעתיקו.");
        }
      });
    });

    // מסנן ציר יחיד
    const state = { useCase: "all" };
    $$(".filter-chip", section).forEach((chip) => {
      chip.addEventListener("click", () => {
        chip.parentElement
          .querySelectorAll(".filter-chip")
          .forEach((c) => c.classList.remove("is-active"));
        chip.classList.add("is-active");
        state.useCase = chip.dataset.value;
        applyFilters(section, state);
      });
    });
  }

  function applyFilters(section, state) {
    const ideas = $$(".idea", section);
    let visibleCount = 0;
    ideas.forEach((idea) => {
      const match = state.useCase === "all" || idea.dataset.usecase === state.useCase;
      idea.style.display = match ? "" : "none";
      if (match) visibleCount++;
    });
    const noResults = $(".no-results", section);
    if (noResults) noResults.hidden = visibleCount > 0;
  }

  // -------- ראוטר --------
  const ROUTES = ["outline", "canvas", "images", "notebook"];

  function renderRoute() {
    let route = (location.hash || "#/").replace(/^#/, "");
    if (!route || route === "/") route = "/";

    // רינדור עצל בכניסה ראשונה
    ROUTES.forEach((key) => {
      if (route === "/" + key && typeof TRACKS !== "undefined") {
        renderTrack(key, TRACKS[key]);
      }
    });

    // הצגה/הסתרה
    $$(".route").forEach((el) => {
      const isMatch = el.dataset.route === route;
      el.hidden = !isMatch;
      el.classList.toggle("is-visible", isMatch);
    });

    // ניווט פעיל
    $$(".nav-link").forEach((link) => {
      const active = link.dataset.route === route;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });

    // גלילה למעלה (רק במעבר, לא בטעינה ראשונה)
    if (window.__appBooted) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // כותרת המסמך
    const titleMap = {
      "/": "סדנת מצגות עם AI · מקצועות הבריאות · אונו",
      "/outline": "מסמך המתווה · סדנת מצגות",
      "/images": "ChatGPT Image2 · סדנת מצגות",
      "/notebook": "NotebookLM · סדנת מצגות",
      "/canvas": "Gemini Canvas · סדנת מצגות",
    };
    document.title = titleMap[route] || titleMap["/"];
  }

  // -------- Boot --------
  window.addEventListener("hashchange", renderRoute);
  document.addEventListener("DOMContentLoaded", () => {
    renderRoute();
    window.__appBooted = true;
  });
})();
