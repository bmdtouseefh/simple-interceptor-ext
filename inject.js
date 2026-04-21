// inject.js
(function () {
  function luhnCheck(card) {
    const digits = card.replace(/\D/g, "");
    if (digits.length < 13 || digits.length > 19) return false;
    let sum = 0, isEven = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    return sum % 10 === 0;
  }

  const PATTERN_KEYS = {
    email: "EMAIL",
    phone: "PHONE",
    ssn: "SSN",
    creditCard: "CREDIT_CARD",
    apiKey: "API_KEY",
    ipAddress: "IPV4",
  };

  const SECURITY_PATTERNS = {
    EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    PHONE: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    SSN: /\b\d{3}-\d{2}-\d{4}\b/g,
    CREDIT_CARD: {
      regex: /\b(?:\d[ -]*?){13,16}\b/g,
      validate: luhnCheck,
    },
    API_KEY: /(?:sk-|key-|secret-)[a-zA-Z0-9]{32,}/gi,
    AUTH_BEARER: /Bearer\s+[a-zA-Z0-9\-\._~\+\/]+=*/gi,
    AWS_KEY: /AKIA[0-9A-Z]{16}/g,
    IPV4: /\b(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\b/g,
    IPV6: /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g,
    GEMINI_ANT: /(AIza[0-9A-Za-z\-_]{35})|(sk-ant-[a-zA-Z0-9\-_]{20,})/g,
  };

  let enabledPatterns = null;
  if (chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get("patterns", (data) => {
      enabledPatterns = data.patterns || null;
    });
  }

  // --- 1. THE NOTIFICATION BRIDGE ---
  function notifyExtension(category, count) {
    const event = new CustomEvent("INTERCEPT_AI_REDACTION", {
      detail: { category, count, timestamp: Date.now() },
    });
    window.dispatchEvent(event);
  }

  // --- 2. REDACTION ENGINE ---
  function isPatternEnabled(category) {
    if (!enabledPatterns) return true;
    for (const [key, cat] of Object.entries(PATTERN_KEYS)) {
      if (cat === category && enabledPatterns[key] === false) return false;
    }
    return true;
  }

  function redact(text, shouldNotify = false) {
    if (typeof text !== "string") return text;
    let result = text;

    for (const [category, pattern] of Object.entries(SECURITY_PATTERNS)) {
      if (!isPatternEnabled(category)) continue;

      let regex, validate;
      if (typeof pattern === "object" && pattern.regex) {
        regex = pattern.regex;
        validate = pattern.validate;
      } else {
        regex = pattern;
      }

      const matches = text.match(regex);
      if (matches) {
        let validMatches = matches;
        if (validate) {
          validMatches = matches.filter(m => validate(m));
        }
        if (validMatches.length > 0) {
          if (shouldNotify) notifyExtension(category, validMatches.length);
          for (const match of validMatches) {
            result = result.replace(match, `[REDACTED_${category}]`);
          }
        }
      }
    }
    return result;
  }

  function deepRedact(obj, shouldNotify = false) {
    if (typeof obj === "string") return redact(obj, shouldNotify);
    if (Array.isArray(obj))
      return obj.map((item) => deepRedact(item, shouldNotify));
    if (obj !== null && typeof obj === "object") {
      const newObj = {};
      for (const k in obj) newObj[k] = deepRedact(obj[k], shouldNotify);
      return newObj;
    }
    return obj;
  }

  // --- 3. PAYLOAD DETECTION ---
  function isLikelyAiPayload(obj) {
    if (!obj || typeof obj !== "object") return false;
    const aiSignatures = ["messages", "prompt", "contents", "inputs", "action"];
    return aiSignatures.some((key) => key in obj);
  }

  function processBody(body) {
    if (!body) return body;

    try {
      // Handle JSON
      if (
        typeof body === "string" &&
        (body.startsWith("{") || body.startsWith("["))
      ) {
        const json = JSON.parse(body);
        const isAI = isLikelyAiPayload(json);
        // Only notify/count if it's an AI payload; otherwise, redact silently
        return JSON.stringify(deepRedact(json, isAI));
      }

      // Handle FormData
      if (body instanceof FormData) {
        for (let [key, value] of body.entries()) {
          if (typeof value === "string") {
            body.set(key, redact(value, true)); // Assume FormData with strings is intentional
          }
        }
        return body;
      }
    } catch (e) {
      return redact(body, false);
    }
    return redact(body, false);
  }

  // --- 4. INTERCEPTORS ---
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    try {
      let [resource, config] = args;
      if (config && config.body) {
        config.body = processBody(config.body);
      }
      return originalFetch.apply(this, args);
    } catch (e) {
      return originalFetch.apply(this, args);
    }
  };

  const originalXhrSend = window.XMLHttpRequest.prototype.send;
  window.XMLHttpRequest.prototype.send = function (body) {
    const redactedBody = processBody(body);
    return originalXhrSend.apply(this, [redactedBody]);
  };
})();
