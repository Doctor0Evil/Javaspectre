// Path: src/i18n/LanguageCapabilityRegistry.js

const LANGUAGE_CAPABILITIES = [
  {
    code: "en-US",
    base: "en",
    direction: "ltr",
    region: "US",
    script: "Latin",
    names: {
      endonym: "English (United States)",
      english: "English (United States)"
    },
    fallbackChain: ["en", "en-GB"]
  },
  {
    code: "en-GB",
    base: "en",
    direction: "ltr",
    region: "GB",
    script: "Latin",
    names: {
      endonym: "English (United Kingdom)",
      english: "English (United Kingdom)"
    },
    fallbackChain: ["en"]
  },
  {
    code: "en",
    base: "en",
    direction: "ltr",
    region: null,
    script: "Latin",
    names: {
      endonym: "English",
      english: "English"
    },
    fallbackChain: []
  },
  {
    code: "ar",
    base: "ar",
    direction: "rtl",
    region: null,
    script: "Arabic",
    names: {
      endonym: "العربية",
      english: "Arabic"
    },
    fallbackChain: ["ar-SA", "ar-EG"]
  },
  {
    code: "ar-SA",
    base: "ar",
    direction: "rtl",
    region: "SA",
    script: "Arabic",
    names: {
      endonym: "العربية (السعودية)",
      english: "Arabic (Saudi Arabia)"
    },
    fallbackChain: ["ar"]
  },
  {
    code: "ar-EG",
    base: "ar",
    direction: "rtl",
    region: "EG",
    script: "Arabic",
    names: {
      endonym: "العربية (مصر)",
      english: "Arabic (Egypt)"
    },
    fallbackChain: ["ar"]
  },
  {
    code: "zh-TW",
    base: "zh",
    direction: "ltr",
    region: "TW",
    script: "Traditional Han",
    names: {
      endonym: "繁體中文（台灣）",
      english: "Chinese (Traditional, Taiwan)"
    },
    fallbackChain: ["zh-Hant", "zh"]
  },
  {
    code: "zh-HK",
    base: "zh",
    direction: "ltr",
    region: "HK",
    script: "Traditional Han",
    names: {
      endonym: "繁體中文（香港）",
      english: "Chinese (Traditional, Hong Kong)"
    },
    fallbackChain: ["zh-Hant", "zh"]
  },
  {
    code: "zh-Hant",
    base: "zh",
    direction: "ltr",
    region: null,
    script: "Traditional Han",
    names: {
      endonym: "繁體中文",
      english: "Chinese (Traditional)"
    },
    fallbackChain: ["zh"]
  },
  {
    code: "zh-CN",
    base: "zh",
    direction: "ltr",
    region: "CN",
    script: "Simplified Han",
    names: {
      endonym: "简体中文（中国）",
      english: "Chinese (Simplified, China)"
    },
    fallbackChain: ["zh-Hans", "zh"]
  },
  {
    code: "zh-SG",
    base: "zh",
    direction: "ltr",
    region: "SG",
    script: "Simplified Han",
    names: {
      endonym: "简体中文（新加坡）",
      english: "Chinese (Simplified, Singapore)"
    },
    fallbackChain: ["zh-Hans", "zh"]
  },
  {
    code: "zh-Hans",
    base: "zh",
    direction: "ltr",
    region: null,
    script: "Simplified Han",
    names: {
      endonym: "简体中文",
      english: "Chinese (Simplified)"
    },
    fallbackChain: ["zh"]
  },
  {
    code: "zh",
    base: "zh",
    direction: "ltr",
    region: null,
    script: "Han",
    names: {
      endonym: "中文",
      english: "Chinese"
    },
    fallbackChain: []
  },
  {
    code: "es-ES",
    base: "es",
    direction: "ltr",
    region: "ES",
    script: "Latin",
    names: {
      endonym: "Español (España)",
      english: "Spanish (Spain)"
    },
    fallbackChain: ["es"]
  },
  {
    code: "es-MX",
    base: "es",
    direction: "ltr",
    region: "MX",
    script: "Latin",
    names: {
      endonym: "Español (México)",
      english: "Spanish (Mexico)"
    },
    fallbackChain: ["es"]
  },
  {
    code: "es",
    base: "es",
    direction: "ltr",
    region: null,
    script: "Latin",
    names: {
      endonym: "Español",
      english: "Spanish"
    },
    fallbackChain: []
  },
  {
    code: "fr-FR",
    base: "fr",
    direction: "ltr",
    region: "FR",
    script: "Latin",
    names: {
      endonym: "Français (France)",
      english: "French (France)"
    },
    fallbackChain: ["fr"]
  },
  {
    code: "fr-CA",
    base: "fr",
    direction: "ltr",
    region: "CA",
    script: "Latin",
    names: {
      endonym: "Français (Canada)",
      english: "French (Canada)"
    },
    fallbackChain: ["fr"]
  },
  {
    code: "fr",
    base: "fr",
    direction: "ltr",
    region: null,
    script: "Latin",
    names: {
      endonym: "Français",
      english: "French"
    },
    fallbackChain: []
  },
  {
    code: "de-DE",
    base: "de",
    direction: "ltr",
    region: "DE",
    script: "Latin",
    names: {
      endonym: "Deutsch (Deutschland)",
      english: "German (Germany)"
    },
    fallbackChain: ["de"]
  },
  {
    code: "de",
    base: "de",
    direction: "ltr",
    region: null,
    script: "Latin",
    names: {
      endonym: "Deutsch",
      english: "German"
    },
    fallbackChain: []
  },
  {
    code: "ja-JP",
    base: "ja",
    direction: "ltr",
    region: "JP",
    script: "Japanese",
    names: {
      endonym: "日本語（日本）",
      english: "Japanese (Japan)"
    },
    fallbackChain: ["ja"]
  },
  {
    code: "ja",
    base: "ja",
    direction: "ltr",
    region: null,
    script: "Japanese",
    names: {
      endonym: "日本語",
      english: "Japanese"
    },
    fallbackChain: []
  },
  {
    code: "ru-RU",
    base: "ru",
    direction: "ltr",
    region: "RU",
    script: "Cyrillic",
    names: {
      endonym: "Русский (Россия)",
      english: "Russian (Russia)"
    },
    fallbackChain: ["ru"]
  },
  {
    code: "ru",
    base: "ru",
    direction: "ltr",
    region: null,
    script: "Cyrillic",
    names: {
      endonym: "Русский",
      english: "Russian"
    },
    fallbackChain: []
  }
];

const LANGUAGE_INDEX = LANGUAGE_CAPABILITIES.reduce((acc, lang) => {
  acc[lang.code.toLowerCase()] = lang;
  return acc;
}, {});

const BASE_INDEX = LANGUAGE_CAPABILITIES.reduce((acc, lang) => {
  const base = lang.base.toLowerCase();
  if (!acc[base]) {
    acc[base] = [];
  }
  acc[base].push(lang.code);
  return acc;
}, {});

export function getLanguage(code) {
  if (!code || typeof code !== "string") {
    return null;
  }
  const normalized = code.toLowerCase();
  if (LANGUAGE_INDEX[normalized]) {
    return LANGUAGE_INDEX[normalized];
  }
  const base = normalized.split("-")[0];
  return LANGUAGE_INDEX[base] || null;
}

export function getSupportedCodes() {
  return LANGUAGE_CAPABILITIES.map((lang) => lang.code);
}

export function getBaseVariants(baseCode) {
  if (!baseCode || typeof baseCode !== "string") {
    return [];
  }
  const base = baseCode.toLowerCase();
  return BASE_INDEX[base] || [];
}

export function isRtl(code) {
  const lang = getLanguage(code);
  if (!lang) {
    return false;
  }
  return lang.direction === "rtl";
}

export function getEffectiveFallbackChain(code) {
  const lang = getLanguage(code);
  if (!lang) {
    return [];
  }
  const chain = [];
  const visited = new Set();

  function add(codeCandidate) {
    const normalized = codeCandidate.toLowerCase();
    if (visited.has(normalized)) {
      return;
    }
    visited.add(normalized);
    const l = LANGUAGE_INDEX[normalized];
    if (l) {
      chain.push(l.code);
      l.fallbackChain.forEach(add);
    }
  }

  add(lang.code);
  return chain;
}

export function mergeBrowserLanguages(browserLanguages) {
  if (!Array.isArray(browserLanguages)) {
    return [];
  }
  const result = [];
  const seen = new Set();

  browserLanguages.forEach((raw) => {
    if (typeof raw !== "string") {
      return;
    }
    const lang = getLanguage(raw);
    if (!lang) {
      return;
    }
    if (!seen.has(lang.code)) {
      seen.add(lang.code);
      result.push(lang.code);
    }
  });

  return result;
}
