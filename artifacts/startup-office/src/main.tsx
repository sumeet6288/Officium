import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Suppress harmless THREE.js deprecation warnings from R3F internals
const _warn = console.warn.bind(console)
console.warn = (...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : ''
  if (msg.includes('THREE.Clock') || msg.includes('PCFSoftShadowMap')) return
  _warn(...args)
}

createRoot(document.getElementById("root")!).render(<App />);
