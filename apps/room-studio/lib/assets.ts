import { validatePlan, type Plan } from "./model";
export const MAX_MODEL_BYTES = 8 * 1024 * 1024;
type GLBDocument = {
  asset?: { version?: string };
  buffers?: { uri?: string }[];
  images?: { uri?: string }[];
  nodes?: unknown[];
  meshes?: { primitives: { indices?: number; mode?: number; attributes: { POSITION?: number } }[] }[];
  accessors?: { count: number }[];
  animations?: unknown[];
  skins?: unknown[];
  materials?: unknown[];
  extensionsRequired?: string[];
};
export function inspectGLB(data: ArrayBuffer): GLBDocument {
  if (data.byteLength < 20 || data.byteLength > MAX_MODEL_BYTES)
    throw Error("Choose a GLB file up to 8 MB.");
  const view = new DataView(data);
  if (view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2 || view.getUint32(8, true) !== data.byteLength)
    throw Error("This file is not a valid GLB 2.0 model.");
  const size = view.getUint32(12, true);
  if (view.getUint32(16, true) !== 0x4e4f534a || size < 2 || size % 4 || size > data.byteLength - 20)
    throw Error("The GLB file has an invalid header.");
  const doc = JSON.parse(new TextDecoder().decode(new Uint8Array(data, 20, size))) as GLBDocument;
  if (!doc || doc.asset?.version !== "2.0" || !Array.isArray(doc.meshes) || !doc.meshes.length || !Array.isArray(doc.accessors))
    throw Error("Choose a GLB 2.0 file containing furniture geometry.");
  if ([...(doc.buffers ?? []), ...(doc.images ?? [])].some((r) => r.uri !== undefined))
    throw Error("Choose a self-contained GLB with embedded textures and geometry.");
  if (doc.animations?.length || doc.skins?.length)
    throw Error("Choose static furniture; animated and skinned models are not supported.");
  if ((doc.nodes?.length ?? 0) > 256 || doc.meshes.length > 64 || (doc.materials?.length ?? 0) > 32)
    throw Error("This model is too heavy. Use up to 64 meshes and 32 materials.");
  if (doc.extensionsRequired?.includes("KHR_texture_basisu"))
    throw Error("This model uses unsupported compressed textures. Export a GLB with PNG or JPEG textures.");
  let triangles = 0;
  for (const mesh of doc.meshes)
    for (const p of mesh.primitives) {
      const count = doc.accessors[p.indices ?? p.attributes.POSITION ?? -1]?.count;
      if ((p.mode ?? 4) !== 4 || !Number.isInteger(count) || count < 3)
        throw Error("Choose a GLB with valid triangle meshes.");
      triangles += count / 3;
    }
  if (triangles > 60000) throw Error("This model is too heavy. Keep it within 60,000 triangles.");
  return doc;
}
export async function modelId(data: ArrayBuffer) {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", data)), (b) => b.toString(16).padStart(2, "0")).join("");
}
async function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("room-studio-models", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("files");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(Error("Model storage is unavailable. Allow browser storage and try again."));
    request.onblocked = () => reject(Error("Close other Room Studio tabs and try again."));
  });
}
export async function saveModelFiles(files: { id: string; data: ArrayBuffer }[]) {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("files", "readwrite");
      for (const f of files) tx.objectStore("files").put(f.data, f.id);
      tx.oncomplete = () => resolve();
      tx.onerror = tx.onabort = () => reject(Error("Model could not be saved. Browser storage may be full."));
    });
  } finally { db.close(); }
  window.dispatchEvent(new CustomEvent("room-studio-model-files", { detail: files.map((f) => f.id) }));
}
export async function readModelFile(id: string): Promise<ArrayBuffer> {
  const db = await database();
  try {
    return await new Promise<ArrayBuffer>((resolve, reject) => {
      const r = db.transaction("files", "readonly").objectStore("files").get(id);
      r.onsuccess = () => r.result instanceof ArrayBuffer ? resolve(r.result) : reject(Error("An imported model is missing. Import its GLB again or restore a complete backup."));
      r.onerror = () => reject(Error("Model could not be read from browser storage."));
    });
  } finally { db.close(); }
}
function base64(data: ArrayBuffer) {
  const bytes = new Uint8Array(data), parts: string[] = [];
  for (let i = 0; i < bytes.length; i += 32768) parts.push(String.fromCharCode(...bytes.subarray(i, i + 32768)));
  return btoa(parts.join(""));
}
export async function exportBackup(plan: Plan) {
  // ponytail: bounded JSON backups embed up to 24 MB of GLBs; use a streaming archive if larger libraries are needed.
  const files: Record<string, string> = {};
  for (const a of plan.assets ?? []) files[a.id] = base64(await readModelFile(a.id));
  return JSON.stringify({ ...plan, ...(plan.assets?.length ? { modelFiles: files } : {}) });
}
export async function importBackup(value: unknown) {
  const plan = validatePlan(value), packed = (value as { modelFiles?: Record<string, unknown> }).modelFiles;
  const files: { id: string; data: ArrayBuffer }[] = [];
  for (const a of plan.assets ?? []) {
    const text = packed?.[a.id];
    if (typeof text !== "string" || text.length !== Math.ceil(a.bytes / 3) * 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(text))
      throw Error("This backup is missing a model file. Export a complete backup from the original device.");
    const data = Uint8Array.from(atob(text), (c) => c.charCodeAt(0)).buffer;
    inspectGLB(data);
    if (data.byteLength !== a.bytes || await modelId(data) !== a.id) throw Error("This backup contains a damaged model file.");
    const { decodeModel } = await import("./imported-model");
    const loaded = await decodeModel(data);
    try { if (loaded.triangles !== a.triangles) throw Error("The model geometry does not match its saved metadata."); }
    finally { loaded.dispose(); }
    files.push({ id: a.id, data });
  }
  if (files.length) await saveModelFiles(files);
  return plan;
}
export async function fetchModel(url: string): Promise<ArrayBuffer> {
  const target = new URL(url);
  if (!["https:", "http:"].includes(target.protocol) || target.username || target.password)
    throw Error("Use a direct HTTP or HTTPS link to a GLB file.");
  const response = await fetch(target, { signal: AbortSignal.timeout(20000), credentials: "omit" });
  if (!response.ok) throw Error("The model link could not be downloaded. Use a direct GLB link or choose a file.");
  const reader = response.body?.getReader();
  if (!reader) throw Error("The model link returned no file.");
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const next = await reader.read(); if (next.done) break;
      size += next.value.byteLength;
      if (size > MAX_MODEL_BYTES) throw Error("Choose a GLB file up to 8 MB.");
      chunks.push(next.value);
    }
  } finally { await reader.cancel(); }
  const data = new Uint8Array(size); let offset = 0;
  for (const c of chunks) { data.set(c, offset); offset += c.length; }
  inspectGLB(data.buffer);
  return data.buffer;
}
