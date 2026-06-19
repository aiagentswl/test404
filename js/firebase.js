// js/firebase.js
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore }           from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth }                from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

window.__appConfig        = null;
window.__appConfigLoaded  = false;

window.__appConfigPromise = fetch("/api/config")
  .then(r => { if (!r.ok) throw new Error("Config fetch failed: " + r.status); return r.json(); })
  .then(cfg => {
    if (cfg.error) throw new Error(cfg.error);
    window.__appConfig       = cfg;
    window.__appConfigLoaded = true;

    if (!getApps().length) {
      const app  = initializeApp(cfg.firebase);
      window.__firebaseDB   = getFirestore(app);
      window.__firebaseAuth = getAuth(app);
    } else {
      const app = getApps()[0];
      window.__firebaseDB   = getFirestore(app);
      window.__firebaseAuth = getAuth(app);
    }

    document.dispatchEvent(new CustomEvent("firebase-ready"));
    return cfg;
  })
  .catch(err => {
    console.error("Firebase init error:", err);
    document.dispatchEvent(new CustomEvent("firebase-error", { detail: err.message }));
    throw err;
  });
