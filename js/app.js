(function () {
  "use strict";

  const LANG_LABELS = { auto: "Auto-detect", javascript: "JavaScript", python: "Python", java: "Java", cpp: "C++" };
  const FILE_NAMES = { javascript: "script.js", python: "main.py", java: "Main.java", cpp: "main.cpp", auto: "code.txt" };
  const EXT_TO_LANG = { js: "javascript", jsx: "javascript", ts: "javascript", tsx: "javascript", mjs: "javascript", cjs: "javascript", py: "python", java: "java", cpp: "cpp", cc: "cpp", cxx: "cpp", c: "cpp", h: "cpp", hpp: "cpp" };

  const SAMPLES = {
    javascript: {
      clean: `function calculateAverage(numbers) {\n  if (!Array.isArray(numbers) || numbers.length === 0) {\n    return 0;\n  }\n  const total = numbers.reduce((sum, value) => sum + value, 0);\n  return total / numbers.length;\n}\n\nfunction getGrade(score) {\n  if (score >= 90) return "A";\n  if (score >= 75) return "B";\n  if (score >= 60) return "C";\n  return "D";\n}\n\nconst scores = [88, 92, 79, 85];\nconst average = calculateAverage(scores);\nconst grade = getGrade(average);\nconsole.info("Average:", average, "Grade:", grade);`,
      issues: `function processData(data){\n  var result = []\n  var apiKey = "sk_live_1234567890SECRET"\n  if(data == null){\n    return result\n  }\n  for(var i=0;i<data.length;i++){\n    if(data[i].active == true){\n      if(data[i].score != null){\n        if(data[i].score > 50){\n          try{\n            document.getElementById("out").innerHTML = data[i].name\n            result.push(data[i].score)\n          } catch(e) {}\n        }\n      }\n    }\n  }\n  console.log("done", result)\n  if(result.length == 0){ return 0 }\n  var total = 0\n  for(var j=0;j<result.length;j++){ total = total + result[j] }\n  return total / result.length\n}`
    },
    python: {
      clean: `def calculate_average(numbers):\n    """Return the average of a list of numbers."""\n    if not numbers:\n        return 0\n    total = sum(numbers)\n    return total / len(numbers)\n\n\ndef get_grade(score):\n    if score >= 90:\n        return "A"\n    elif score >= 75:\n        return "B"\n    elif score >= 60:\n        return "C"\n    return "D"\n\nscores = [88, 92, 79, 85]\naverage = calculate_average(scores)\ngrade = get_grade(average)`,
      issues: `def load_scores(path, cache=[]):\n    password = "admin12345"\n    try:\n        f = open(path)\n        data = f.read()\n    except:\n        pass\n    print(data)\n    scores = [1,2,3,4,5,6,7,8,9,10]\n    total = 0\n    for s in scores:\n        if s > 0:\n            if s % 2 == 0:\n                if s < 10:\n                    total += s\n    if total > 0:\n        if total < 100:\n            if total != 10:\n                print(total)\n    return total`
    },
    java: {
      clean: `import java.util.List;\n\npublic class GradeCalculator {\n    public static double calculateAverage(List<Integer> numbers) {\n        if (numbers == null || numbers.isEmpty()) {\n            return 0;\n        }\n        int total = 0;\n        for (int value : numbers) {\n            total += value;\n        }\n        return (double) total / numbers.size();\n    }\n\n    public static String getGrade(double score) {\n        if (score >= 90) return "A";\n        else if (score >= 75) return "B";\n        else if (score >= 60) return "C";\n        return "D";\n    }\n}`,
      issues: `public class Processor {\n    public static int compute(String mode) {\n        String token = "secret_token_abc123";\n        int result = 0;\n        if (mode == "fast") {\n            for (int i = 0; i < 10; i++) {\n                if (i % 2 == 0) {\n                    try {\n                        result += i;\n                    } catch (Exception e) {\n                    }\n                }\n            }\n        }\n        System.out.println(result)\n        return result\n    }\n}`
    },
    cpp: {
      clean: `#include <vector>\n#include <numeric>\n\ndouble calculateAverage(const std::vector<int>& numbers) {\n    if (numbers.empty()) {\n        return 0.0;\n    }\n    int total = std::accumulate(numbers.begin(), numbers.end(), 0);\n    return static_cast<double>(total) / numbers.size();\n}\n\nchar getGrade(double score) {\n    if (score >= 90) return 'A';\n    if (score >= 75) return 'B';\n    if (score >= 60) return 'C';\n    return 'D';\n}`,
      issues: `#include <iostream>\n#include <vector>\n#include <cstring>\nusing namespace std;\n\nint compute(vector<int> values) {\n    char buf[10];\n    int* temp = new int[10];\n    strcpy(buf, "toolonginputvalue");\n    int total = 0;\n    for (int i = 0; i < values.size(); i++) {\n        if (values[i] > 0) {\n            if (values[i] % 2 == 0) {\n                try {\n                    total += values[i];\n                } catch (...) {\n                }\n            }\n        }\n    }\n    printf("%d\\n", total);\n    return total\n}`
    }
  };

  const $ = (id) => document.getElementById(id);
  const els = {
    language: $("languageSelect"), sample: $("sampleSelect"), code: $("codeInput"), lines: $("lineNumbers"),
    analyze: $("analyzeBtn"), clear: $("clearBtn"), trim: $("trimBtn"),
    charCount: $("charCount"), lineCountMeta: $("lineCountMeta"), status: $("statusPill"),
    empty: $("emptyState"), emptyStateText: $("emptyStateText"), emptyPrimaryBtn: $("emptyPrimaryBtn"),
    results: $("resultsContent"), reportActions: $("reportActions"),
    healthLabel: $("healthLabel"), healthSummary: $("healthSummary"), healthScore: $("healthScore"), scoreRing: $("scoreRing"),
    barHealth: $("barHealth"), barMaint: $("barMaint"), barHealthVal: $("barHealthVal"), barMaintVal: $("barMaintVal"),
    statIssues: $("statIssues"), statIssuesSub: $("statIssuesSub"), statComplexity: $("statComplexity"),
    statComplexitySub: $("statComplexitySub"), statLoc: $("statLoc"), statLocSub: $("statLocSub"),
    statMaintainability: $("statMaintainability"), complexityMetrics: $("complexityMetrics"),
    suggestionsList: $("suggestionsList"), topSuggestionsList: $("topSuggestionsList"), issuesBody: $("issuesBody"), noIssues: $("noIssues"),
    filters: Array.from(document.querySelectorAll(".chip[data-filter]")), tabs: Array.from(document.querySelectorAll(".tab[data-tab]")),
    tabPanels: Array.from(document.querySelectorAll(".tab-panel")), mismatchBanner: $("mismatchBanner"), mismatchTitle: $("mismatchTitle"),
    mismatchText: $("mismatchText"), switchAnalyzeBtn: $("switchAnalyzeBtn"), keepAnalyzeBtn: $("keepAnalyzeBtn"), dismissNoticeBtn: $("dismissNoticeBtn"),
    editorTitle: $("editorTitle"), detectedHint: $("detectedHint"), analyzedAsBadge: $("analyzedAsBadge"), analyzedTime: $("analyzedTime"),
    copySummaryBtn: $("copySummaryBtn"), exportBtn: $("exportBtn"), printBtn: $("printBtn"),
    shareBtn: $("shareBtn"), exportHtmlBtn: $("exportHtmlBtn"),
    fileInput: $("fileInput"), dropZone: $("dropZone"), themeToggleBtn: $("themeToggleBtn"),
    historyToggleBtn: $("historyToggleBtn"), historyPanel: $("historyPanel"), historyList: $("historyList"), clearHistoryBtn: $("clearHistoryBtn"),
    historyMode: $("historyMode"), historySubtitle: $("historySubtitle"),
    issueSearch: $("issueSearch"), countAll: $("countAll"), countError: $("countError"), countWarn: $("countWarn"), countInfo: $("countInfo"),
    distGrid: $("distGrid"), toast: $("toast"), serverModeNote: $("serverModeNote"),
    helpBtn: $("helpBtn"), helpModal: $("helpModal"), helpCloseBtn: $("helpCloseBtn"),
    undoBar: $("undoBar"), undoClearBtn: $("undoClearBtn"), dismissUndoBtn: $("dismissUndoBtn"),
    // auth
    authOpenBtn: $("authOpenBtn"), authModal: $("authModal"), authCloseBtn: $("authCloseBtn"),
    tabLogin: $("tabLogin"), tabSignup: $("tabSignup"), loginForm: $("loginForm"), signupForm: $("signupForm"),
    authError: $("authError"), loginEmail: $("loginEmail"), loginPassword: $("loginPassword"), loginSubmitBtn: $("loginSubmitBtn"),
    loginEmailError: $("loginEmailError"), loginPasswordError: $("loginPasswordError"),
    signupName: $("signupName"), signupEmail: $("signupEmail"), signupPassword: $("signupPassword"), signupSubmitBtn: $("signupSubmitBtn"),
    signupNameError: $("signupNameError"), signupEmailError: $("signupEmailError"), signupPasswordError: $("signupPasswordError"),
    userMenu: $("userMenu"), userChip: $("userChip"), userDropdown: $("userDropdown"),
    userAvatar: $("userAvatar"), userName: $("userName"), userNameFull: $("userNameFull"), userEmail: $("userEmail"), logoutBtn: $("logoutBtn")
  };

  let currentIssues = [];
  let activeFilter = "all";
  let issueSearchTerm = "";
  let pendingDetection = null;
  let lastDetection = null;
  let lastReport = null;
  let lastAnalyzedLang = null;
  let activeLine = null;
  let historyItems = [];
  let currentUser = null;
  let authToken = null;
  let undoSnapshot = null;
  let undoTimer = null;

  const HISTORY_KEY = "codesense_history_v1";
  const THEME_KEY = "codesense_theme_v1";
  const TOKEN_KEY = "codesense_token";
  const canUseServer = location.protocol === "http:" || location.protocol === "https:";

  function toast(msg) {
    if (!els.toast) return;
    els.toast.textContent = msg;
    els.toast.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => els.toast.classList.remove("show"), 2200);
  }

  function setStatus(text, mode) {
    if (!els.status) return;
    els.status.textContent = text;
    els.status.className = "status-pill" + (mode ? " " + mode : "");
  }

  async function api(path, opts = {}) {
    const headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
    const res = await fetch(path, Object.assign({}, opts, { headers }));
    let data = null;
    try { data = await res.json(); } catch (_) { data = null; }
    if (!res.ok) {
      const err = new Error((data && data.error) || `Request failed (${res.status})`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  function severityRank(s) { return s === "error" ? 3 : s === "warning" ? 2 : 1; }

  function getLineIssueMap() {
    const map = new Map();
    currentIssues.forEach((iss) => {
      const prev = map.get(iss.line);
      if (!prev || severityRank(iss.severity) > severityRank(prev)) map.set(iss.line, iss.severity);
    });
    return map;
  }

  function updateEditorMeta() {
    const text = els.code ? els.code.value : "";
    const linesArr = text.split(/\r?\n/);
    const count = linesArr.length;
    if (els.charCount) els.charCount.textContent = `${text.length} chars`;
    if (els.lineCountMeta) els.lineCountMeta.textContent = `${count} ${count === 1 ? "line" : "lines"}`;
    if (!els.lines) return;
    const markers = getLineIssueMap();
    let html = "";
    for (let i = 1; i <= count; i++) {
      const sev = markers.get(i);
      const cls = ["line-no"];
      if (sev) cls.push("has-issue", `sev-${sev}`);
      if (activeLine === i) cls.push("active-line");
      html += `<span class="${cls.join(" ")}" data-line="${i}">${i}</span>`;
    }
    els.lines.innerHTML = html;
    Array.from(els.lines.querySelectorAll(".line-no")).forEach((el) => {
      el.addEventListener("click", () => jumpToLine(Number(el.getAttribute("data-line")), true));
    });
  }

  function syncScroll() { if (els.lines && els.code) els.lines.scrollTop = els.code.scrollTop; }
  function escapeHtml(str) { return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  function updateLanguageChrome() {
    if (!els.language || !els.editorTitle) return;
    const selected = els.language.value;
    const displayLang = selected === "auto" ? (lastDetection && lastDetection.bestScore >= 3 ? lastDetection.lang : "auto") : selected;
    els.editorTitle.textContent = FILE_NAMES[displayLang] || "code.txt";
  }

  function hideMismatch() { if (els.mismatchBanner) els.mismatchBanner.classList.add("hidden"); pendingDetection = null; }
  function showMismatch(selected, detected) {
    if (!els.mismatchBanner) return;
    pendingDetection = { selected, detected: detected.lang };
    els.mismatchTitle.textContent = "Language mismatch detected";
    els.mismatchText.textContent = `Selected language is ${LANG_LABELS[selected]}, but the pasted code looks like ${LANG_LABELS[detected.lang]}. Choose how you want to analyze it.`;
    els.switchAnalyzeBtn.textContent = `Switch to ${LANG_LABELS[detected.lang]} & Analyze`;
    els.keepAnalyzeBtn.textContent = `Analyze as ${LANG_LABELS[selected]}`;
    els.mismatchBanner.classList.remove("hidden");
  }

  function updateDetectionHint(detection, selected) {
    if (!els.detectedHint) return;
    if (!detection || !els.code.value.trim() || detection.bestScore < 2) {
      els.detectedHint.textContent = "Detected: —";
      els.detectedHint.className = "editor-detected";
      return;
    }
    els.detectedHint.textContent = `Detected: ${LANG_LABELS[detection.lang]} (${detection.confidence})`;
    if (selected === "auto" || selected === detection.lang) els.detectedHint.className = "editor-detected match";
    else if (detection.confidence === "high" || detection.confidence === "medium") els.detectedHint.className = "editor-detected mismatch";
    else els.detectedHint.className = "editor-detected";
  }

  function jumpToLine(line, fromGutter) {
    if (!line || line < 1 || !els.code) return;
    const text = els.code.value;
    const lines = text.split(/\r?\n/);
    if (line > lines.length) line = lines.length;
    let pos = 0;
    for (let i = 0; i < line - 1; i++) pos += lines[i].length + 1;
    const end = pos + (lines[line - 1] ? lines[line - 1].length : 0);
    activeLine = line;
    updateEditorMeta();
    els.code.focus();
    try { els.code.setSelectionRange(pos, end); } catch (_) {}
    const style = window.getComputedStyle(els.code);
    const lh = parseFloat(style.lineHeight) || 24;
    els.code.scrollTop = Math.max(0, (line - 3) * lh);
    syncScroll();
    if (!fromGutter) toast(`Jumped to line ${line}`);
  }

  function getFilteredIssues() {
    let list = activeFilter === "all" ? currentIssues : currentIssues.filter(i => i.severity === activeFilter);
    if (issueSearchTerm) {
      const q = issueSearchTerm.toLowerCase();
      list = list.filter(i => (i.message + " " + i.suggestion + " " + i.line).toLowerCase().includes(q));
    }
    return list;
  }

  function renderIssues() {
    if (!els.issuesBody) return;
    const filtered = getFilteredIssues();
    els.issuesBody.innerHTML = filtered.map((issue) => {
      const fix = issue.suggestion ? `<span class="fix-label">Fix:</span>${escapeHtml(issue.suggestion)}` : "—";
      return `
      <tr data-line="${issue.line}" tabindex="0" title="Jump to line ${issue.line}">
        <td><span class="badge ${issue.severity}">${issue.severity}</span></td>
        <td>${issue.line}</td>
        <td>${escapeHtml(issue.message)}</td>
        <td class="issue-fix">${fix}</td>
      </tr>`;
    }).join("");
    if (els.noIssues) els.noIssues.classList.toggle("hidden", filtered.length > 0);
    Array.from(els.issuesBody.querySelectorAll("tr[data-line]")).forEach((tr) => {
      const go = () => jumpToLine(Number(tr.getAttribute("data-line")));
      tr.addEventListener("click", go);
      tr.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    });
    const e = currentIssues.filter(i => i.severity === "error").length;
    const w = currentIssues.filter(i => i.severity === "warning").length;
    const inf = currentIssues.filter(i => i.severity === "info").length;
    if (els.countAll) els.countAll.textContent = String(currentIssues.length);
    if (els.countError) els.countError.textContent = String(e);
    if (els.countWarn) els.countWarn.textContent = String(w);
    if (els.countInfo) els.countInfo.textContent = String(inf);
  }

  function setScoreColor(score) {
    let color = "#10b981";
    if (score >= 85) color = "#34d399";
    else if (score >= 70) color = "#14b8a6";
    else if (score >= 50) color = "#fbbf24";
    else color = "#fb7185";
    if (els.scoreRing) els.scoreRing.style.setProperty("--ring-color", color);
  }

  function renderDistribution(complexity, scores) {
    const items = [
      { label: "Complexity risk", value: Math.min(100, Math.round((complexity.cyclomatic / 30) * 100)) },
      { label: "Nesting depth", value: Math.min(100, Math.round((complexity.maxNesting / 8) * 100)) },
      { label: "Duplication", value: Math.min(100, Math.round((complexity.duplicateLines / 20) * 100)) },
      { label: "Comment ratio", value: Math.min(100, Math.round(complexity.commentRatio || 0)) },
      { label: "Maintainability", value: scores.maintainability }
    ];
    if (!els.distGrid) return;
    els.distGrid.innerHTML = items.map(it => `
      <div class="dist-item"><span>${escapeHtml(it.label)}</span><div class="dist-track"><div class="dist-fill" style="width:${it.value}%"></div></div><b>${it.value}%</b></div>
    `).join("");
  }

  function renderResults(report, analyzedLang) {
    const { complexity, issues, suggestions, scores } = report;
    els.empty.classList.add("hidden");
    els.results.classList.remove("hidden");
    if (els.reportActions) els.reportActions.classList.remove("hidden");

    els.healthLabel.textContent = scores.label;
    els.healthSummary.textContent = scores.summary;
    els.healthScore.textContent = String(scores.health);
    els.scoreRing.style.setProperty("--score", scores.health);
    setScoreColor(scores.health);
    if (els.barHealth) els.barHealth.style.width = scores.health + "%";
    if (els.barMaint) els.barMaint.style.width = scores.maintainability + "%";
    if (els.barHealthVal) els.barHealthVal.textContent = String(scores.health);
    if (els.barMaintVal) els.barMaintVal.textContent = String(scores.maintainability);

    els.statIssues.textContent = String(issues.length);
    els.statIssuesSub.textContent = `${scores.errors} errors, ${scores.warnings} warnings`;
    els.statComplexity.textContent = String(complexity.cyclomatic);
    els.statComplexitySub.textContent = `${complexity.rating} risk`;
    els.statLoc.textContent = String(complexity.totalLines);
    els.statLocSub.textContent = `${complexity.nonEmpty} non-empty`;
    els.statMaintainability.textContent = String(scores.maintainability);

    const metrics = [
      ["Cyclomatic complexity", complexity.cyclomatic],
      ["Complexity per function", complexity.complexityPerFunction],
      ["Max nesting depth", complexity.maxNesting],
      ["Functions detected", complexity.functionCount],
      ["Comment lines", complexity.commentLines],
      ["Comment ratio", (complexity.commentRatio || 0) + "%"],
      ["Long lines (>120)", complexity.longLineCount],
      ["Duplicate lines", complexity.duplicateLines || 0],
      ["Avg line length", complexity.avgLineLength + " chars"],
      ["Non-empty lines", complexity.nonEmpty]
    ];
    els.complexityMetrics.innerHTML = metrics.map(([k, v]) => `<li><span class="k">${escapeHtml(k)}</span><span class="v">${escapeHtml(v)}</span></li>`).join("");

    const suggestionItems = (suggestions || []).map(s => `<li>${escapeHtml(s)}</li>`).join("");
    els.suggestionsList.innerHTML = suggestionItems;
    if (els.topSuggestionsList) els.topSuggestionsList.innerHTML = (suggestions || []).slice(0, 3).map(s => `<li>${escapeHtml(s)}</li>`).join("") || "<li>No major suggestions. Code looks good.</li>";

    renderDistribution(complexity, scores);
    currentIssues = issues;
    activeLine = null;
    renderIssues();
    updateEditorMeta();

    if (analyzedLang && els.analyzedAsBadge) {
      els.analyzedAsBadge.textContent = `Analyzed as ${LANG_LABELS[analyzedLang] || analyzedLang}`;
      els.analyzedAsBadge.classList.remove("hidden");
    }
    if (els.analyzedTime) els.analyzedTime.textContent = new Date().toLocaleString();
  }

  // --- History (local or server/profile) ---
  function getLocalHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch (_) { return []; }
  }
  function setLocalHistory(list) {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify((list || []).slice(0, 10))); } catch (_) {}
  }

  function setAnalyzeLoading(loading) {
    if (!els.analyze) return;
    if (loading) {
      if (!els.analyze.dataset.label) els.analyze.dataset.label = els.analyze.textContent || "Analyze Code";
      els.analyze.disabled = true;
      els.analyze.classList.add("is-loading");
      els.analyze.setAttribute("aria-busy", "true");
      els.analyze.textContent = "Analyzing...";
    } else {
      els.analyze.disabled = false;
      els.analyze.classList.remove("is-loading");
      els.analyze.removeAttribute("aria-busy");
      els.analyze.textContent = els.analyze.dataset.label || "Analyze Code";
    }
  }

  function renderHistory() {
    if (!els.historyList) return;
    const list = historyItems || [];
    if (els.historyMode) {
      if (currentUser) {
        els.historyMode.innerHTML = `Mode: <strong>Profile (${escapeHtml(currentUser.name)})</strong> — saved on server`;
      } else if (canUseServer) {
        els.historyMode.innerHTML = `Mode: <strong>Local browser</strong> — login to save in profile`;
      } else {
        els.historyMode.innerHTML = `Mode: <strong>Local browser</strong> — run server for profile sync`;
      }
    }
    if (!list.length) {
      els.historyList.innerHTML = `<li class="history-empty">No history yet. Run an analysis to save one.</li>`;
      return;
    }
    els.historyList.innerHTML = list.map(item => `
      <li class="history-item" data-id="${escapeHtml(item.id)}">
        <div class="history-top"><span>${escapeHtml(LANG_LABELS[item.lang] || item.lang)}</span><span>${item.health}/100</span></div>
        <div class="history-meta">${item.issues} issues · ${escapeHtml(new Date(item.time).toLocaleString())}</div>
      </li>`).join("");
    Array.from(els.historyList.querySelectorAll(".history-item")).forEach((el) => {
      el.addEventListener("click", () => {
        const id = el.getAttribute("data-id");
        const found = list.find(x => x.id === id);
        if (!found) return;
        undoSnapshot = null; hideUndoBar();
        els.code.value = found.code || "";
        if (found.lang && els.language.querySelector(`option[value="${found.lang}"]`)) els.language.value = found.lang;
        updateEditorMeta();
        hideMismatch();
        lastDetection = window.CodeSenseAnalyzer.detectLanguage(els.code.value);
        updateDetectionHint(lastDetection, els.language.value);
        updateLanguageChrome();
        setStatus("Restored from history", "ok");
        toast(currentUser ? "Restored from profile history" : "History item restored");
      });
    });
  }

  async function loadHistory() {
    if (currentUser && canUseServer) {
      try {
        const data = await api("/api/history");
        historyItems = Array.isArray(data.items) ? data.items : [];
      } catch (e) {
        console.warn(e);
        historyItems = [];
        if (e.status === 401) handleAuthExpired();
      }
    } else {
      historyItems = getLocalHistory();
    }
    renderHistory();
  }

  async function saveHistoryItem(entry) {
    if (currentUser && canUseServer) {
      try {
        const data = await api("/api/history", { method: "POST", body: JSON.stringify({ item: entry }) });
        historyItems = Array.isArray(data.items) ? data.items : historyItems;
      } catch (e) {
        console.warn(e);
        if (e.status === 401) { handleAuthExpired(); saveLocalHistoryItem(entry); }
        else toast("Could not sync to profile (saved locally)");
        if (e.status !== 401) saveLocalHistoryItem(entry);
      }
    } else {
      saveLocalHistoryItem(entry);
    }
    renderHistory();
  }

  function saveLocalHistoryItem(entry) {
    const list = getLocalHistory();
    const filtered = list.filter(x => x && x.id !== entry.id);
    filtered.unshift(entry);
    historyItems = filtered.slice(0, 10);
    setLocalHistory(historyItems);
  }

  async function clearHistory() {
    const msg = currentUser ? "Clear all saved profile history?" : "Clear local history?";
    if (!window.confirm(msg)) return;
    if (currentUser && canUseServer) {
      try {
        await api("/api/history", { method: "DELETE" });
        historyItems = [];
        toast("Profile history cleared");
      } catch (e) {
        if (e.status === 401) handleAuthExpired();
        toast("Could not clear profile history");
      }
    } else {
      historyItems = [];
      setLocalHistory([]);
      toast("History cleared");
    }
    renderHistory();
  }

  // --- Auth ---
  function setAuthError(msg) {
    if (!els.authError) return;
    if (!msg) { els.authError.classList.add("hidden"); els.authError.textContent = ""; return; }
    els.authError.textContent = msg;
    els.authError.classList.remove("hidden");
  }

  function setFieldError(input, errEl, msg) {
    if (input) {
      if (msg) { input.classList.add("invalid"); input.setAttribute("aria-invalid", "true"); }
      else { input.classList.remove("invalid"); input.removeAttribute("aria-invalid"); }
    }
    if (errEl) {
      if (msg) { errEl.textContent = msg; errEl.classList.remove("hidden"); }
      else { errEl.textContent = ""; errEl.classList.add("hidden"); }
    }
  }

  function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  function validateLogin(showAll) {
    const email = (els.loginEmail?.value || "").trim();
    const pass = els.loginPassword?.value || "";
    let ok = true;
    let emailMsg = "", passMsg = "";
    if (!email) { emailMsg = "Email is required."; ok = false; }
    else if (!isValidEmail(email)) { emailMsg = "Enter a valid email address."; ok = false; }
    if (!pass) { passMsg = "Password is required."; ok = false; }
    if (showAll || els.loginEmail?.dataset.touched) setFieldError(els.loginEmail, els.loginEmailError, emailMsg);
    if (showAll || els.loginPassword?.dataset.touched) setFieldError(els.loginPassword, els.loginPasswordError, passMsg);
    return ok;
  }

  function validateSignup(showAll) {
    const name = (els.signupName?.value || "").trim();
    const email = (els.signupEmail?.value || "").trim();
    const pass = els.signupPassword?.value || "";
    let ok = true;
    let nameMsg = "", emailMsg = "", passMsg = "";
    if (!name) { nameMsg = "Name is required."; ok = false; }
    else if (name.length < 2) { nameMsg = "Name must be at least 2 characters."; ok = false; }
    if (!email) { emailMsg = "Email is required."; ok = false; }
    else if (!isValidEmail(email)) { emailMsg = "Enter a valid email address."; ok = false; }
    if (!pass) { passMsg = "Password is required."; ok = false; }
    else if (pass.length < 6) { passMsg = "Password must be at least 6 characters."; ok = false; }
    if (showAll || els.signupName?.dataset.touched) setFieldError(els.signupName, els.signupNameError, nameMsg);
    if (showAll || els.signupEmail?.dataset.touched) setFieldError(els.signupEmail, els.signupEmailError, emailMsg);
    if (showAll || els.signupPassword?.dataset.touched) setFieldError(els.signupPassword, els.signupPasswordError, passMsg);
    return ok;
  }

  function resetAuthValidation() {
    const pairs = [
      [els.loginEmail, els.loginEmailError], [els.loginPassword, els.loginPasswordError],
      [els.signupName, els.signupNameError], [els.signupEmail, els.signupEmailError], [els.signupPassword, els.signupPasswordError]
    ];
    pairs.forEach(([input, err]) => {
      if (input) delete input.dataset.touched;
      setFieldError(input, err, "");
    });
  }

  let lastFocusBeforeModal = null;

  function getOpenModal() {
    if (els.helpModal && !els.helpModal.classList.contains("hidden")) return els.helpModal;
    if (els.authModal && !els.authModal.classList.contains("hidden")) return els.authModal;
    return null;
  }

  function getFocusableElements(container) {
    if (!container) return [];
    const nodes = Array.from(container.querySelectorAll('a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'));
    return nodes.filter(el => !el.closest('.hidden') && (el.offsetParent !== null || el === document.activeElement));
  }

  function openModal(modal, focusEl) {
    if (!modal) return;
    lastFocusBeforeModal = document.activeElement;
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    const focusables = getFocusableElements(modal);
    const target = focusEl || focusables[0] || modal.querySelector('.modal');
    if (target && typeof target.focus === "function") setTimeout(() => target.focus(), 0);
  }
  function closeModal(modal, returnFocusEl) {
    if (!modal) return;
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    const target = returnFocusEl || lastFocusBeforeModal;
    if (target && typeof target.focus === "function" && document.contains(target)) setTimeout(() => target.focus(), 0);
  }

  function openAuthModal(tab) {
    if (!canUseServer) { toast("Run server (node server.js) to use login/profile"); return; }
    if (!els.authModal) return;
    setAuthError("");
    resetAuthValidation();
    switchAuthTab(tab || "login");
    openModal(els.authModal, tab === "signup" ? els.signupName : els.loginEmail);
  }
  function closeAuthModal() {
    if (!els.authModal) return;
    setAuthError("");
    resetAuthValidation();
    closeModal(els.authModal);
  }

  function openHelpModal() {
    openModal(els.helpModal, els.helpCloseBtn);
  }
  function closeHelpModal() {
    closeModal(els.helpModal, els.helpBtn);
  }
  function switchAuthTab(tab) {
    const isLogin = tab === "login";
    if (els.tabLogin) els.tabLogin.classList.toggle("active", isLogin);
    if (els.tabSignup) els.tabSignup.classList.toggle("active", !isLogin);
    if (els.loginForm) els.loginForm.classList.toggle("hidden", !isLogin);
    if (els.signupForm) els.signupForm.classList.toggle("hidden", isLogin);
    setAuthError("");
    resetAuthValidation();
  }

  function updateEmptyStateCTA() {
    if (!els.emptyPrimaryBtn || !els.emptyStateText) return;
    if (!canUseServer) {
      els.emptyStateText.textContent = "Run the local server (node server.js) and open http://localhost:3000, then login or sign up to analyze code.";
      els.emptyPrimaryBtn.textContent = "How to run";
      els.emptyPrimaryBtn.classList.remove("hidden");
      return;
    }
    if (!currentUser) {
      els.emptyStateText.textContent = "Login or sign up, then run analysis to view health score, detected issues, complexity metrics, and improvement tips.";
      els.emptyPrimaryBtn.textContent = "Login / Sign up";
      els.emptyPrimaryBtn.classList.remove("hidden");
    } else {
      els.emptyStateText.textContent = "Paste code or upload a file, then run analysis to view health score, detected issues, complexity metrics, and improvement tips.";
      els.emptyPrimaryBtn.textContent = "Analyze Code";
      els.emptyPrimaryBtn.classList.remove("hidden");
    }
  }

  function updateAuthUI() {
    if (!canUseServer) {
      if (els.authOpenBtn) els.authOpenBtn.classList.add("hidden");
      if (els.userMenu) els.userMenu.classList.add("hidden");
      if (els.serverModeNote) {
        els.serverModeNote.textContent = "Login/signup is required before analysis. Run 'node server.js' in the CodeSense folder, then open http://localhost:3000 to login or sign up.";
        els.serverModeNote.classList.remove("hidden");
      }
      updateEmptyStateCTA();
      return;
    }
    if (els.serverModeNote) els.serverModeNote.classList.add("hidden");
    if (currentUser) {
      if (els.authOpenBtn) els.authOpenBtn.classList.add("hidden");
      if (els.userMenu) els.userMenu.classList.remove("hidden");
      const initial = (currentUser.name || currentUser.email || "U").trim().charAt(0).toUpperCase();
      if (els.userAvatar) els.userAvatar.textContent = initial;
      if (els.userName) els.userName.textContent = currentUser.name || "User";
      if (els.userNameFull) els.userNameFull.textContent = currentUser.name || "User";
      if (els.userEmail) els.userEmail.textContent = currentUser.email || "";
      if (els.historySubtitle) els.historySubtitle.textContent = "Profile analyses saved on server.";
    } else {
      if (els.authOpenBtn) els.authOpenBtn.classList.remove("hidden");
      if (els.userMenu) els.userMenu.classList.add("hidden");
      if (els.userDropdown) els.userDropdown.classList.add("hidden");
      if (els.historySubtitle) els.historySubtitle.textContent = "Login or sign up to analyze and save history in your profile.";
    }
    updateEmptyStateCTA();
  }

  function handleAuthSuccess(token, user) {
    authToken = token;
    currentUser = user;
    try { localStorage.setItem(TOKEN_KEY, token); } catch (_) {}
    updateAuthUI();
    closeAuthModal();
    setStatus("Ready", "ok");
    toast(`Welcome, ${user.name || "user"}!`);
    loadHistory();
  }

  function handleAuthExpired() {
    authToken = null;
    currentUser = null;
    try { localStorage.removeItem(TOKEN_KEY); } catch (_) {}
    updateAuthUI();
    historyItems = getLocalHistory();
    renderHistory();
    if (canUseServer) setStatus("Login required to analyze", "warn");
  }

  async function restoreSession() {
    if (!canUseServer) { updateAuthUI(); return; }
    try { authToken = localStorage.getItem(TOKEN_KEY); } catch (_) { authToken = null; }
    if (!authToken) { updateAuthUI(); return; }
    try {
      const data = await api("/api/auth/me");
      currentUser = data.user;
    } catch (_) {
      authToken = null; currentUser = null;
      try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
    }
    updateAuthUI();
  }

  async function logout() {
    if (canUseServer && authToken) {
      try { await api("/api/auth/logout", { method: "POST" }); } catch (_) {}
    }
    authToken = null; currentUser = null;
    try { localStorage.removeItem(TOKEN_KEY); } catch (_) {}
    if (els.userDropdown) els.userDropdown.classList.add("hidden");
    updateAuthUI();
    historyItems = getLocalHistory();
    renderHistory();
    if (canUseServer) setStatus("Login required to analyze", "warn");
    toast("Logged out");
  }

  // --- Analysis / features ---
  function performAnalysis(lang) {
    const code = els.code.value;
    setAnalyzeLoading(true);
    setStatus("Analyzing...", "busy");
    window.setTimeout(async () => {
      try {
        const report = window.CodeSenseAnalyzer.analyze(code, lang);
        lastReport = report;
        lastAnalyzedLang = lang;
        renderResults(report, lang);
        setStatus(`Analysis complete (${LANG_LABELS[lang]})`, "ok");
        const entry = {
          id: String(Date.now()) + Math.random().toString(16).slice(2),
          time: Date.now(), lang,
          health: report.scores.health, issues: report.issues.length,
          code: code.slice(0, 20000)
        };
        await saveHistoryItem(entry);
      } catch (err) {
        console.error(err);
        setStatus("Analysis failed", "busy");
        toast("Analysis failed");
      } finally {
        setAnalyzeLoading(false);
      }
    }, 90);
  }

  function runAnalysis(forceLang) {
    const code = els.code.value;
    if (!currentUser) {
      setStatus("Login required to analyze", "warn");
      if (canUseServer) {
        toast("Please login or sign up to analyze code");
        openAuthModal("login");
      } else {
        toast("Run the local server and login to analyze code");
        if (els.serverModeNote) {
          els.serverModeNote.textContent = "Login/signup is required before analysis. Run 'node server.js' in the CodeSense folder, open http://localhost:3000, then login or sign up.";
          els.serverModeNote.classList.remove("hidden");
        }
      }
      return;
    }
    if (!code.trim()) {
      setStatus("Add code to analyze", "warn");
      els.empty.classList.remove("hidden");
      els.results.classList.add("hidden");
      if (els.reportActions) els.reportActions.classList.add("hidden");
      if (els.analyzedAsBadge) els.analyzedAsBadge.classList.add("hidden");
      hideMismatch();
      currentIssues = []; activeLine = null; lastReport = null;
      updateEditorMeta();
      return;
    }
    const selected = els.language.value;
    const detection = window.CodeSenseAnalyzer.detectLanguage(code);
    lastDetection = detection;
    updateDetectionHint(detection, selected);
    updateLanguageChrome();

    let langToUse = forceLang || selected;
    if (!forceLang && selected === "auto") {
      langToUse = (detection && detection.bestScore >= 3) ? detection.lang : "javascript";
      if (!(detection && detection.bestScore >= 3)) setStatus("Low confidence detection, defaulted to JavaScript", "warn");
      hideMismatch();
      performAnalysis(langToUse);
      return;
    }
    if (!forceLang && selected !== "auto" && detection && detection.bestScore >= 4 && detection.lang !== selected && (detection.confidence === "high" || detection.confidence === "medium")) {
      showMismatch(selected, detection);
      setStatus("Language mismatch detected — choose an option", "warn");
      return;
    }
    hideMismatch();
    performAnalysis(langToUse);
  }

  function loadSample() {
    const key = els.sample.value;
    if (!key) return;
    undoSnapshot = null; hideUndoBar();
    let effectiveLang = els.language.value;
    if (effectiveLang === "auto") {
      effectiveLang = (lastDetection && lastDetection.bestScore >= 3) ? lastDetection.lang : "javascript";
      els.language.value = effectiveLang;
    }
    els.code.value = (SAMPLES[effectiveLang] && SAMPLES[effectiveLang][key]) || "";
    updateEditorMeta();
    els.sample.value = "";
    hideMismatch();
    currentIssues = []; activeLine = null;
    lastDetection = window.CodeSenseAnalyzer.detectLanguage(els.code.value);
    updateDetectionHint(lastDetection, els.language.value);
    updateLanguageChrome();
    updateEditorMeta();
    setStatus("Sample loaded", "");
  }

  function hideUndoBar() {
    if (undoTimer) { clearTimeout(undoTimer); undoTimer = null; }
    if (els.undoBar) els.undoBar.classList.add("hidden");
  }

  function showUndoBar() {
    if (!els.undoBar) return;
    els.undoBar.classList.remove("hidden");
    if (undoTimer) clearTimeout(undoTimer);
    undoTimer = setTimeout(() => {
      undoSnapshot = null;
      hideUndoBar();
    }, 12000);
  }

  function undoClear() {
    if (!undoSnapshot) return;
    els.code.value = undoSnapshot.code || "";
    currentIssues = undoSnapshot.currentIssues || [];
    lastDetection = undoSnapshot.lastDetection || null;
    lastReport = undoSnapshot.lastReport || null;
    lastAnalyzedLang = undoSnapshot.lastAnalyzedLang || null;
    activeLine = undoSnapshot.activeLine || null;
    if (undoSnapshot.language && els.language) els.language.value = undoSnapshot.language;
    updateEditorMeta();
    updateLanguageChrome();
    updateDetectionHint(lastDetection, els.language ? els.language.value : "auto");
    if (lastReport && lastAnalyzedLang) {
      renderResults(lastReport, lastAnalyzedLang);
      setStatus(`Analysis restored (${LANG_LABELS[lastAnalyzedLang] || lastAnalyzedLang})`, "ok");
    } else {
      if (els.results) els.results.classList.add("hidden");
      if (els.empty) els.empty.classList.remove("hidden");
      if (els.reportActions) els.reportActions.classList.add("hidden");
      if (els.analyzedAsBadge) els.analyzedAsBadge.classList.add("hidden");
      setStatus(canUseServer && !currentUser ? "Login required to analyze" : "Ready", canUseServer && !currentUser ? "warn" : "");
    }
    hideMismatch();
    undoSnapshot = null;
    hideUndoBar();
    toast("Editor restored");
  }

  function clearAll() {
    const hasContent = (els.code && els.code.value.trim()) || currentIssues.length || lastReport;
    if (hasContent && !window.confirm("Clear editor and current analysis results?")) return;
    if (hasContent) {
      undoSnapshot = {
        code: els.code ? els.code.value : "",
        currentIssues: Array.isArray(currentIssues) ? currentIssues.slice() : [],
        lastDetection,
        lastReport,
        lastAnalyzedLang,
        activeLine,
        language: els.language ? els.language.value : "auto"
      };
    } else {
      undoSnapshot = null;
      hideUndoBar();
    }
    els.code.value = "";
    currentIssues = []; lastDetection = null; lastReport = null; activeLine = null;
    updateEditorMeta();
    if (els.results) els.results.classList.add("hidden");
    if (els.empty) els.empty.classList.remove("hidden");
    if (els.reportActions) els.reportActions.classList.add("hidden");
    if (els.analyzedAsBadge) els.analyzedAsBadge.classList.add("hidden");
    hideMismatch();
    updateDetectionHint(null, els.language.value);
    updateLanguageChrome();
    setStatus(canUseServer && !currentUser ? "Login required to analyze" : "Ready", canUseServer && !currentUser ? "warn" : "");
    if (undoSnapshot) showUndoBar();
  }

  function setActiveTab(name) {
    els.tabs.forEach(t => t.classList.toggle("active", t.getAttribute("data-tab") === name));
    els.tabPanels.forEach(p => p.classList.toggle("active", p.id === `tab-${name}`));
  }

  function loadFile(file) {
    if (!file) return;
    undoSnapshot = null; hideUndoBar();
    const reader = new FileReader();
    reader.onload = () => {
      els.code.value = String(reader.result || "").slice(0, 300000);
      updateEditorMeta();
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      if (EXT_TO_LANG[ext] && els.language) els.language.value = EXT_TO_LANG[ext];
      hideMismatch();
      currentIssues = []; activeLine = null;
      lastDetection = window.CodeSenseAnalyzer.detectLanguage(els.code.value);
      updateDetectionHint(lastDetection, els.language.value);
      updateLanguageChrome();
      updateEditorMeta();
      setStatus(`Loaded ${file.name}`, "ok");
      toast("File loaded");
    };
    reader.readAsText(file);
  }

  function copyText(text, okMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => toast(okMsg)).catch(() => fallbackCopy(text, okMsg));
    } else fallbackCopy(text, okMsg);
  }
  function fallbackCopy(text, okMsg) {
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); toast(okMsg); } catch (_) { toast("Copy failed"); }
    document.body.removeChild(ta);
  }

  function copySummary() {
    if (!lastReport || !lastAnalyzedLang) { toast("Run analysis first"); return; }
    const r = lastReport;
    const text = [
      `CodeSense Report (${LANG_LABELS[lastAnalyzedLang] || lastAnalyzedLang})`,
      `Health: ${r.scores.health}/100 (${r.scores.label})`,
      `Maintainability: ${r.scores.maintainability}/100`,
      `Issues: ${r.issues.length} (${r.scores.errors} errors, ${r.scores.warnings} warnings, ${r.scores.infos} info)`,
      `Cyclomatic: ${r.complexity.cyclomatic} (${r.complexity.rating}), Nesting: ${r.complexity.maxNesting}, LOC: ${r.complexity.totalLines}`,
      `Top suggestions: ${(r.suggestions || []).slice(0,3).join(" | ") || "None"}`
    ].join("\n");
    copyText(text, "Summary copied");
  }

  function downloadBlob(blob, filename) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function exportJson() {
    if (!lastReport) { toast("Run analysis first"); return; }
    const payload = { tool: "CodeSense", analyzedAt: new Date().toISOString(), language: lastAnalyzedLang, report: lastReport };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    downloadBlob(blob, `codesense-report-${Date.now()}.json`);
    toast("JSON exported");
  }
  function exportHtmlReport() {
    if (!lastReport) { toast("Run analysis first"); return; }
    const r = lastReport;
    const rows = r.issues.map(i => `<tr><td>${escapeHtml(i.severity)}</td><td>${i.line}</td><td>${escapeHtml(i.message)}</td><td>${escapeHtml(i.suggestion)}</td></tr>`).join("") || `<tr><td colspan="4">No issues detected</td></tr>`;
    const sugg = (r.suggestions || []).map(s => `<li>${escapeHtml(s)}</li>`).join("");
    const metrics = Object.entries({
      "Cyclomatic complexity": r.complexity.cyclomatic,
      "Complexity per function": r.complexity.complexityPerFunction,
      "Max nesting depth": r.complexity.maxNesting,
      "Functions detected": r.complexity.functionCount,
      "Lines of code": r.complexity.totalLines,
      "Non-empty lines": r.complexity.nonEmpty,
      "Comment ratio": (r.complexity.commentRatio || 0) + "%",
      "Duplicate lines": r.complexity.duplicateLines || 0
    }).map(([k,v]) => `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`).join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>CodeSense Report</title>
<style>body{font-family:Inter,Segoe UI,Arial,sans-serif;margin:24px;color:#052e2b}h1{margin:0 0 4px} .muted{color:#3f766f}
.card{border:1px solid #d1fae5;border-radius:12px;padding:16px;margin:12px 0} table{width:100%;border-collapse:collapse} th,td{border:1px solid #d1fae5;padding:8px;text-align:left;font-size:14px} .score{font-size:28px;font-weight:800;color:#047857}</style></head><body>
<h1>CodeSense Analysis Report</h1><p class="muted">Generated: ${escapeHtml(new Date().toLocaleString())} · Language: ${escapeHtml(LANG_LABELS[lastAnalyzedLang]||lastAnalyzedLang)}</p>
<div class="card"><div class="score">Health: ${r.scores.health}/100 (${escapeHtml(r.scores.label)})</div><p>${escapeHtml(r.scores.summary)}</p>
<p><b>Maintainability:</b> ${r.scores.maintainability}/100 · <b>Issues:</b> ${r.issues.length} (${r.scores.errors} errors, ${r.scores.warnings} warnings, ${r.scores.infos} info)</p></div>
<div class="card"><h2>Metrics</h2><table>${metrics}</table></div>
<div class="card"><h2>Suggestions</h2><ul>${sugg}</ul></div>
<div class="card"><h2>Issues</h2><table><thead><tr><th>Severity</th><th>Line</th><th>Issue</th><th>Suggestion</th></tr></thead><tbody>${rows}</tbody></table></div>
</body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    downloadBlob(blob, `codesense-report-${Date.now()}.html`);
    toast("HTML report downloaded");
  }

  function utf8ToB64(str) { try { return btoa(unescape(encodeURIComponent(str))); } catch (_) { return btoa(str); } }
  function b64ToUtf8(b64) { try { return decodeURIComponent(escape(atob(b64))); } catch (_) { return atob(b64); } }
  function shareLink() {
    const code = els.code.value;
    if (!code.trim()) { toast("Add code to share"); return; }
    const state = { v: 1, lang: els.language.value, code: code.slice(0, 12000) };
    const encoded = utf8ToB64(JSON.stringify(state)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    const url = `${location.origin}${location.pathname}#s=${encoded}`;
    copyText(url, code.length > 12000 ? "Share link copied (code truncated)" : "Share link copied");
  }
  function loadFromHash() {
    const h = location.hash || "";
    const m = h.match(/[#&?]s=([^&]+)/);
    if (!m) return false;
    try {
      let b64 = m[1].replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      const state = JSON.parse(b64ToUtf8(b64));
      if (state && typeof state.code === "string") {
        els.code.value = state.code;
        if (state.lang && els.language.querySelector(`option[value="${state.lang}"]`)) els.language.value = state.lang;
        updateEditorMeta();
        lastDetection = window.CodeSenseAnalyzer.detectLanguage(els.code.value);
        updateDetectionHint(lastDetection, els.language.value);
        updateLanguageChrome();
        setStatus("Loaded from shared link", "ok");
        return true;
      }
    } catch (e) { console.warn("Failed to load shared state", e); }
    return false;
  }

  function trimTrailingSpaces() {
    const before = els.code.value;
    const after = before.split(/\r?\n/).map(l => l.replace(/[ \t]+$/g, "")).join("\n");
    if (before === after) { toast("No trailing spaces found"); return; }
    els.code.value = after;
    updateEditorMeta();
    toast("Trailing spaces removed");
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
    if (els.themeToggleBtn) els.themeToggleBtn.textContent = theme === "dark" ? "Light" : "Dark";
  }

  // Events wiring
  if (els.code) {
    els.code.addEventListener("input", () => {
      updateEditorMeta(); hideMismatch();
      lastDetection = window.CodeSenseAnalyzer.detectLanguage(els.code.value);
      updateDetectionHint(lastDetection, els.language.value); updateLanguageChrome();
    });
    els.code.addEventListener("scroll", syncScroll);
    els.code.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const start = els.code.selectionStart, end = els.code.selectionEnd, val = els.code.value;
        els.code.value = val.substring(0, start) + "  " + val.substring(end);
        els.code.selectionStart = els.code.selectionEnd = start + 2;
        updateEditorMeta();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); runAnalysis(); }
    });
  }
  if (els.analyze) els.analyze.addEventListener("click", () => runAnalysis());
  if (els.clear) els.clear.addEventListener("click", clearAll);
  if (els.undoClearBtn) els.undoClearBtn.addEventListener("click", undoClear);
  if (els.dismissUndoBtn) els.dismissUndoBtn.addEventListener("click", () => { undoSnapshot = null; hideUndoBar(); });
  if (els.trim) els.trim.addEventListener("click", trimTrailingSpaces);
  if (els.sample) els.sample.addEventListener("change", loadSample);
  if (els.language) els.language.addEventListener("change", () => { hideMismatch(); updateDetectionHint(lastDetection, els.language.value); updateLanguageChrome(); setStatus(`Language: ${LANG_LABELS[els.language.value]}`, ""); });

  if (els.switchAnalyzeBtn) els.switchAnalyzeBtn.addEventListener("click", () => { if (!pendingDetection) return; const d = pendingDetection.detected; els.language.value = d; hideMismatch(); updateLanguageChrome(); runAnalysis(d); });
  if (els.keepAnalyzeBtn) els.keepAnalyzeBtn.addEventListener("click", () => { if (!pendingDetection) return; const s = pendingDetection.selected; hideMismatch(); runAnalysis(s); });
  if (els.dismissNoticeBtn) els.dismissNoticeBtn.addEventListener("click", () => { hideMismatch(); setStatus("Mismatch warning dismissed", ""); });

  els.filters.forEach((btn) => btn.addEventListener("click", () => { els.filters.forEach(b => b.classList.remove("active")); btn.classList.add("active"); activeFilter = btn.getAttribute("data-filter") || "all"; renderIssues(); }));
  els.tabs.forEach((btn) => btn.addEventListener("click", () => setActiveTab(btn.getAttribute("data-tab"))));
  if (els.issueSearch) els.issueSearch.addEventListener("input", (e) => { issueSearchTerm = e.target.value || ""; renderIssues(); });

  if (els.copySummaryBtn) els.copySummaryBtn.addEventListener("click", copySummary);
  if (els.exportBtn) els.exportBtn.addEventListener("click", exportJson);
  if (els.printBtn) els.printBtn.addEventListener("click", () => { setActiveTab("overview"); window.print(); });
  if (els.shareBtn) els.shareBtn.addEventListener("click", shareLink);
  if (els.exportHtmlBtn) els.exportHtmlBtn.addEventListener("click", exportHtmlReport);

  if (els.fileInput) els.fileInput.addEventListener("change", (e) => { const f = e.target.files && e.target.files[0]; loadFile(f); e.target.value = ""; });
  if (els.dropZone) {
    ["dragenter", "dragover"].forEach(ev => els.dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); els.dropZone.classList.add("dragover"); }));
    ["dragleave", "drop"].forEach(ev => els.dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); if (ev === "dragleave" && e.target !== els.dropZone) return; els.dropZone.classList.remove("dragover"); }));
    els.dropZone.addEventListener("drop", (e) => { const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; loadFile(f); });
  }

  if (els.themeToggleBtn) els.themeToggleBtn.addEventListener("click", () => { const cur = document.documentElement.getAttribute("data-theme") || "dark"; applyTheme(cur === "dark" ? "light" : "dark"); });
  if (els.historyToggleBtn) els.historyToggleBtn.addEventListener("click", () => { if (els.historyPanel) { els.historyPanel.classList.toggle("hidden"); renderHistory(); } });
  if (els.clearHistoryBtn) els.clearHistoryBtn.addEventListener("click", () => { clearHistory(); });

  // Auth/help/empty-state events
  if (els.authOpenBtn) els.authOpenBtn.addEventListener("click", () => openAuthModal("login"));
  if (els.authCloseBtn) els.authCloseBtn.addEventListener("click", closeAuthModal);
  if (els.authModal) els.authModal.addEventListener("click", (e) => { if (e.target === els.authModal) closeAuthModal(); });
  if (els.helpBtn) els.helpBtn.addEventListener("click", openHelpModal);
  if (els.helpCloseBtn) els.helpCloseBtn.addEventListener("click", closeHelpModal);
  if (els.helpModal) els.helpModal.addEventListener("click", (e) => { if (e.target === els.helpModal) closeHelpModal(); });
  if (els.emptyPrimaryBtn) els.emptyPrimaryBtn.addEventListener("click", () => {
    if (!canUseServer) {
      toast("Run 'node server.js' in CodeSense folder, then open http://localhost:3000");
      if (els.serverModeNote) els.serverModeNote.classList.remove("hidden");
      return;
    }
    if (!currentUser) openAuthModal("login");
    else runAnalysis();
  });
  if (els.tabLogin) els.tabLogin.addEventListener("click", () => switchAuthTab("login"));
  if (els.tabSignup) els.tabSignup.addEventListener("click", () => switchAuthTab("signup"));
  if (els.userChip) els.userChip.addEventListener("click", () => { if (els.userDropdown) els.userDropdown.classList.toggle("hidden"); });
  if (els.logoutBtn) els.logoutBtn.addEventListener("click", logout);
  document.addEventListener("click", (e) => {
    if (els.userMenu && els.userDropdown && !els.userMenu.contains(e.target)) els.userDropdown.classList.add("hidden");
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (els.helpModal && !els.helpModal.classList.contains("hidden")) closeHelpModal();
      else if (els.authModal && !els.authModal.classList.contains("hidden")) closeAuthModal();
      return;
    }
    if (e.key === "Tab") {
      const openModalEl = getOpenModal();
      if (!openModalEl) return;
      const focusables = getFocusableElements(openModalEl);
      if (!focusables.length) { e.preventDefault(); return; }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !openModalEl.contains(active)) { e.preventDefault(); last.focus(); }
      } else {
        if (active === last) { e.preventDefault(); first.focus(); }
      }
    }
  });

  if (els.loginForm) els.loginForm.addEventListener("submit", async (e) => {
    e.preventDefault(); setAuthError("");
    if (els.loginEmail) els.loginEmail.dataset.touched = "1";
    if (els.loginPassword) els.loginPassword.dataset.touched = "1";
    if (!validateLogin(true)) {
      const firstInvalid = [els.loginEmail, els.loginPassword].find(el => el && el.classList.contains("invalid"));
      if (firstInvalid) firstInvalid.focus();
      return;
    }
    const email = (els.loginEmail.value || "").trim();
    const password = els.loginPassword.value || "";
    try {
      if (els.loginSubmitBtn) els.loginSubmitBtn.disabled = true;
      const data = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      handleAuthSuccess(data.token, data.user);
    } catch (err) { setAuthError(err.message || "Login failed."); }
    finally { if (els.loginSubmitBtn) els.loginSubmitBtn.disabled = false; }
  });
  if (els.signupForm) els.signupForm.addEventListener("submit", async (e) => {
    e.preventDefault(); setAuthError("");
    if (els.signupName) els.signupName.dataset.touched = "1";
    if (els.signupEmail) els.signupEmail.dataset.touched = "1";
    if (els.signupPassword) els.signupPassword.dataset.touched = "1";
    if (!validateSignup(true)) {
      const firstInvalid = [els.signupName, els.signupEmail, els.signupPassword].find(el => el && el.classList.contains("invalid"));
      if (firstInvalid) firstInvalid.focus();
      return;
    }
    const name = (els.signupName.value || "").trim();
    const email = (els.signupEmail.value || "").trim();
    const password = els.signupPassword.value || "";
    try {
      if (els.signupSubmitBtn) els.signupSubmitBtn.disabled = true;
      await api("/api/auth/signup", { method: "POST", body: JSON.stringify({ name, email, password }) });
      switchAuthTab("login");
      if (els.loginEmail) els.loginEmail.value = email;
      if (els.loginPassword) els.loginPassword.value = "";
      if (els.signupPassword) els.signupPassword.value = "";
      toast("Account created. Please login.");
      setAuthError("Signup successful. Please login to continue.");
      if (els.loginPassword) els.loginPassword.focus();
    } catch (err) {
      if (err.status === 409 || /already exists/i.test(err.message || "")) {
        switchAuthTab("login");
        if (els.loginEmail) els.loginEmail.value = email;
        if (els.loginPassword) {
          els.loginPassword.value = "";
          els.loginPassword.focus();
        }
        setAuthError("This email is already registered. Please login instead.");
      } else {
        setAuthError(err.message || "Signup failed.");
      }
    }
    finally { if (els.signupSubmitBtn) els.signupSubmitBtn.disabled = false; }
  });

  // Inline auth validation
  [["loginEmail","loginPassword"], ["signupName","signupEmail","signupPassword"]].flat().forEach((id) => {
    const el = els[id];
    if (!el) return;
    el.addEventListener("blur", () => { el.dataset.touched = "1"; if (id.startsWith("login")) validateLogin(false); else validateSignup(false); });
    el.addEventListener("input", () => { if (el.dataset.touched) { if (id.startsWith("login")) validateLogin(false); else validateSignup(false); } });
  });

  // Init
  (async function init() {
    let savedTheme = "dark";
    try { savedTheme = localStorage.getItem(THEME_KEY) || "dark"; } catch (_) {}
    applyTheme(savedTheme);
    loadFromHash();
    await restoreSession();
    await loadHistory();
    updateEditorMeta(); updateLanguageChrome(); updateDetectionHint(lastDetection, els.language ? els.language.value : "auto");
    updateEmptyStateCTA();
    if (canUseServer && !currentUser) setStatus("Login required to analyze", "warn");
  })();
})();