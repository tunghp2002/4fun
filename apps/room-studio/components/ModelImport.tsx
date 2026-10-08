"use client";
import { useRef, useState } from "react";
import { fetchModel, MAX_MODEL_BYTES, modelId } from "../lib/assets";
import type { ModelAsset } from "../lib/model";
type Props = { add: (asset: ModelAsset, data: ArrayBuffer) => Promise<void> };
export default function ModelImport({ add }: Props) {
  const file = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(""), [busy, setBusy] = useState(false),
    [error, setError] = useState(""), [pending, setPending] = useState<{ asset: ModelAsset; data: ArrayBuffer } | null>(null);
  async function read(source: File | string) {
    setBusy(true); setError(""); setPending(null);
    try {
      if (source instanceof File && source.size > MAX_MODEL_BYTES) throw Error("Choose a GLB file up to 8 MB.");
      const data = source instanceof File ? await source.arrayBuffer() : await fetchModel(source);
      const { decodeModel } = await import("../lib/imported-model");
      const loaded = await decodeModel(data);
      try {
        const name = source instanceof File ? source.name.replace(/\.glb$/i, "") : new URL(source).pathname.split("/").at(-1)?.replace(/\.glb$/i, "") || "Imported model";
        setPending({ data, asset: { id: await modelId(data), name: name.slice(0, 40), w: loaded.w, d: loaded.d, h: loaded.h, triangles: loaded.triangles, bytes: data.byteLength } });
      } finally { loaded.dispose(); }
    } catch (e) {
      setError(e instanceof TypeError ? (source instanceof File ? "This model could not be read. Choose a valid, self-contained GLB file." : "The link could not be downloaded. Use a direct GLB link that allows access, or choose a file.") : (e as Error).message);
    } finally { setBusy(false); }
  }
  async function submit() {
    if (!pending) return;
    setBusy(true); setError("");
    try { await add(pending.asset, pending.data); setPending(null); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  return (
    <details className="model-import">
      <summary>Import 3D model <span>GLB</span></summary>
      <p className="field-note">Choose a model, check its size, then add it to the selected room.</p>
      <input hidden ref={file} type="file" accept=".glb,model/gltf-binary" aria-label="Choose GLB model" onChange={(e) => { const f = e.target.files?.[0]; if (f) void read(f); e.target.value = ""; }} />
      <button className="model-file-button" disabled={busy} onClick={() => file.current?.click()}>{busy ? "Reading model…" : "Choose .glb file"}</button>
      <div className="model-link">
        <input aria-label="Direct GLB link" type="url" placeholder="https://…/model.glb" value={url} disabled={busy} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && url.trim() && !busy) void read(url.trim()); }} />
        <button disabled={busy || !url.trim()} onClick={() => void read(url.trim())}>Load</button>
      </div>
      {pending && <div className="model-dimensions">
        <label className="field">Model name<input aria-label="Model name" maxLength={40} value={pending.asset.name} onChange={(e) => setPending({ ...pending, asset: { ...pending.asset, name: e.target.value } })} /></label>
        <div className="model-size-fields">{(["w", "d", "h"] as const).map((key) => <label key={key} className="field">{key === "w" ? "Width" : key === "d" ? "Depth" : "Height"}<input type="number" aria-label={`Model ${key === "w" ? "width" : key === "d" ? "depth" : "height"}`} min={key === "h" ? .05 : .2} max={4} step=".01" value={pending.asset[key]} onChange={(e) => setPending({ ...pending, asset: { ...pending.asset, [key]: Number(e.target.value) } })} /></label>)}</div>
        <p className="field-note">Metres · {pending.asset.triangles.toLocaleString()} triangles · {(pending.asset.bytes / 1024 / 1024).toFixed(2)} MB</p>
        <button className="primary-button model-file-button" disabled={busy} onClick={() => void submit()}>Add model to room</button>
      </div>}
      {error && <p className="model-error" role="alert">{error}</p>}
      <p className="field-note">Static, self-contained GLB · up to 8 MB. Website pages are not model links.</p>
    </details>
  );
}
