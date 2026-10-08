export function webglSupport(): "available" | "unsupported" | "unavailable" {
  if (typeof window === "undefined" || !window.WebGL2RenderingContext) return "unsupported";
  try {
    const gl = document.createElement("canvas").getContext("webgl2", {antialias: true, alpha: false, powerPreference: "high-performance"});
    if (!gl || gl.isContextLost()) return "unavailable";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return "available";
  } catch { return "unavailable"; }
}


const ENABLED_KEY = "room-studio:3d:v1";
export function is3DEnabled(): boolean {
  try { return window.localStorage.getItem(ENABLED_KEY) === "enabled"; }
  catch { return false; }
}
export function remember3DEnabled() {
  try { window.localStorage.setItem(ENABLED_KEY, "enabled"); }
  catch { /* Remembering the preference is optional when storage is blocked. */ }
}
