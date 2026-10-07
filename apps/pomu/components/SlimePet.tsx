'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { DEFAULT_SETTINGS, type PetSettings, type Palette } from '../lib/slime/behavior';
import type { SlimeWorld } from '../lib/slime/world';

function Icon({ name }: { name: 'hand' | 'sword' | 'mochi' | 'palette' | 'close' | 'help' | 'sound' }) {
  if (name === 'mochi') return <svg className="mochi-icon" viewBox="0 0 24 24" fill="none" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
    <path className="mochi-shell" d="M3 16C3 9 6.8 5.5 12 5.5S21 9 21 16c0 3-4.3 4.5-9 4.5S3 19 3 16Z" />
    <path className="mochi-fold" d="M9 6.5 10 9m2-3v3m3-2.5L14 9" />
    <path className="mochi-shine" d="M6.5 13c.3-1.8 1-3 2-3.5" />
  </svg>;
  if (name === 'hand') return <svg className="paw-icon" viewBox="0 0 24 24" fill="none" strokeWidth="1.35" strokeLinejoin="round" aria-hidden="true">
    <path className="paw-shell" d="M5 21c-3.1-.5-2.4-4-1.1-6.2C1.2 12.9 1.3 8.7 3.7 8.2c1.1-.3 2 .6 2.5 1.9-1.3-3.4-.1-6.3 1.9-6.2 1.7.1 2.2 2.2 2.5 4.7 0-3.5 1.7-5.7 3.8-4.9 1.6.6 1.7 3 1.2 5.8 1.1-2.4 3-3.2 4.5-1.8 1.9 1.8.8 5.1-1 6.8 1.6 2.9 2.1 6.1-1 6.9-3.4 1.7-9.5 1.4-13.1-.4Z" />
    <g className="paw-pads">
      <ellipse cx="4.5" cy="11.5" rx="1.2" ry="1.8" transform="rotate(-22 4.5 11.5)" />
      <ellipse cx="8.1" cy="7.6" rx="1.15" ry="1.8" transform="rotate(-12 8.1 7.6)" />
      <ellipse cx="13.2" cy="7.3" rx="1.15" ry="1.8" transform="rotate(14 13.2 7.3)" />
      <ellipse cx="18" cy="10.7" rx="1.2" ry="1.8" transform="rotate(25 18 10.7)" />
      <path d="M7.1 18.4c-1.3-1.1.3-2.8 1.3-3.8 1.6-1.9 4.5-1.9 6 0 1.4 1.3 2.6 3.2 1 4.3-1.1.8-2.9 0-4.1.1-1.4.1-3.1.3-4.2-.6Z" />
    </g>
  </svg>;
  const paths = {
    sword: 'm14 4 6-1-1 6-8 8-4-4 7-9ZM5 12l7 7M8 17l-4 4-2-2 4-4',
    palette: 'M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-3.7 1.6 1.6 0 0 1 1-2.8h2a4 4 0 0 0 4-4C21 6 17 3 12 3ZM7 10h.01M10 6.5h.01M15 7h.01M17.5 10.5h.01',
    close: 'm6 6 12 12M6 18 18 6',
    help: 'M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 4M12 18h.01',
    sound: 'M11 5 6 9H3v6h3l5 4V5Z',
  };
  return <svg className={`${name}-icon`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} />{name === 'sound' && <><path className="sound-waves" d="M15 8c3 2 3 6 0 8M18 5c5 4 5 10 0 14" /><path className="sound-muted" d="m16 9 5 6m0-6-5 6" /></>}</svg>;
}

export default function SlimePet() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const engine = useRef<SlimeWorld | null>(null);
  const settingsRef = useRef<PetSettings>(DEFAULT_SETTINGS);
  const [settings, setSettings] = useState<PetSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(4);
  const [error, setError] = useState(false);
  const [count, setCount] = useState(1);
  const [message, setMessage] = useState('');
  const [customize, setCustomize] = useState(false);
  const [help, setHelp] = useState(false);
  const paletteButton = useRef<HTMLButtonElement>(null);
  const helpButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let cancelled = false;
    let finishTimer: number | undefined;
    const progressTimer = window.setInterval(() => setProgress(value => value < 85 ? Math.min(85, value + Math.max(1, (85 - value) * .12)) : value), 120);
    import('../lib/slime/world').then(({ createSlimeWorld }) => {
      if (cancelled || !canvas.current) return;
      setProgress(value => Math.max(value, 90));
      engine.current = createSlimeWorld(canvas.current, settingsRef.current, {
        onCount: setCount, onMessage: setMessage, onTool: (tool) => setSettings((previous) => ({ ...previous, tool })),
        onReady: () => {
          if (cancelled) return;
          window.clearInterval(progressTimer); setProgress(100);
          finishTimer = window.setTimeout(() => { if (!cancelled) setReady(true); }, 260);
        },
      });
    }).catch((cause) => {
      window.clearInterval(progressTimer);
      if (!cancelled) { console.error(cause); setError(true); }
    });
    return () => { cancelled = true; window.clearInterval(progressTimer); window.clearTimeout(finishTimer); engine.current?.dispose(); engine.current = null; };
  }, []);

  useEffect(() => {
    settingsRef.current = settings;
    engine.current?.configure(settings);
  }, [settings]);

  useEffect(() => {
    if (!customize && !help) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setCustomize(false); setHelp(false); (customize ? paletteButton : helpButton).current?.focus(); }
    };
    const outside = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || event.target.closest('.pet-dock, .settings-popover, .help-popover, .help-button')) return;
      setCustomize(false); setHelp(false);
    };
    window.addEventListener('keydown', key);
    window.addEventListener('pointerdown', outside);
    return () => { window.removeEventListener('keydown', key); window.removeEventListener('pointerdown', outside); };
  }, [customize, help]);

  useEffect(() => {
    const element = cursor.current;
    if (!element || !matchMedia('(pointer: fine)').matches) return;
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      element.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      element.dataset.visible = 'true';
      element.dataset.ui = String(event.target instanceof Element && !!event.target.closest('button, input, label, a'));
    };
    const down = () => { element.dataset.down = 'true'; };
    const up = () => { element.dataset.down = 'false'; };
    const leave = () => { element.dataset.visible = 'false'; up(); };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    window.addEventListener('blur', leave);
    document.addEventListener('pointerleave', leave);
    return () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up); window.removeEventListener('blur', leave);
      document.removeEventListener('pointerleave', leave);
    };
  }, []);

  const update = (change: Partial<PetSettings>) => setSettings((previous) => ({ ...previous, ...change }));
  const choose = (palette: Palette) => update({ palette });

  const flavors: { palette: Palette; name: string; label: string; className: string }[] = [
    { palette: 'blue', name: 'Blue', label: 'Rimuru blue', className: 'blue-orb' },
    { palette: 'galaxy', name: 'Galaxy', label: 'Galaxy purple', className: 'galaxy-orb' },
    { palette: 'rainbow', name: 'Rainbow', label: 'Rainbow', className: 'rainbow-orb' },
  ];

  return <main className="pet-app relative min-h-dvh overflow-hidden" data-tool={settings.tool}>
    <header className="brand absolute z-20 flex items-center gap-3">
      <span className="brand-slime" aria-hidden="true"><i /><i /></span>
      <h1 className="wordmark">pomu</h1>
      <button ref={helpButton} className="help-button" aria-label="How to play" aria-expanded={help} aria-controls="pet-help" title="How to play" onClick={() => { setHelp(!help); setCustomize(false); }}><Icon name="help" /></button>
    </header>
    <div className="top-actions absolute z-20 flex items-center gap-2">
      <button className="sound-toggle paper-surface" aria-label="Toggle sound" aria-pressed={settings.sound} title={settings.sound ? 'Mute sound' : 'Unmute sound'} onClick={() => update({ sound: !settings.sound })}><Icon name="sound" /></button>
    </div>
    <canvas ref={canvas} className="world-canvas absolute inset-0 h-full w-full" aria-label="Your little slime companion. Stroke to pet, click to squish, or double-tap for a spinning jump. Hold still to cuddle; drag to stretch, lift or slide. Right-click to tease. Press Space to jump or E to wiggle. Choose Mochi, pull the slingshot pouch and release to feed; press Enter to aim at the smallest slime. Mochi helps small slimes grow to their maximum size. Bring the sword close to make them nervous, with teary eyes and a slow retreat. Click or drag a slash to split them where you aim." tabIndex={0} />
    {!ready && !error && <div className="loading-state" role="progressbar" aria-label="Loading Pomu" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} style={{ '--load-progress': `${progress}%` } as CSSProperties}>
      <div className="loading-journey" aria-hidden="true"><span className="loading-runner"><span className="loading-slime"><i /><i /></span><span className="loading-shadow" /></span><span className="loading-track"><span /></span></div>
      <span className="loading-percent" aria-hidden="true">{Math.round(progress)}%</span>
    </div>}
    {error && <div className="error-state" role="alert"><span>Pomu could not load.</span><p>Enable hardware acceleration and try again.</p><button onClick={() => location.reload()}>Try again</button></div>}
    {help && <div id="pet-help" className="help-popover absolute z-30" role="dialog" aria-label="How to play">
      <div className="popover-heading"><h2>Play with Pomu</h2><button aria-label="Close help" onClick={() => setHelp(false)}><Icon name="close" /></button></div>
      <p>Stroke back and forth for happy eyes. Click to squish, double-tap for a spinning jump, or right-click to tease.</p>
      <p>Hold still for a cuddle: your slime relaxes and gets sleepy. Drag to stretch or lift, or swipe near the ground to slide. Shaking makes them dizzy, and they need a moment to recover after you let go. Pinch with two fingers or scroll to squish and stretch.</p>
      <p>Choose Mochi to use the slingshot. Pull the pouch opposite your target and release; longer pulls give stronger shots. The dotted line previews the flight. Release near the starting point or press Escape to cancel. Slimes chase the treats, take a bite and grow until they reach their maximum size.</p>
      <p>A nearby sword makes slimes slowly retreat with teary eyes. Hold to aim and they will stay still; click where you want to cut or drag a slash. An off-center cut creates a large and a small slime. Click the ground and each slime chooses to walk, hop or roll. Leave them alone for 12 seconds and they will reunite.</p>
      <p className="keyboard-hint">Click the ground to move · Space to jump · E to wiggle · S/H/M for sword/pet/mochi · Enter to poke or shoot a treat at the smallest slime · R to reset.</p>
    </div>}
    <div className="bottom-ui absolute z-20">
      {customize && <div id="pet-colors" className="settings-popover" role="dialog" aria-label="Custom slime colors">
        <div className="popover-heading"><h2>Slime colors</h2><button aria-label="Close colors" onClick={() => { setCustomize(false); paletteButton.current?.focus(); }}><Icon name="close" /></button></div>
        <div className="custom-colors flex items-center justify-between gap-4">
          <label className="color-input"><input type="color" aria-label="Slime color" value={settings.color} onChange={(event) => update({ color: event.target.value, palette: 'custom' })} /><span>Main color</span><small>{settings.color}</small></label>
          <label className="gradient-toggle"><input type="checkbox" checked={settings.gradient} onChange={(event) => update({ gradient: event.target.checked, palette: 'custom' })} /><span className="switch" />Gradient</label>
          {settings.gradient && <label className="color-input"><input type="color" aria-label="Gradient color" value={settings.secondColor} onChange={(event) => update({ secondColor: event.target.value, palette: 'custom' })} /><span>Second color</span><small>{settings.secondColor}</small></label>}
        </div>
      </div>}
      <div className="pet-dock paper-surface flex items-center" role="toolbar" aria-label="Slime tools and colors">
        <div className="dock-tools flex items-center" role="group" aria-label="Slime tools">
          <button className="dock-tool" aria-label="Pet and drag" aria-pressed={settings.tool === 'hand'} onClick={() => update({ tool: 'hand' })}><Icon name="hand" /><span>Pet</span></button>
          <button className="dock-tool" aria-label="Slime sword" aria-pressed={settings.tool === 'sword'} onClick={() => update({ tool: 'sword' })}><Icon name="sword" /><span>Sword</span></button>
          <button className="dock-tool" aria-label="Throw mochi" title="Pull the pouch and release to shoot mochi" aria-pressed={settings.tool === 'mochi'} onClick={() => update({ tool: 'mochi' })}><Icon name="mochi" /><span>Mochi</span></button>
        </div>
        <span className="dock-divider" aria-hidden="true" />
        <div className="dock-colors" role="group" aria-label="Slime colors">
          {flavors.map(flavor => <button key={flavor.palette} className="flavor-button" aria-label={flavor.label} aria-pressed={settings.palette === flavor.palette} title={flavor.name} onClick={() => choose(flavor.palette)}><span className={`color-orb ${flavor.className}`} /><span>{flavor.name}</span></button>)}
        </div>
        <button ref={paletteButton} className="dock-custom" aria-label="Custom colors" title="Custom colors" aria-expanded={customize} aria-controls="pet-colors" data-active={customize || settings.palette === 'custom'} onClick={() => { setCustomize(!customize); setHelp(false); }}><Icon name="palette" /></button>
      </div>
    </div>
    <div className="sr-only" role="status" aria-live="polite">{message}</div>
    <div ref={cursor} className="animated-cursor" data-tool={settings.tool} aria-hidden="true"><span className="cursor-spark">✦</span><span className="cursor-image"><Icon name={settings.tool === 'mochi' ? 'hand' : settings.tool} /></span></div>
  </main>;
}
