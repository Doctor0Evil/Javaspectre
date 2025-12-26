// Path: src/spectral/JavaspectreEnvironmentProbe.js

// This module harvests multiple browser virtual-objects into structured,
// reusable descriptors suitable for deep virtual-object excavation and ALN use.

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

function getLanguage(code) {
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

function getSupportedLanguageCodes() {
  return LANGUAGE_CAPABILITIES.map((lang) => lang.code);
}

function getBaseLanguageVariants(baseCode) {
  if (!baseCode || typeof baseCode !== "string") {
    return [];
  }
  const base = baseCode.toLowerCase();
  return BASE_INDEX[base] || [];
}

function isLanguageRtl(code) {
  const lang = getLanguage(code);
  if (!lang) {
    return false;
  }
  return lang.direction === "rtl";
}

function getLanguageFallbackChain(code) {
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

function mergeBrowserLanguages(browserLanguages) {
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

function probeVirtualKeyboard(win) {
  const vkb = win.navigator.virtualKeyboard || null;
  let rect = null;
  let visible = false;

  if (vkb && typeof vkb.boundingRect === "object" && vkb.boundingRect !== null) {
    const r = vkb.boundingRect;
    rect = {
      x: r.x || 0,
      y: r.y || 0,
      width: r.width || 0,
      height: r.height || 0,
      top: r.top || 0,
      right: r.right || 0,
      bottom: r.bottom || 0,
      left: r.left || 0
    };
    visible = rect.width > 0 && rect.height > 0;
  }

  return {
    kind: "VirtualKeyboardState",
    present: Boolean(vkb),
    visible,
    boundingRect: rect,
    layoutEffectZone: visible ? rect : null
  };
}

function probePdfPlugins(win) {
  const nav = win.navigator;
  if (!nav || !nav.plugins) {
    return {
      kind: "PdfRenderingCapabilitySet",
      present: false,
      pluginCount: 0,
      brands: [],
      mimeTypes: [],
      canonicalEngineId: null,
      plugins: []
    };
  }

  const pdfPlugins = [];
  const { plugins } = nav;

  for (let i = 0; i < plugins.length; i += 1) {
    const p = plugins[i];
    if (!p || !p.name || !p.filename) {
      continue;
    }
    const mimeTypes = [];
    for (let j = 0; j < p.length; j += 1) {
      const mt = p[j];
      if (mt && mt.type) {
        mimeTypes.push(mt.type);
      }
    }
    const hasPdf =
      mimeTypes.includes("application/pdf") || mimeTypes.includes("text/pdf");
    if (!hasPdf) {
      continue;
    }

    pdfPlugins.push({
      name: p.name,
      filename: p.filename,
      description: p.description || "",
      mimeTypes
    });
  }

  const brands = pdfPlugins.map((p) => p.name);
  const canonicalEngineId =
    pdfPlugins.length > 0 ? pdfPlugins[0].filename : null;
  const mimeSet = new Set();
  pdfPlugins.forEach((p) => {
    p.mimeTypes.forEach((t) => mimeSet.add(t));
  });

  return {
    kind: "PdfRenderingCapabilitySet",
    present: pdfPlugins.length > 0,
    pluginCount: pdfPlugins.length,
    brands,
    mimeTypes: Array.from(mimeSet),
    canonicalEngineId,
    plugins: pdfPlugins
  };
}

function probeXRSystem(win) {
  const nav = win.navigator;
  const xr = nav && nav.xr ? nav.xr : null;
  if (!xr) {
    return {
      kind: "XRCapabilitySurface",
      present: false,
      supportsImmersiveVR: null,
      supportsImmersiveAR: null
    };
  }

  const support = {
    supportsImmersiveVR: null,
    supportsImmersiveAR: null
  };

  if (typeof xr.isSessionSupported === "function") {
    try {
      xr.isSessionSupported("immersive-vr").then(
        (ok) => {
          support.supportsImmersiveVR = Boolean(ok);
        },
        () => {
          support.supportsImmersiveVR = false;
        }
      );
    } catch {
      support.supportsImmersiveVR = null;
    }

    try {
      xr.isSessionSupported("immersive-ar").then(
        (ok) => {
          support.supportsImmersiveAR = Boolean(ok);
        },
        () => {
          support.supportsImmersiveAR = false;
        }
      );
    } catch {
      support.supportsImmersiveAR = null;
    }
  }

  return {
    kind: "XRCapabilitySurface",
    present: true,
    supportsImmersiveVR: support.supportsImmersiveVR,
    supportsImmersiveAR: support.supportsImmersiveAR,
    hasRequestSession: typeof xr.requestSession === "function",
    prototypeChain: ["Navigator", "XRSystem", "EventTarget", "Object"]
  };
}

function probeEthereum(win) {
  const eth = win.ethereum || null;
  if (!eth) {
    return {
      kind: "BrowserEthereumSurface",
      present: false
    };
  }

  const chainId =
    typeof eth.chainId === "string" || typeof eth.chainId === "number"
      ? eth.chainId
      : null;
  const networkVersion =
    typeof eth.networkVersion === "string" || typeof eth.networkVersion === "number"
      ? eth.networkVersion
      : null;
  const isConnected =
    eth.internalState && typeof eth.internalState.isConnected === "boolean"
      ? eth.internalState.isConnected
      : false;
  const selectedAddress =
    typeof eth.selectedAddress === "string" ? eth.selectedAddress : null;

  const vendors = [];
  if (eth.isMetaMask) {
    vendors.push("MetaMask");
  }
  if (eth.isWombat) {
    vendors.push("Wombat");
  }

  const hasRequest = typeof eth.request === "function";
  const hasOn = typeof eth.on === "function";
  const hasEmit = typeof eth.emit === "function";

  return {
    kind: "BrowserEthereumSurface",
    present: true,
    chainId,
    networkVersion,
    connected: isConnected,
    selectedAddress,
    vendors,
    supportsRequest: hasRequest,
    supportsEvents: hasOn && hasEmit
  };
}

function probeLanguages(win) {
  const nav = win.navigator || {};
  const browserLanguages =
    Array.isArray(nav.languages) && nav.languages.length > 0
      ? nav.languages
      : nav.language
      ? [nav.language]
      : [];

  const merged = mergeBrowserLanguages(browserLanguages);

  const details = merged.map((code) => ({
    code,
    rtl: isLanguageRtl(code),
    fallbacks: getLanguageFallbackChain(code)
  }));

  return {
    kind: "LanguageCapabilityRegistryView",
    browserRaw: browserLanguages,
    supportedMerged: merged,
    details,
    allSupportedCodes: getSupportedLanguageCodes()
  };
}

export function probeEnvironment(win) {
  const w = win || (typeof window !== "undefined" ? window : null);
  if (!w) {
    return {
      timestamp: new Date().toISOString(),
      error: "No window object available for probing."
    };
  }

  return {
    timestamp: new Date().toISOString(),
    virtualKeyboard: probeVirtualKeyboard(w),
    pdfCapabilities: probePdfPlugins(w),
    xrCapabilities: probeXRSystem(w),
    ethereumSurface: probeEthereum(w),
    languageCapabilities: probeLanguages(w)
  };
}

export const JavaspectreEnvironmentProbe = {
  probeEnvironment,
  getLanguage,
  getSupportedLanguageCodes,
  getBaseLanguageVariants,
  isLanguageRtl,
  getLanguageFallbackChain
};
