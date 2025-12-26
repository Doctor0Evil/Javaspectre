// Path: src/blueprints/SystemCompatibilityBadgeGenerator.js

/**
 * SystemCompatibilityBadgeGenerator
 *
 * Generates rich Shields.io badges describing compatibility across:
 * - Operating systems (Linux, macOS, Windows, BSD, etc.)
 * - CPU architectures (x86_64, arm64, RISC-V, etc.)
 * - Runtimes (Node.js, Deno, Bun, browser, Docker)
 * - Package managers/tools (npm, pnpm, yarn, pip, cargo, etc.)
 *
 * Designed for GitHub READMEs and machine-readable selection UIs.
 */
class SystemCompatibilityBadgeGenerator {
  // ----------------------------
  // Static datasets
  // ----------------------------

  static OS_DATA = [
    {
      id: "linux",
      label: "linux",
      color: "#2ebc4f",
      logo: "linux",
      aliases: ["ubuntu", "debian", "fedora", "arch"]
    },
    {
      id: "macos",
      label: "macOS",
      color: "#000000",
      logo: "apple",
      aliases: ["darwin"]
    },
    {
      id: "windows",
      label: "windows",
      color: "#0078D6",
      logo: "windows",
      aliases: ["win32"]
    },
    {
      id: "freebsd",
      label: "FreeBSD",
      color: "#AB2B28",
      logo: "freebsd"
    },
    {
      id: "openbsd",
      label: "OpenBSD",
      color: "#F2CA30",
      logo: "openbsd"
    },
    {
      id: "android",
      label: "Android",
      color: "#3DDC84",
      logo: "android"
    }
  ];

  static ARCH_DATA = [
    {
      id: "x86_64",
      label: "x86_64",
      color: "#0969da",
      logo: "intel",
      aliases: ["amd64"]
    },
    {
      id: "arm64",
      label: "arm64",
      color: "#00d084",
      logo: "arm"
    },
    {
      id: "armv7",
      label: "armv7",
      color: "#54aeff",
      logo: "raspberry-pi"
    },
    {
      id: "riscv64",
      label: "risc-v",
      color: "#f78166",
      logo: "risc-v"
    }
  ];

  static RUNTIME_DATA = [
    {
      id: "node",
      label: "Node.js",
      color: "#43853d",
      logo: "node.js",
      ranges: ["^18", "^20", "^22"]
    },
    {
      id: "deno",
      label: "Deno",
      color: "#000000",
      logo: "deno",
      ranges: [">=1.42"]
    },
    {
      id: "bun",
      label: "Bun",
      color: "#fbf0df",
      logo: "bun",
      ranges: [">=1.0"]
    },
    {
      id: "browser",
      label: "browser",
      color: "#facc15",
      logo: "googlechrome",
      ranges: ["modern evergreen"]
    },
    {
      id: "docker",
      label: "Docker",
      color: "#0db7ed",
      logo: "docker",
      ranges: ["linux/amd64", "linux/arm64"]
    }
  ];

  static TOOL_DATA = [
    {
      id: "npm",
      label: "npm",
      color: "#CB3837",
      logo: "npm"
    },
    {
      id: "pnpm",
      label: "pnpm",
      color: "#F69220",
      logo: "pnpm"
    },
    {
      id: "yarn",
      label: "yarn",
      color: "#2C8EBB",
      logo: "yarn"
    },
    {
      id: "pip",
      label: "pip",
      color: "#3776AB",
      logo: "pypi"
    },
    {
      id: "cargo",
      label: "cargo",
      color: "#000000",
      logo: "rust"
    }
  ];

  // ----------------------------
  // Core builder
  // ----------------------------

  /**
   * Create a Shields.io badge descriptor.
   * @param {object} opts
   * @param {string} opts.label
   * @param {string} opts.message
   * @param {string} opts.color
   * @param {string} [opts.style]
   * @param {string} [opts.logo]
   * @param {string} [opts.link]
   * @returns {{markdown: string, url: string, meta: object}}
   */
  static makeBadge({
    label,
    message,
    color,
    style = "for-the-badge",
    logo,
    link = "#"
  }) {
    const safeColor = color.startsWith("#") ? color.slice(1) : color;
    const url = `https://img.shields.io/badge/${encodeURIComponent(label)}-${encodeURIComponent(
      message
    )}-${encodeURIComponent(safeColor)}?style=${encodeURIComponent(style)}${
      logo ? `&logo=${encodeURIComponent(logo)}` : ""
    }`;

    const markdown = `[![${label}](${url})](${link})`;

    return {
      markdown,
      url,
      meta: {
        label,
        message,
        color: safeColor,
        style,
        logo: logo || null,
        link
      }
    };
  }

  // ----------------------------
  // OS compatibility
  // ----------------------------

  /**
   * Generate badges summarizing OS compatibility.
   * @param {string[]} osIds - e.g., ["linux", "macos", "windows"]
   */
  static osCompatibilityBadges(osIds) {
    const supported = SystemCompatibilityBadgeGenerator.OS_DATA.filter((os) =>
      osIds.includes(os.id)
    );

    const labels = supported.map((os) => os.label).join(" | ") || "unknown";
    const primaryColor = supported[0]?.color || "#6e7781";

    const summaryBadge = SystemCompatibilityBadgeGenerator.makeBadge({
      label: "os",
      message: labels,
      color: primaryColor,
      style: "for-the-badge",
      logo: "github",
      link: "#os-compatibility"
    });

    const perOsBadges = supported.map((os) =>
      SystemCompatibilityBadgeGenerator.makeBadge({
        label: "os",
        message: os.label,
        color: os.color,
        style: "flat-square",
        logo: os.logo,
        link: "#os-compatibility"
      })
    );

    return {
      summary: { ...summaryBadge, purpose: "Aggregate OS compatibility overview" },
      perOs: perOsBadges.map((b, idx) => ({
        ...b,
        osId: supported[idx].id,
        purpose: `Per-OS compatibility indicator for ${supported[idx].label}`
      }))
    };
  }

  // ----------------------------
  // CPU architecture compatibility
  // ----------------------------

  static archCompatibilityBadges(archIds) {
    const supported = SystemCompatibilityBadgeGenerator.ARCH_DATA.filter((arch) =>
      archIds.includes(arch.id)
    );

    const labels = supported.map((a) => a.label).join(" | ") || "generic";
    const primaryColor = supported[0]?.color || "#6e7781";

    const summary = SystemCompatibilityBadgeGenerator.makeBadge({
      label: "arch",
      message: labels,
      color: primaryColor,
      style: "for-the-badge",
      logo: "processor",
      link: "#architecture-compatibility"
    });

    const perArch = supported.map((arch) =>
      SystemCompatibilityBadgeGenerator.makeBadge({
        label: "arch",
        message: arch.label,
        color: arch.color,
        style: "flat",
        logo: arch.logo,
        link: "#architecture-compatibility"
      })
    );

    return {
      summary: { ...summary, purpose: "Aggregate CPU architecture compatibility overview" },
      perArch: perArch.map((b, idx) => ({
        ...b,
        archId: supported[idx].id,
        purpose: `Per-architecture compatibility for ${supported[idx].label}`
      }))
    };
  }

  // ----------------------------
  // Runtime compatibility
  // ----------------------------

  static runtimeCompatibilityBadges(runtimeIds) {
    const supported = SystemCompatibilityBadgeGenerator.RUNTIME_DATA.filter((rt) =>
      runtimeIds.includes(rt.id)
    );

    const badges = [];
    supported.forEach((rt) => {
      const rangeMessage = rt.ranges.join(", ");
      const badge = SystemCompatibilityBadgeGenerator.makeBadge({
        label: rt.label,
        message: rangeMessage,
        color: rt.color,
        style: "for-the-badge",
        logo: rt.logo,
        link: "#runtime-compatibility"
      });
      badges.push({
        ...badge,
        runtimeId: rt.id,
        ranges: rt.ranges.slice(),
        purpose: `Runtime support range for ${rt.label}`
      });
    });

    const summaryMessage =
      supported.length > 0
        ? supported.map((rt) => `${rt.label} ${rt.ranges.join("/")}`).join(" | ")
        : "none";

    const summaryColor = supported[0]?.color || "#6e7781";

    const summary = SystemCompatibilityBadgeGenerator.makeBadge({
      label: "runtime",
      message: summaryMessage,
      color: summaryColor,
      style: "flat-square",
      logo: "github",
      link: "#runtime-compatibility"
    });

    return {
      summary: {
        ...summary,
        purpose: "Aggregate runtime compatibility overview"
      },
      perRuntime: badges
    };
  }

  // ----------------------------
  // Tool / package manager compatibility
  // ----------------------------

  static toolCompatibilityBadges(toolIds) {
    const supported = SystemCompatibilityBadgeGenerator.TOOL_DATA.filter((t) =>
      toolIds.includes(t.id)
    );

    const summaryMessage = supported.map((t) => t.label).join(" | ") || "generic";
    const summaryColor = supported[0]?.color || "#6e7781";

    const summary = SystemCompatibilityBadgeGenerator.makeBadge({
      label: "tools",
      message: summaryMessage,
      color: summaryColor,
      style: "for-the-badge",
      logo: "github",
      link: "#tooling-compatibility"
    });

    const perTool = supported.map((t) =>
      SystemCompatibilityBadgeGenerator.makeBadge({
        label: "tool",
        message: t.label,
        color: t.color,
        style: "flat",
        logo: t.logo,
        link: "#tooling-compatibility"
      })
    );

    return {
      summary: { ...summary, purpose: "Aggregate tooling / package manager compatibility" },
      perTool: perTool.map((b, idx) => ({
        ...b,
        toolId: supported[idx].id,
        purpose: `Compatibility / tested with ${supported[idx].label}`
      }))
    };
  }

  // ----------------------------
  // Composite compatibility badge set
  // ----------------------------

  /**
   * Build a complete compatibility badge suite for a project.
   *
   * @param {object} config
   * @param {string[]} [config.os]    - OS ids
   * @param {string[]} [config.arch]  - architecture ids
   * @param {string[]} [config.runtime] - runtime ids
   * @param {string[]} [config.tools] - tooling ids
   */
  static fullCompatibilityKit(config = {}) {
    const osIds = config.os || ["linux", "macos", "windows"];
    const archIds = config.arch || ["x86_64", "arm64"];
    const runtimeIds = config.runtime || ["node", "docker"];
    const toolIds = config.tools || ["npm", "pnpm", "yarn"];

    const os = SystemCompatibilityBadgeGenerator.osCompatibilityBadges(osIds);
    const arch = SystemCompatibilityBadgeGenerator.archCompatibilityBadges(archIds);
    const runtime = SystemCompatibilityBadgeGenerator.runtimeCompatibilityBadges(runtimeIds);
    const tools = SystemCompatibilityBadgeGenerator.toolCompatibilityBadges(toolIds);

    return {
      os,
      arch,
      runtime,
      tools,
      allMarkdown: [
        os.summary.markdown,
        ...os.perOs.map((b) => b.markdown),
        arch.summary.markdown,
        ...arch.perArch.map((b) => b.markdown),
        runtime.summary.markdown,
        ...runtime.perRuntime.map((b) => b.markdown),
        tools.summary.markdown,
        ...tools.perTool.map((b) => b.markdown)
      ]
    };
  }

  // ----------------------------
  // Randomized compatibility badge
  // ----------------------------

  /**
   * Random badge describing a (OS, arch, runtime) tuple.
   * Good for demos or showcasing breadth of support.
   */
  static randomCompatibilityBadge(seed = null) {
    const rng = SystemCompatibilityBadgeGenerator._rng(seed);

    const os = SystemCompatibilityBadgeGenerator.OS_DATA[
      Math.floor(rng() * SystemCompatibilityBadgeGenerator.OS_DATA.length)
    ];
    const arch = SystemCompatibilityBadgeGenerator.ARCH_DATA[
      Math.floor(rng() * SystemCompatibilityBadgeGenerator.ARCH_DATA.length)
    ];
    const runtime = SystemCompatibilityBadgeGenerator.RUNTIME_DATA[
      Math.floor(rng() * SystemCompatibilityBadgeGenerator.RUNTIME_DATA.length)
    ];

    const label = "compat";
    const message = `${os.label} · ${arch.label} · ${runtime.label}`;
    const color = os.color;
    const badge = SystemCompatibilityBadgeGenerator.makeBadge({
      label,
      message,
      color,
      style: "for-the-badge",
      logo: runtime.logo,
      link: "#system-compatibility"
    });

    return {
      ...badge,
      tuple: {
        os: os.id,
        arch: arch.id,
        runtime: runtime.id
      },
      purpose: "Random but realistic compatibility tuple badge"
    };
  }

  /**
   * Mulberry32 PRNG for deterministic randomness.
   */
  static _rng(seed) {
    let a =
      typeof seed === "number" && Number.isFinite(seed)
        ? seed >>> 0
        : (Date.now() & 0xffffffff) >>> 0;

    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
}

export default SystemCompatibilityBadgeGenerator;
