// js/wallet.js
// Supports ALL EVM wallets (MetaMask, Trust Wallet, Bitget, OKX, Binance,
// Coinbase, Rabby, etc.) via WalletConnect v2 EthereumProvider.
// Injected wallets (desktop extensions / in-wallet mobile browsers) connect
// directly; everything else gets the WalletConnect QR / deep-link modal.

const SIGN_MESSAGE =
  "I am joining the 404 Punks Lab whitelist.\nNo transaction.\nNo gas fee.\nNo token approval.";

// Multiple CDNs as fallback — mobile browsers sometimes fail to load
// from unpkg, so we try jsdelivr first (more reliable globally), then unpkg.
const WC_CDN_URLS = [
  "https://cdn.jsdelivr.net/npm/@walletconnect/ethereum-provider@2.13.3/dist/index.umd.js",
  "https://unpkg.com/@walletconnect/ethereum-provider@2.13.3/dist/index.umd.js",
];

window.__walletAddress   = null;
window.__walletSignature = null;

async function connectWallet() {
  const btn = document.getElementById("connectWalletBtn");
  if (btn) { btn.textContent = "Connecting..."; btn.disabled = true; }

  try {
    if (!window.__appConfigLoaded) {
      if (!window.__appConfigPromise) throw new Error("App config not ready. Please refresh.");
      await window.__appConfigPromise;
    }

    // Detect a real injected wallet (desktop extension, or mobile in-wallet browser
    // like MetaMask/Trust/Bitget/OKX/Coinbase/Binance apps that inject window.ethereum)
    if (window.ethereum) {
      await connectInjected();
    } else {
      // No injected wallet (e.g. mobile Chrome/Safari) → WalletConnect modal
      // lists MetaMask, Trust Wallet, Bitget, OKX, Binance, Coinbase, etc.
      await connectViaWC();
    }
  } catch (err) {
    console.error("Wallet connect error:", err);
    showMsg("Wallet: " + (err.message || "Connection failed."), "error");
    if (btn) { btn.innerHTML = "🦊 Connect Wallet"; btn.disabled = false; }
  }
}

async function connectInjected() {
  // Some mobile wallet browsers inject multiple providers — pick the first usable one
  const eth = window.ethereum?.providers?.length
    ? window.ethereum.providers[0]
    : window.ethereum;

  const accounts = await eth.request({ method: "eth_requestAccounts" });
  if (!accounts || !accounts.length) throw new Error("No accounts returned.");
  const addr = accounts[0].toLowerCase();
  const sig  = await eth.request({ method: "personal_sign", params: [SIGN_MESSAGE, addr] });
  onConnected(addr, sig);
}

async function connectViaWC() {
  const projectId = window.__appConfig?.walletConnectProjectId;
  if (!projectId) throw new Error("WalletConnect project ID missing. Check environment variables.");

  await ensureWcLibraryLoaded();

  const ns = window.EthereumProvider || window.WalletConnectEthereumProvider;
  if (!ns) throw new Error("WalletConnect library failed to load. Check your internet connection and try again.");

  // UMD bundle may expose init() at top level OR nested under .EthereumProvider
  const initFn = typeof ns.init === "function" ? ns.init : ns.EthereumProvider?.init;
  if (typeof initFn !== "function") throw new Error("WalletConnect library loaded but is incompatible.");

  const provider = await initFn({
    projectId,
    chains:         [1],
    showQrModal:    true,
    qrModalOptions: { themeMode: "dark" },
    methods:        ["personal_sign", "eth_sign", "eth_accounts"],
    events:         ["accountsChanged", "chainChanged"],
  });

  await provider.connect();

  const accounts = provider.accounts;
  if (!accounts || !accounts.length) throw new Error("No accounts returned from WalletConnect.");

  const addr = accounts[0].toLowerCase();
  const sig  = await provider.request({ method: "personal_sign", params: [SIGN_MESSAGE, addr] });
  onConnected(addr, sig);
}

async function ensureWcLibraryLoaded() {
  if (window.EthereumProvider || window.WalletConnectEthereumProvider) return;

  let lastErr = null;
  for (const url of WC_CDN_URLS) {
    try {
      await loadScript(url);
      if (window.EthereumProvider || window.WalletConnectEthereumProvider) return;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("WalletConnect library failed to load from all sources.");
}

function onConnected(addr, sig) {
  window.__walletAddress   = addr;
  window.__walletSignature = sig;

  const btn  = document.getElementById("connectWalletBtn");
  const info = document.getElementById("walletInfo");
  const adEl = document.getElementById("walletAddr");

  if (adEl)  adEl.textContent  = addr.slice(0,8) + "..." + addr.slice(-6);
  if (info)  info.style.display = "block";
  if (btn) {
    btn.textContent       = "✅ Wallet Connected";
    btn.disabled          = true;
    btn.style.color       = "var(--win-green)";
    btn.style.borderColor = "var(--win-green)";
  }

  if (typeof window.markTaskDone === "function") window.markTaskDone(5);
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    // Avoid loading the same script twice
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s   = document.createElement("script");
    s.src     = src;
    s.async   = true;
    s.onload  = () => resolve();
    s.onerror = () => reject(new Error("Failed to load: " + src));
    document.head.appendChild(s);
  });
}

function showMsg(msg, type) {
  const el = document.getElementById("statusMsg");
  if (!el) return;
  el.innerHTML = `<div class="win-alert ${type}"><span class="win-alert-icon">${type==="error"?"⚠":"ℹ"}</span><span>${msg}</span></div>`;
}

window.connectWallet = connectWallet;
