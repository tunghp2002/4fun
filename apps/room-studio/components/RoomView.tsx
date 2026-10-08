"use client";
import { useEffect, useRef, useState } from "react";
import type { createWorld } from "../lib/world";
import { webglSupport, is3DEnabled, remember3DEnabled } from "../lib/webgl";
import { type Plan } from "../lib/model";
import { type Selection } from "./PlanEditor";
type Props = {
  plan: Plan;
  selection: Selection;
  select: (s: Selection) => void;
  begin: () => void;
  preview: (p: Plan) => void;
  finish: () => void;
  report: (m: string) => void;
};
type Status = "checking" | "available" | "unsupported" | "unavailable" | "starting" | "ready" | "failed" | "lost";
export default function RoomView(props: Props) {
  const host = useRef<HTMLDivElement>(null),
    world = useRef<ReturnType<typeof createWorld> | null>(null),
    latest = useRef(props), attempt = useRef(0);
  latest.current = props;
  const [full, setFull] = useState(false),
    [status, setStatus] = useState<Status>("checking"),
    [overview, setOverview] = useState(false);
  useEffect(() => {
    const element = host.current!;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(e => e.isIntersecting)) return;
      observer.disconnect();
      setStatus(webglSupport());
    });
    const lost = (event: Event) => {
      event.preventDefault();
      attempt.current++;
      const current = world.current; world.current = null;
      current?.dispose();
      setStatus("lost");
    };
    observer.observe(element);
    element.addEventListener("webglcontextlost", lost, true);
    return () => {
      attempt.current++;
      observer.disconnect();
      element.removeEventListener("webglcontextlost", lost, true);
      world.current?.dispose();
      world.current = null;
    };
  }, []);
  useEffect(() => {
    world.current?.update(props.plan, props.selection);
  }, [props.plan, props.selection.room, props.selection.item]);
  useEffect(() => {
    if (status === "available" && is3DEnabled()) void enable();
  }, [status]);
  async function enable() {
    if (world.current || status === "starting") return;
    const request = ++attempt.current;
    setStatus("starting");
    try {
      const {createWorld} = await import("../lib/world");
      if (request !== attempt.current || !host.current) return;
      const w = createWorld(host.current, {
        select: s => latest.current.select(s), begin: () => latest.current.begin(),
        preview: p => latest.current.preview(p), finish: () => latest.current.finish(),
        report: m => latest.current.report(m),
      });
      world.current = w;
      w.update(latest.current.plan, latest.current.selection);
      if (overview) w.setOverview(true);
      if (full) w.setWalls(true);
      remember3DEnabled();
      setStatus("ready");
    } catch {
      if (request !== attempt.current) return;
      world.current?.dispose(); world.current = null;
      setStatus("failed");
    }
  }
  const ready = status === "ready", unavailable = status === "unsupported" || status === "unavailable",
    retry = status === "failed" || status === "lost";
  return (
    <section className="workspace space-workspace" aria-label="3D interior">
      <div className="view-heading">
        <div>
          <span className="eyebrow">02 / EXPLORE</span>
          <h2>Your space <span>3D</span></h2>
        </div>
        <div className="view-modes">
          <button className="wall-toggle" disabled={!ready} aria-pressed={overview} onClick={() => {setOverview(!overview);world.current?.setOverview(!overview);}}>{overview ? "Whole house" : "This floor"}</button>
          <button className="wall-toggle" disabled={!ready} aria-pressed={full} onClick={() => {setFull(!full);world.current?.setWalls(!full);}}>{full ? "Full walls" : "Cutaway"} <span>⌑</span></button>
        </div>
      </div>
      <div className="space-canvas">
        <div className="render-host" ref={host} />
        {!ready && <div className="space-gate" role={unavailable || retry ? "alert" : "status"}>
          <svg viewBox="0 0 64 64" width="52" height="52" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><path d="M32 5 56 18v28L32 59 8 46V18L32 5Zm0 26v28M8 18l24 13 24-13M20 12l24 13v14"/></svg>
          <span className="eyebrow">A DIFFERENT PERSPECTIVE</span>
          <h3>{unavailable ? "3D is unavailable here" : status === "lost" ? "3D was interrupted" : retry ? "3D could not start" : "See your home in 3D"}</h3>
          <p>{status === "unsupported" ? "This browser or device does not support the graphics needed for 3D. Your floor plan is ready to use in 2D." : unavailable || retry ? "Graphics access is unavailable or blocked. Check your browser’s graphics acceleration setting, or try another browser. Your floor plan stays available in 2D." : "Explore your layout, explore materials and follow the evening light."}</p>
          {unavailable ? <button className="enable-3d" onClick={() => setStatus(webglSupport())}>Check again</button> : <button className="enable-3d" disabled={status === "checking" || status === "starting"} onClick={enable}>{status === "checking" ? "Checking 3D…" : status === "starting" ? "Starting 3D…" : retry ? "Try again" : "Enable 3D"}<span aria-hidden="true"> ↗</span></button>}
        </div>}
        {ready && <>
          <div className={`space-caption${props.plan.hour >= 19 ? " is-evening" : ""}`}><span className="eyebrow">A DIFFERENT PERSPECTIVE</span><p>{overview ? "Home, from every angle." : "Step inside your home."}</p></div>
          <div className="canvas-controls">
            <button onClick={() => world.current?.top()}>Top</button>
            <button onClick={() => world.current?.fit(props.selection.room)}>Room</button>
            <button onClick={() => world.current?.fit()}>Fit</button>
          </div>
        </>}
      </div>
      <div className="view-footer"><span>{ready ? "Drag to orbit · scroll to zoom · drag a piece to move" : "Your 2D plan is always available"}</span><span>{ready ? "Live view" : unavailable ? "3D unavailable" : "3D on demand"}</span></div>
    </section>
  );
}
