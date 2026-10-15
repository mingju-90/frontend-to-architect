(() => {
  const guide = window.ARCHITECT_GUIDE;
  const chapters = guide.chapters.map((chapter, index) => ({
    ...chapter,
    index: index + 1,
  }));
  const stageById = new Map(guide.stages.map((stage) => [stage.id, stage]));
  const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter]));
  const progressKey = "frontend-to-architect.progress.v1";
  const mastered = new Set(loadJSON(progressKey, []));
  const expanded = new Set();

  const state = {
    level: "all",
    status: "all",
    query: "",
    allExpanded: false,
  };

  const chapterNav = document.querySelector("#chapterNav");
  const growthTrack = document.querySelector("#growthTrack");
  const chapterList = document.querySelector("#chapterList");
  const nextStep = document.querySelector("#nextStep");
  const resultLine = document.querySelector("#resultLine");
  const searchInput = document.querySelector("#searchInput");
  const toggleExpand = document.querySelector("#toggleExpand");
  const overallProgress = document.querySelector("#overallProgress");
  const overallProgressText = document.querySelector("#overallProgressText");
  const sidebarProgressText = document.querySelector("#sidebarProgressText");
  const toast = document.querySelector("#toast");
  let toastTimer;

  function loadJSON(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      showToast("浏览器阻止了本地存储，本次进度仅在当前页面有效");
    }
  }

  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
  }

  function stageChapters(stageId) {
    return chapters.filter((chapter) => chapter.stageId === stageId);
  }

  function stageStats(stageId) {
    const items = stageChapters(stageId);
    const done = items.filter((chapter) => mastered.has(chapter.id)).length;
    return {
      total: items.length,
      done,
      percent: items.length ? Math.round((done / items.length) * 100) : 0,
    };
  }

  function chapterSearchText(chapter) {
    return [
      chapter.title,
      chapter.subtitle,
      chapter.summary,
      chapter.why,
      chapter.practice,
      chapter.architectLens,
      ...chapter.tags,
      ...chapter.goals,
      ...chapter.acceptance,
      ...chapter.pitfalls,
      ...chapter.core.flatMap((section) => [
        section.heading,
        ...section.paragraphs,
        ...(section.bullets || []),
        section.code?.text || "",
      ]),
    ]
      .join(" ")
      .toLowerCase();
  }

  function chapterMatches(chapter) {
    const levelMatches = state.level === "all" || chapter.level === state.level;
    const done = mastered.has(chapter.id);
    const statusMatches =
      state.status === "all" ||
      (state.status === "done" && done) ||
      (state.status === "open" && !done);
    const query = state.query.trim().toLowerCase();
    return levelMatches && statusMatches && (!query || chapterSearchText(chapter).includes(query));
  }

  function renderNav() {
    chapterNav.innerHTML = guide.stages
      .map((stage) => {
        const stats = stageStats(stage.id);
        return `
          <section class="nav-stage">
            <button class="nav-stage-button" type="button" data-stage="${stage.id}">
              <strong>${escapeHTML(stage.title)}</strong>
              <span>${stats.done}/${stats.total}</span>
            </button>
            ${stageChapters(stage.id)
              .map(
                (chapter) => `
                  <button
                    class="nav-chapter${mastered.has(chapter.id) ? " is-done" : ""}"
                    type="button"
                    data-go-chapter="${chapter.id}"
                  >
                    <span class="nav-chapter-no">${String(chapter.index).padStart(2, "0")}</span>
                    <span class="nav-chapter-title">${escapeHTML(chapter.title)}</span>
                    <span class="nav-state" aria-hidden="true"></span>
                  </button>
                `,
              )
              .join("")}
          </section>
        `;
      })
      .join("");
  }

  function renderGrowthTrack() {
    growthTrack.innerHTML = guide.stages
      .map((stage) => {
        const stats = stageStats(stage.id);
        const className =
          stats.done === stats.total
            ? " is-complete"
            : stats.done > 0
              ? " is-active"
              : "";
        return `
          <button class="growth-step${className}" type="button" data-stage="${stage.id}">
            <strong>${escapeHTML(stage.title)}</strong>
            <span>${stats.done}/${stats.total} 章 · ${stats.percent}%</span>
          </button>
        `;
      })
      .join("");
  }

  function renderCoreSection(section) {
    return `
      <section class="article-section">
        <h4>${escapeHTML(section.heading)}</h4>
        ${section.paragraphs.map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`).join("")}
        ${
          section.bullets?.length
            ? `<ul class="article-bullets">${section.bullets
                .map((item) => `<li>${escapeHTML(item)}</li>`)
                .join("")}</ul>`
            : ""
        }
        ${
          section.code
            ? `<pre><code>${escapeHTML(section.code.text)}</code></pre>`
            : ""
        }
      </section>
    `;
  }

  function renderChapter(chapter) {
    const done = mastered.has(chapter.id);
    const isExpanded =
      state.allExpanded || expanded.has(chapter.id) || Boolean(state.query.trim());
    return `
      <article class="chapter${done ? " is-done" : ""}" data-chapter-id="${chapter.id}">
        <div class="chapter-head">
          <label class="chapter-check" aria-label="标记 ${escapeHTML(chapter.title)} 已掌握">
            <input
              type="checkbox"
              data-chapter-check="${chapter.id}"
              ${done ? "checked" : ""}
            />
          </label>
          <button
            class="chapter-toggle"
            type="button"
            data-chapter-toggle="${chapter.id}"
            aria-expanded="${isExpanded}"
          >
            <span class="chapter-title-row">
              <span class="level-tag level-${chapter.level.toLowerCase()}">${chapter.level}</span>
              <h3>${escapeHTML(chapter.title)}</h3>
            </span>
            <span class="chapter-subtitle">${escapeHTML(chapter.subtitle)}</span>
            <p class="chapter-summary">${escapeHTML(chapter.summary)}</p>
            <span class="chapter-meta">
              ${chapter.tags.map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`).join("")}
            </span>
          </button>
          <span class="chapter-side">
            ${done ? "已掌握" : `<span>${String(chapter.index).padStart(2, "0")}</span>`}
            <span class="chevron" aria-hidden="true"></span>
          </span>
        </div>
        <div class="chapter-body" ${isExpanded ? "" : "hidden"}>
          <div class="article-section">
            <h4>为什么学</h4>
            <p>${escapeHTML(chapter.why)}</p>
          </div>

          ${chapter.core.map(renderCoreSection).join("")}

          <div class="article-section">
            <div class="article-grid">
              <div>
                <h4>学习目标</h4>
                <ul class="article-list">
                  ${chapter.goals.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}
                </ul>
              </div>
              <div>
                <h4>实践验收</h4>
                <p>${escapeHTML(chapter.practice)}</p>
                <ul class="article-list">
                  ${chapter.acceptance
                    .map((item) => `<li>${escapeHTML(item)}</li>`)
                    .join("")}
                </ul>
              </div>
            </div>
          </div>

          <div class="article-section">
            <h4>常见误区</h4>
            <ul class="article-list">
              ${chapter.pitfalls.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}
            </ul>
          </div>

          <aside class="architect-lens">
            <h4>全栈架构师视角</h4>
            <p>${escapeHTML(chapter.architectLens)}</p>
          </aside>
        </div>
      </article>
    `;
  }

  function renderChapters() {
    const filtered = chapters.filter(chapterMatches);
    if (!filtered.length) {
      chapterList.innerHTML = `
        <div class="empty-state">
          <strong>没有匹配的章节</strong>
          调整关键词、阶段或学习状态后再试。
        </div>
      `;
      resultLine.textContent = `当前显示 0 章，共 ${chapters.length} 章`;
      return;
    }

    const portions = guide.stages
      .map((stage) => {
        const items = filtered.filter((chapter) => chapter.stageId === stage.id);
        if (!items.length) return "";
        const stats = stageStats(stage.id);
        return `
          <section class="stage-heading" id="stage-${stage.id}">
            <small>阶段 ${stage.number}</small>
            <h2>${escapeHTML(stage.title)}</h2>
            <p>${escapeHTML(stage.description)} · ${stats.done}/${stats.total} 已掌握</p>
          </section>
          ${items.map(renderChapter).join("")}
        `;
      })
      .join("");

    chapterList.innerHTML = portions;
    resultLine.textContent = `当前显示 ${filtered.length} 章，共 ${chapters.length} 章`;
  }

  function findNextChapter() {
    return (
      chapters.find((chapter) => !mastered.has(chapter.id)) || {
        id: "",
        title: "所有章节已掌握",
        summary: "下一步可以用综合项目验证架构能力，并开始沉淀团队工程规范。",
      }
    );
  }

  function renderNextStep() {
    const chapter = findNextChapter();
    nextStep.innerHTML = `
      <div>
        <div class="next-step-label">推荐下一步</div>
        <strong>${escapeHTML(chapter.title)}</strong>
        <p>${escapeHTML(chapter.summary)}</p>
      </div>
      ${
        chapter.id
          ? `<button class="btn btn-primary" type="button" data-go-chapter="${chapter.id}">打开章节</button>`
          : ""
      }
    `;
  }

  function updateProgress() {
    const done = chapters.filter((chapter) => mastered.has(chapter.id)).length;
    const percent = chapters.length ? Math.round((done / chapters.length) * 100) : 0;
    overallProgress.setAttribute("aria-valuenow", String(percent));
    overallProgress.querySelector("span").style.width = `${percent}%`;
    overallProgressText.textContent = `${done} / ${chapters.length}`;
    sidebarProgressText.textContent = `${percent}%`;
  }

  function locateChapter(id) {
    expanded.add(id);
    state.level = "all";
    state.status = "all";
    state.query = "";
    searchInput.value = "";
    document.querySelectorAll("[data-level]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.level === "all"));
    });
    document.querySelectorAll("[data-status]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.status === "all"));
    });
    renderChapters();
    requestAnimationFrame(() => {
      const element = document.querySelector(`[data-chapter-id="${id}"]`);
      element?.scrollIntoView({ behavior: "smooth", block: "start" });
      element?.querySelector("[data-chapter-toggle]")?.focus({ preventScroll: true });
    });
  }

  function toggleMastery(id, checked) {
    if (checked) {
      mastered.add(id);
    } else {
      mastered.delete(id);
    }
    saveJSON(progressKey, Array.from(mastered));
    renderNav();
    renderGrowthTrack();
    renderChapters();
    renderNextStep();
    updateProgress();
  }

  chapterNav.addEventListener("click", (event) => {
    const chapterButton = event.target.closest("[data-go-chapter]");
    if (chapterButton) {
      locateChapter(chapterButton.dataset.goChapter);
      return;
    }
    const stageButton = event.target.closest("[data-stage]");
    if (!stageButton) return;
    document
      .querySelector(`#stage-${stageButton.dataset.stage}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  growthTrack.addEventListener("click", (event) => {
    const button = event.target.closest("[data-stage]");
    if (!button) return;
    document
      .querySelector(`#stage-${button.dataset.stage}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  chapterList.addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-chapter-check]");
    if (!checkbox) return;
    toggleMastery(checkbox.dataset.chapterCheck, checkbox.checked);
  });

  chapterList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-chapter-toggle]");
    if (!button) return;
    const id = button.dataset.chapterToggle;
    const body = button.closest(".chapter").querySelector(".chapter-body");
    const isExpanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!isExpanded));
    body.hidden = isExpanded;
    if (isExpanded) {
      expanded.delete(id);
    } else {
      expanded.add(id);
    }
  });

  document.querySelectorAll("[data-level]").forEach((button) => {
    button.addEventListener("click", () => {
      state.level = button.dataset.level;
      document.querySelectorAll("[data-level]").forEach((item) => {
        item.setAttribute("aria-pressed", String(item === button));
      });
      renderChapters();
    });
  });

  document.querySelectorAll("[data-status]").forEach((button) => {
    button.addEventListener("click", () => {
      state.status = button.dataset.status;
      document.querySelectorAll("[data-status]").forEach((item) => {
        item.setAttribute("aria-pressed", String(item === button));
      });
      renderChapters();
    });
  });

  searchInput.addEventListener("input", () => {
    state.query = searchInput.value;
    renderChapters();
  });

  toggleExpand.addEventListener("click", () => {
    state.allExpanded = !state.allExpanded;
    expanded.clear();
    toggleExpand.textContent = state.allExpanded ? "收起全部" : "展开全部";
    renderChapters();
  });

  nextStep.addEventListener("click", (event) => {
    const button = event.target.closest("[data-go-chapter]");
    if (button) locateChapter(button.dataset.goChapter);
  });

  document.querySelector("#resetProgress").addEventListener("click", () => {
    const shouldReset = window.confirm("确定清空所有章节学习进度吗？");
    if (!shouldReset) return;
    mastered.clear();
    expanded.clear();
    saveJSON(progressKey, []);
    renderNav();
    renderGrowthTrack();
    renderChapters();
    renderNextStep();
    updateProgress();
    showToast("学习进度已重置");
  });

  renderNav();
  renderGrowthTrack();
  renderChapters();
  renderNextStep();
  updateProgress();
})();
