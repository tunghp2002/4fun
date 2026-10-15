import { ExperienceScope } from './lifetime';

type BootWindow = Window & {
  mesqStarted?: number;
  mesqBoot?: number;
  mesqCreep?: () => number;
};

function showSimple(failed = false) {
  const root = document.documentElement;
  root.classList.remove('gated', 'no-boot'); root.classList.add('no-3d');
  const plain = document.getElementById('no3d');
  const loader = document.getElementById('loader');
  if (loader) loader.hidden = true;
  if (!plain) return;
  plain.hidden = false; plain.inert = false;
  if (failed) {
    const introduction = plain.querySelector('.no3d__hi');
    if (introduction) introduction.textContent = "The 3D world couldn't continue in this browser. My projects and contacts are still here.";
  }
  for (const child of document.body.children) if (child instanceof HTMLElement && child !== plain) child.inert = true;
  plain.focus({ preventScroll: true });
}

function prepare(scope: ExperienceScope) {
  const root = document.documentElement;
  const savedClass = root.className, savedStyle = root.style.cssText;
  const savedRestoration = history.scrollRestoration;
  const savedInert = [...document.body.children].filter((child): child is HTMLElement => child instanceof HTMLElement).map(child => [child, child.inert] as const);
  const windowState = window as BootWindow;
  scope.defer(() => {
    root.className = savedClass; root.style.cssText = savedStyle;
    history.scrollRestoration = savedRestoration;
    for (const [child, inert] of savedInert) if (child.isConnected) child.inert = inert;
    delete windowState.mesqBoot; delete windowState.mesqStarted; delete windowState.mesqCreep;
  });
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  root.classList.toggle('frame', matchMedia('(pointer: coarse)').matches);
  root.classList.remove('no-boot', 'no-3d', 'gated');
  windowState.mesqStarted = performance.now();
  const skies: Record<string, [string, string, number]> = {
    about: ['#225fec', '#83bef5', .11], projects: ['#2a55df', '#abaadf', .22],
    contacts: ['#191185', '#45138c', 1], end: ['#191185', '#45138c', 1],
  };
  const section = location.hash.startsWith('#mq-') ? 'projects' : location.hash.slice(1);
  const sky = skies[section];
  if (sky) {
    root.style.setProperty('--page', sky[0]); root.style.setProperty('--page-low', sky[1]); root.style.setProperty('--page-night', String(sky[2]));
  }
  const loader = document.getElementById('loader');
  const step = loader?.querySelector('.loader__step');
  const start = performance.now();
  windowState.mesqCreep = () => .06 + .29 * (1 - Math.exp(-(performance.now() - start) / 3500));
  const labels = ['mixing the ink', 'unrolling the paper', 'sorting the stickers'];
  const creep = () => {
    if (!loader || !step || windowState.mesqBoot !== undefined) return;
    loader.style.setProperty('--load', windowState.mesqCreep!().toFixed(3));
    step.textContent = labels[Math.floor((performance.now() - start) / 1700) % labels.length];
    scope.timeout(creep, 250);
  };
  creep();
  scope.listen(window, 'mesq-render-failed', () => showSimple(true));
  for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-view]')) {
    const update = () => {
      const url = new URL(location.href);
      if (link.dataset.view === 'simple') url.searchParams.set('view', 'simple'); else url.searchParams.delete('view');
      link.href = url.pathname + url.search + url.hash;
    };
    update(); scope.listen(link, 'pointerdown', update); scope.listen(link, 'focus', update);
  }
}

let session: { scope: ExperienceScope; mounts: number; ready: Promise<void> } | undefined;
let previousStop = Promise.resolve();

/** A shared mount survives React's development setup/cleanup/setup cycle. */
export function mountExperience() {
  if (!session || session.scope.signal.aborted) {
    const scope = new ExperienceScope();
    const ready = (async () => {
      await previousStop;
      scope.check();
      prepare(scope);
      if (new URLSearchParams(location.search).get('view') === 'simple') { showSimple(); return; }
      const { startScene } = await import('./scene/main.js');
      scope.check(); await startScene(scope);
    })().catch(error => {
      if (!scope.signal.aborted) { console.error('[mesq] startup failed', error); showSimple(true); }
    });
    session = { scope, mounts: 0, ready };
  }
  const current = session; current.mounts++;
  return () => {
    current.mounts--;
    queueMicrotask(() => {
      if (current.mounts !== 0) return;
      const disposal = current.scope.dispose();
      previousStop = Promise.all([current.ready, disposal]).then(() => current.scope.dispose());
      void previousStop.finally(() => { if (session === current && current.mounts === 0) session = undefined; });
    });
  };
}
