(function () {
  "use strict";

  const DECISION_KEYWORDS = {
    javascript: ["if", "for", "while", "case", "catch"],
    java: ["if", "for", "while", "case", "catch"],
    cpp: ["if", "for", "while", "case", "catch"],
    python: ["if", "for", "while", "elif", "except"]
  };

  function countOccurrences(line, token) {
    const re = new RegExp(`\\b${token}\\b`, "g");
    const m = line.match(re);
    return m ? m.length : 0;
  }

  function countRegex(line, re) {
    const m = line.match(re);
    return m ? m.length : 0;
  }

  function leadingIndent(line) {
    const m = line.match(/^(\s*)/);
    return m ? m[1].replace(/\t/g, "    ").length : 0;
  }

  function estimateFunctionCount(code, lang) {
    if (lang === "python") {
      return (code.match(/^\s*def\s+\w+\s*\(/gm) || []).length;
    }
    if (lang === "javascript") {
      return (code.match(/\bfunction\s+\w+\s*\(|\b\w+\s*=\s*(async\s*)?\([^)]*\)\s*=>|\b\w+\s*:\s*(async\s*)?\([^)]*\)\s*=>/g) || []).length;
    }
    if (lang === "java") {
      return (code.match(/\b(public|private|protected|static|\s)+[\w\<\>\[\]]+\s+\w+\s*\([^;]*\)\s*\{/g) || []).length;
    }
    if (lang === "cpp") {
      return (code.match(/\b[\w:\<\>\*\&]+\s+\w+\s*\([^;]*\)\s*\{/g) || []).length;
    }
    return 0;
  }

  function analyzeComplexity(code, lang) {
    const lines = code.split(/\r?\n/);
    let decisions = 1; // base path
    let maxNesting = 0;
    let longLineCount = 0;
    let commentLines = 0;
    const nonEmptyLines = lines.filter((l) => l.trim().length > 0);
    const nonEmpty = nonEmptyLines.length;

    const seen = new Map();
    let duplicateLines = 0;
    nonEmptyLines.forEach((l) => {
      const norm = l.trim();
      if (norm.length < 6) return; // ignore tiny lines
      const prev = seen.get(norm) || 0;
      if (prev === 1) duplicateLines += 2;
      else if (prev > 1) duplicateLines += 1;
      seen.set(norm, prev + 1);
    });

    lines.forEach((line) => {
      const trimmed = line.trim();
      const kw = DECISION_KEYWORDS[lang] || DECISION_KEYWORDS.javascript;
      kw.forEach((k) => { decisions += countOccurrences(line, k); });
      decisions += countRegex(line, /&&|\|\||\?(?![:.])/g);

      const indent = leadingIndent(line);
      const nest = Math.floor(indent / (lang === "python" ? 4 : 2));
      if (nest > maxNesting) maxNesting = nest;

      if (line.length > 120) longLineCount++;
      if (/^\s*(\/\/|#|\*|\/\*|\*\/|\*)/.test(trimmed) || /^\s*("""|''')/.test(trimmed)) commentLines++;
    });

    const avgLineLength = nonEmpty ? Math.round(nonEmptyLines.reduce((s, l) => s + l.trim().length, 0) / nonEmpty) : 0;
    const functionCount = estimateFunctionCount(code, lang) || (nonEmpty ? 1 : 0);
    const complexityPerFunction = functionCount ? +(decisions / functionCount).toFixed(1) : decisions;
    const commentRatio = lines.length ? +((commentLines / lines.length) * 100).toFixed(1) : 0;

    let rating = "Low";
    if (decisions > 20 || maxNesting > 5) rating = "High";
    else if (decisions > 10 || maxNesting > 3) rating = "Moderate";

    return {
      cyclomatic: decisions,
      maxNesting,
      longLineCount,
      commentLines,
      commentRatio,
      duplicateLines,
      nonEmpty,
      totalLines: lines.length,
      avgLineLength,
      functionCount,
      complexityPerFunction,
      rating
    };
  }

  function pushIssue(issues, severity, line, message, suggestion, rule) {
    issues.push({ severity, line, message, suggestion, rule });
  }

  function detectCommonIssues(code, lang, complexity) {
    const issues = [];
    const lines = code.split(/\r?\n/);

    // General checks
    lines.forEach((line, idx) => {
      const n = idx + 1;
      const trimmed = line.trim();
      if (line.length > 120) {
        pushIssue(issues, "info", n, "Line exceeds 120 characters.", "Break long expressions into smaller parts for readability.", "long-line");
      }
      if (/\b(TODO|FIXME|HACK)\b/.test(line)) {
        pushIssue(issues, "info", n, "Contains TODO/FIXME marker.", "Resolve or track pending work before finalizing the code.", "todo");
      }
      if (/\s+$/.test(line)) {
        pushIssue(issues, "info", n, "Trailing whitespace detected.", "Remove trailing spaces to keep diffs clean.", "trailing-space");
      }
      if (lang !== "python" && /[^;{}\s]\s*$/.test(trimmed) && !/^(if|for|while|switch|else|try|catch|finally|do|class|struct|public|private|protected|def)\b/.test(trimmed) && !/[,:]$/.test(trimmed) && !/^#/.test(trimmed) && !/^\/\//.test(trimmed) && !/^\*/.test(trimmed) && !/^\/\*/.test(trimmed) && !/^\}/.test(trimmed) && !/\{$/.test(trimmed) && !/\)$/.test(trimmed) && /\b(return|break|continue|throw|int|float|double|long|char|string|String|var|let|const|auto|System\.out|console\.|printf|cout|std::cout)\b/.test(trimmed)) {
        // heuristic: potential missing semicolon in C-like languages
        if (!trimmed.endsWith(";") && (lang === "java" || lang === "cpp" || (lang === "javascript" && /\b(return|throw|break|continue|let|const|var)\b/.test(trimmed)))) {
          pushIssue(issues, "warning", n, "Possible missing semicolon.", "Add a semicolon if required by the language/style guide.", "semicolon");
        }
      }
    });

    // Language-specific
    if (lang === "javascript") {
      lines.forEach((line, idx) => {
        const n = idx + 1;
        if (/[^=!<>]==[^=]/.test(line) || /[^=!<>]!=[^=]/.test(line)) {
          pushIssue(issues, "warning", n, "Loose equality operator detected (== or !=).", "Prefer strict equality (=== / !==) to avoid type coercion bugs.", "eqeqeq");
        }
        if (/\bvar\b/.test(line)) {
          pushIssue(issues, "info", n, "Usage of 'var' detected.", "Use 'let' or 'const' for block scoping and clearer intent.", "no-var");
        }
        if (/console\.(log|debug)\s*\(/.test(line)) {
          pushIssue(issues, "info", n, "Debug logging statement found.", "Remove or guard console logs before production.", "no-console");
        }
        if (/catch\s*\(\s*\w*\s*\)\s*\{\s*\}/.test(line)) {
          pushIssue(issues, "error", n, "Empty catch block swallows errors.", "Handle the error or at least log/rethrow with context.", "empty-catch");
        }
        if (/eval\s*\(/.test(line)) {
          pushIssue(issues, "error", n, "Use of eval() detected.", "Avoid eval due to security and performance risks.", "no-eval");
        }
        if (/\.innerHTML\s*=/.test(line)) {
          pushIssue(issues, "warning", n, "Potential XSS risk: assignment to innerHTML.", "Sanitize/escape content or prefer safer DOM APIs (textContent, templating).", "xss-innerhtml");
        }
        if (/document\.write\s*\(/.test(line)) {
          pushIssue(issues, "warning", n, "Use of document.write() detected.", "Avoid document.write; manipulate the DOM with safer APIs.", "document-write");
        }
      });
    }

    if (lang === "python") {
      lines.forEach((line, idx) => {
        const n = idx + 1;
        if (/^\s*except\s*:\s*$/.test(line)) {
          pushIssue(issues, "error", n, "Bare 'except:' clause detected.", "Catch specific exceptions (e.g., except ValueError) to avoid hiding bugs.", "bare-except");
        }
        if (/^\s*def\s+\w+\s*\(.*=\s*(\[\]|\{\}|\bset\(\))/.test(line)) {
          pushIssue(issues, "warning", n, "Mutable default argument in function definition.", "Use None as default and initialize inside the function.", "mutable-default");
        }
        if (/^\s*print\s*\(/.test(line)) {
          pushIssue(issues, "info", n, "Print statement found.", "Consider using structured logging for configurable output.", "print");
        }
        if (/^\s*from\s+\w+\s+import\s+\*/.test(line)) {
          pushIssue(issues, "warning", n, "Wildcard import detected.", "Import explicit names to improve clarity and avoid namespace collisions.", "wildcard-import");
        }
        if (/\beval\s*\(|\bexec\s*\(/.test(line)) {
          pushIssue(issues, "error", n, "Use of eval/exec detected.", "Avoid dynamic code execution; use safer parsing/dispatch alternatives.", "eval-exec");
        }
        if (/\bpickle\.load\s*\(/.test(line)) {
          pushIssue(issues, "warning", n, "Potential insecure deserialization (pickle.load).", "Unpickle only trusted data or use safer formats like JSON.", "pickle");
        }
      });
    }

    if (lang === "java") {
      lines.forEach((line, idx) => {
        const n = idx + 1;
        if (/System\.out\.print/.test(line)) {
          pushIssue(issues, "info", n, "Direct console output detected.", "Use a logging framework for configurable log levels.", "stdout");
        }
        if (/catch\s*\([^)]+\)\s*\{\s*\}/.test(line)) {
          pushIssue(issues, "error", n, "Empty catch block swallows exceptions.", "Handle or log the exception appropriately.", "empty-catch");
        }
        if (/==\s*".*?"|".*?"\s*==/.test(line)) {
          pushIssue(issues, "warning", n, "String comparison using '==' detected.", "Use .equals() for value comparison of Strings.", "string-equals");
        }
        if (/\bThread\.sleep\s*\(/.test(line)) {
          pushIssue(issues, "info", n, "Thread.sleep() usage detected.", "Ensure blocking sleeps are appropriate; consider async/scheduling alternatives.", "sleep");
        }
      });
    }

    if (lang === "cpp") {
      lines.forEach((line, idx) => {
        const n = idx + 1;
        if (/\busing\s+namespace\s+std\s*;/.test(line)) {
          pushIssue(issues, "warning", n, "Using 'namespace std' globally.", "Prefer explicit std:: qualifiers or scoped using declarations.", "namespace-std");
        }
        if (/\bprintf\s*\(/.test(line)) {
          pushIssue(issues, "info", n, "C-style printf detected.", "Consider type-safe C++ streams or std::format where available.", "printf");
        }
        if (/\bnew\b/.test(line) && !/\bdelete\b/.test(code)) {
          pushIssue(issues, "warning", n, "Raw 'new' usage detected.", "Prefer smart pointers (std::unique_ptr/shared_ptr) to manage memory safely.", "raw-new");
        }
        if (/\bgets\s*\(/.test(line) || /\bstrcpy\s*\(/.test(line)) {
          pushIssue(issues, "error", n, "Unsafe C function detected (gets/strcpy).", "Use bounded, safer alternatives to prevent buffer overflows.", "unsafe-c-fn");
        }
        if (/catch\s*\(\s*\.\.\.\s*\)\s*\{\s*\}/.test(line)) {
          pushIssue(issues, "error", n, "Empty catch-all block swallows errors.", "Handle or log exceptions instead of suppressing them.", "empty-catch");
        }
      });
    }

    // Security & best-practice heuristics (cross-language)
    lines.forEach((line, idx) => {
      const n = idx + 1;
      if (/\b(password|passwd|pwd|api[_-]?key|secret|token)\b\s*[:=]\s*['"][^'"]{3,}['"]/i.test(line)) {
        pushIssue(issues, "warning", n, "Possible hardcoded secret/credential detected.", "Move secrets to environment variables or a secure secret manager.", "hardcoded-secret");
      }
      if (/\b(SELECT|INSERT|UPDATE|DELETE)\b.+(\+|\$\{|%s|\.format\(|f['"])/i.test(line) && /['"]/.test(line)) {
        pushIssue(issues, "warning", n, "Possible SQL query built via string concatenation/formatting.", "Use parameterized queries/prepared statements to prevent injection.", "sql-concat");
      }
      if (/\b(MD5|SHA1)\b|\bmd5\s*\(|\bsha1\s*\(/.test(line)) {
        pushIssue(issues, "info", n, "Weak hash algorithm reference detected (MD5/SHA1).", "Prefer stronger algorithms (e.g., SHA-256) for security-sensitive use cases.", "weak-hash");
      }
      if (/http:\/\/[^\s"'<>]+/i.test(line)) {
        pushIssue(issues, "info", n, "Insecure HTTP URL detected.", "Prefer HTTPS for secure data transfer where possible.", "http-url");
      }
    });

    // Complexity-driven issues
    if (complexity.cyclomatic > 20) {
      pushIssue(issues, "warning", 1, "High estimated cyclomatic complexity.", "Refactor large logic blocks into smaller functions to reduce branching.", "high-complexity");
    } else if (complexity.cyclomatic > 10) {
      pushIssue(issues, "info", 1, "Moderate cyclomatic complexity.", "Consider simplifying conditionals or extracting helper functions.", "moderate-complexity");
    }
    if (complexity.maxNesting > 4) {
      pushIssue(issues, "warning", 1, "Deep nesting detected.", "Use guard clauses or extract logic to flatten nested blocks.", "deep-nesting");
    }
    if (complexity.functionCount === 0 && complexity.nonEmpty > 20) {
      pushIssue(issues, "info", 1, "Large script without clear function decomposition.", "Group related logic into functions/classes for maintainability.", "decomposition");
    }
    if (complexity.duplicateLines >= 4) {
      pushIssue(issues, "info", 1, "Repeated code patterns detected.", "Consider extracting repeated logic into reusable functions/constants.", "duplicates");
    }
    if (complexity.commentRatio < 3 && complexity.totalLines > 40) {
      pushIssue(issues, "info", 1, "Very low comment density for a larger file.", "Add concise comments for complex logic, assumptions, or APIs.", "comments");
    }

    // Deduplicate similar line/rule issues lightly
    const seen = new Set();
    const unique = issues.filter((it) => {
      const key = `${it.rule}|${it.line}|${it.message}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const order = { error: 0, warning: 1, info: 2 };
    unique.sort((a, b) => (order[a.severity] - order[b.severity]) || (a.line - b.line));
    return unique;
  }

  function buildSuggestions(complexity, issues, lang) {
    const suggestions = [];
    const errorCount = issues.filter(i => i.severity === "error").length;
    const warningCount = issues.filter(i => i.severity === "warning").length;

    if (errorCount > 0) suggestions.push("Address error-level findings first to prevent incorrect behavior or hidden failures.");
    if (warningCount > 0) suggestions.push("Resolve warnings to improve correctness, maintainability, and consistency.");
    if (complexity.cyclomatic > 10) suggestions.push("Reduce branching by extracting helper functions and using early returns where possible.");
    if (complexity.maxNesting > 3) suggestions.push("Flatten nested conditionals with guard clauses to improve readability.");
    if (complexity.longLineCount > 0) suggestions.push("Wrap long lines and split complex expressions to make code easier to scan.");
    if (complexity.commentRatio < 5 && complexity.totalLines > 30) {
      suggestions.push("Add brief comments for non-obvious logic, assumptions, or edge cases.");
    }
    if (complexity.duplicateLines >= 4) suggestions.push("Reduce duplication by extracting repeated logic into reusable helpers.");
    if (complexity.functionCount <= 1 && complexity.nonEmpty > 25) suggestions.push("Decompose large blocks into smaller, single-purpose functions.");
    if (lang === "javascript") suggestions.push("Prefer consistent formatting and modern syntax (const/let, strict equality) for safer code.");
    if (lang === "python") suggestions.push("Follow PEP 8 style conventions and handle exceptions explicitly for robust scripts.");
    if (lang === "java") suggestions.push("Use meaningful method names, proper exception handling, and logging instead of console prints.");
    if (lang === "cpp") suggestions.push("Favor RAII and smart pointers to improve memory safety and resource management.");
    if (suggestions.length === 0) suggestions.push("Code structure looks clean. Continue adding tests and keeping functions focused.");

    return Array.from(new Set(suggestions)).slice(0, 8);
  }

  function computeScores(complexity, issues) {
    const errors = issues.filter(i => i.severity === "error").length;
    const warnings = issues.filter(i => i.severity === "warning").length;
    const infos = issues.filter(i => i.severity === "info").length;

    let health = 100;
    health -= errors * 12;
    health -= warnings * 6;
    health -= infos * 2;
    health -= Math.max(0, complexity.cyclomatic - 8) * 1.5;
    health -= Math.max(0, complexity.maxNesting - 3) * 3;
    health -= Math.min(10, complexity.longLineCount * 0.5);
    health = Math.max(0, Math.min(100, Math.round(health)));

    let maintainability = 100;
    maintainability -= Math.max(0, complexity.cyclomatic - 5) * 2;
    maintainability -= Math.max(0, complexity.maxNesting - 2) * 4;
    maintainability -= warnings * 3 + errors * 5;
    maintainability = Math.max(0, Math.min(100, Math.round(maintainability)));

    let label = "Needs Work";
    let summary = "Several issues or complexity hotspots were detected. Refactoring is recommended.";
    if (health >= 85) {
      label = "Excellent";
      summary = "Code quality looks strong with low risk and good maintainability.";
    } else if (health >= 70) {
      label = "Good";
      summary = "Code is generally healthy, with a few opportunities to improve clarity and robustness.";
    } else if (health >= 50) {
      label = "Fair";
      summary = "Some quality or complexity concerns detected. Target the highlighted issues first.";
    }

    return { health, maintainability, label, summary, errors, warnings, infos };
  }

  function detectLanguage(code) {
    const src = code || "";
    const lines = src.split(/\r?\n/);
    const scores = { javascript: 0, python: 0, java: 0, cpp: 0 };
    const add = (lang, n) => { scores[lang] += n; };

    // Strong signals
    if (/^\s*def\s+\w+\s*\(/m.test(src)) add("python", 5);
    if (/^\s*class\s+\w+\s*(\([^)]*\))?\s*:/m.test(src)) add("python", 4);
    if (/^\s*(elif|except)\b/m.test(src)) add("python", 4);
    if (/^\s*from\s+[\w.]+\s+import\b/m.test(src)) add("python", 4);
    if (/^\s*import\s+[\w.]+(\s*,\s*[\w.]+)*\s*$/m.test(src)) add("python", 2);
    if (/\bself\b/.test(src)) add("python", 2);
    if (/\bNone\b|\bTrue\b|\bFalse\b/.test(src)) add("python", 1);
    if (/^\s*print\s*\(/m.test(src)) add("python", 1);
    if (/^\s*@\w+/m.test(src)) add("python", 1);

    if (/^\s*#include\s*[<"]/m.test(src)) add("cpp", 6);
    if (/\bstd::\w+/.test(src)) add("cpp", 5);
    if (/\busing\s+namespace\s+std\b/.test(src)) add("cpp", 5);
    if (/\bcout\s*<<|\bcin\s*>>/.test(src)) add("cpp", 4);
    if (/\bint\s+main\s*\(/.test(src)) { add("cpp", 2); add("java", 1); }
    if (/->/.test(src) && /#include/.test(src)) add("cpp", 2);
    if (/\bprintf\s*\(|\bmalloc\s*\(|\bfree\s*\(/.test(src)) add("cpp", 1);

    if (/\bpublic\s+class\b/.test(src)) add("java", 6);
    if (/\bSystem\.out\.(print|println)/.test(src)) add("java", 5);
    if (/\bpublic\s+static\s+void\s+main\b/.test(src)) add("java", 6);
    if (/\bimport\s+java\.[\w.*]+;/.test(src)) add("java", 5);
    if (/\b(String|Integer|Boolean|List|Map)\b/.test(src) && /;/.test(src)) add("java", 1);
    if (/\bextends\b|\bimplements\b/.test(src)) add("java", 2);
    if (/^\s*@Override\b/m.test(src)) add("java", 3);

    if (/\bfunction\b\s*\w*\s*\(/.test(src)) add("javascript", 4);
    if (/\b(console\.|document\.|window\.|module\.exports)\b/.test(src)) add("javascript", 4);
    if (/\b(const|let|var)\s+\w+/.test(src)) add("javascript", 3);
    if (/=>/.test(src)) add("javascript", 3);
    if (/===|!==/.test(src)) add("javascript", 2);
    if (/\bexport\s+(default\b|const\b|function\b)|\bimport\s+.*\s+from\s+['"]/.test(src)) add("javascript", 3);
    if (/;\s*$/m.test(src) && /[{()}]/.test(src)) { add("javascript", 1); add("java", 1); add("cpp", 1); }

    // Penalties / balancing
    if (/^\s*def\s+/m.test(src) || /:\s*$/m.test(src) && !/[{}]/.test(src)) { add("java", -1); add("cpp", -1); add("javascript", -1); }
    if (/[{}];?/.test(src) && /;\s*$/m.test(src)) add("python", -2);
    if (/^\s*#include/m.test(src)) { add("java", -2); add("javascript", -2); add("python", -2); }
    if (/\bSystem\.out\b/.test(src)) { add("cpp", -2); add("javascript", -2); }
    if (/\bstd::/.test(src)) { add("java", -2); add("javascript", -2); }

    // Indentation style hint for python
    const indentedBlocks = lines.filter(l => /^\s{4,}\S/.test(l)).length;
    const braceCount = (src.match(/[{}]/g) || []).length;
    if (indentedBlocks > 2 && braceCount === 0) add("python", 2);

    let bestLang = "javascript";
    let bestScore = -Infinity;
    Object.keys(scores).forEach((k) => {
      if (scores[k] > bestScore) { bestScore = scores[k]; bestLang = k; }
    });

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const second = sorted[1] ? sorted[1][1] : -Infinity;
    const margin = bestScore - second;
    let confidence = "low";
    if (bestScore >= 8 && margin >= 3) confidence = "high";
    else if (bestScore >= 4 && margin >= 2) confidence = "medium";

    return { lang: bestLang, confidence, scores, margin, bestScore };
  }

  function analyze(code, lang) {
    const normalizedLang = (lang || "javascript").toLowerCase();
    const complexity = analyzeComplexity(code, normalizedLang);
    const issues = detectCommonIssues(code, normalizedLang, complexity);
    const suggestions = buildSuggestions(complexity, issues, normalizedLang);
    const scores = computeScores(complexity, issues);
    const detection = detectLanguage(code);
    return { lang: normalizedLang, complexity, issues, suggestions, scores, detection };
  }

  window.CodeSenseAnalyzer = { analyze, detectLanguage };
})();