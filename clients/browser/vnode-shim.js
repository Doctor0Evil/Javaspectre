// clients/browser/vnode-shim.js

const JavaspectreVNodeShim = (function () {
  const STORAGE_KEY = "javaspectre_session_ticket";

  async function detectBrowserFamily() {
    const ua = navigator.userAgent || "";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Edg/")) return "Edge";
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Safari")) return "Safari";
    return "Other";
  }

  function detectDeviceClass() {
    const width = window.innerWidth || 1024;
    if (width < 768) return "Phone";
    if (width < 1024) return "Tablet";
    return "Desktop";
  }

  async function buildVNodeProfile() {
    return {
      vnode_id: crypto.randomUUID ? crypto.randomUUID() : `vnode-${Date.now()}`,
      browser_family: await detectBrowserFamily(),
      origin: window.location.origin,
      device_class: detectDeviceClass(),
      auth_method: "WebAuthn", // or "OrgKey" for kiosk/service nodes
      capabilities: [
        "repo:read",
        "repo:propose",
        "ai-policy-read"
      ],
      log_backend: "Remote",
      labels: {
        user_agent_hash: await hashUserAgent(navigator.userAgent || "")
      }
    };
  }

  async function hashUserAgent(ua) {
    const enc = new TextEncoder();
    const data = enc.encode(ua);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(digest)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  async function requestSessionTicket(sessionServiceUrl, vnodeProfile, requestedAbilities) {
    const body = {
      vnode_profile: vnodeProfile,
      requested_abilities: requestedAbilities,
      auth_assertion: "<webauthn-assertion-or-orgkey>" // placeholder: integrate real WebAuthn
    };

    const res = await fetch(`${sessionServiceUrl}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      throw new Error(`SessionService error: ${res.status}`);
    }

    return res.json();
  }

  function storeSessionTicket(ticket) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ticket));
  }

  function loadSessionTicket() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function attachTicketToRequest(init = {}) {
    const ticket = loadSessionTicket();
    if (!ticket) return init;

    const headers = new Headers(init.headers || {});
    headers.set("X-JavaSpectre-SessionTicket", ticket.ticket_id || "");
    headers.set("X-JavaSpectre-VNode", ticket.vnode_id || "");
    return { ...init, headers };
  }

  async function init(sessionServiceUrl, requestedAbilities = ["repo:read"]) {
    let ticket = loadSessionTicket();
    if (ticket) {
      return ticket;
    }

    const vnodeProfile = await buildVNodeProfile();
    const res = await requestSessionTicket(sessionServiceUrl, vnodeProfile, requestedAbilities);

    ticket = res.session_ticket;
    storeSessionTicket(ticket);
    return ticket;
  }

  return {
    init,
    buildVNodeProfile,
    loadSessionTicket,
    attachTicketToRequest
  };
})();

// Example usage in a browser:
// (async () => {
//   const ticket = await JavaspectreVNodeShim.init("https://session-service.javaspectre.org", ["repo:read","repo:write"]);
//   console.log("JavaSpectre SessionTicket:", ticket);
// })();
