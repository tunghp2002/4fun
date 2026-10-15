type ListenerTarget = Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;
type Cleanup = () => void | Promise<void>;

/** Own only the scene's resources; leave React and Next's browser listeners alone. */
export class ExperienceScope {
  private readonly controller = new AbortController();
  readonly signal = this.controller.signal;
  readonly whenAborted: Promise<void>;
  private readonly listeners: Cleanup[] = [];
  private readonly cleanups: Cleanup[] = [];
  private readonly timeouts = new Set<number>();
  private readonly intervals = new Set<number>();
  private readonly frames = new Set<number>();
  private readonly idleTasks = new Map<number, () => void>();
  private readonly observers = new Set<ResizeObserver>();
  private readonly elements = new Set<Element>();
  private disposal?: Promise<void>;

  constructor() {
    this.whenAborted = new Promise(resolve => this.signal.addEventListener('abort', () => resolve(), { once: true }));
  }

  check() {
    if (this.signal.aborted) throw new DOMException('Scene stopped', 'AbortError');
  }

  listen(target: ListenerTarget | null | undefined, type: string, listener: EventListenerOrEventListenerObject, options?: AddEventListenerOptions | boolean) {
    if (!target || this.signal.aborted) return;
    target.addEventListener(type, listener, options);
    this.listeners.push(() => target.removeEventListener(type, listener, options));
  }

  timeout(callback: (...args: unknown[]) => void, delay?: number, ...args: unknown[]) {
    if (this.signal.aborted) return -1;
    const id = window.setTimeout(() => {
      this.timeouts.delete(id);
      if (!this.signal.aborted) callback.apply(window, args);
    }, delay);
    this.timeouts.add(id); return id;
  }

  clearTimeout(id: number) { window.clearTimeout(id); this.timeouts.delete(id); }

  interval(callback: (...args: unknown[]) => void, delay?: number, ...args: unknown[]) {
    if (this.signal.aborted) return -1;
    const id = window.setInterval(() => { if (!this.signal.aborted) callback.apply(window, args); }, delay);
    this.intervals.add(id); return id;
  }

  clearInterval(id: number) { window.clearInterval(id); this.intervals.delete(id); }

  frame(callback: FrameRequestCallback) {
    if (this.signal.aborted) return -1;
    const id = window.requestAnimationFrame(time => {
      this.frames.delete(id);
      if (!this.signal.aborted) callback(time);
    });
    this.frames.add(id); return id;
  }

  cancelFrame(id: number) { window.cancelAnimationFrame(id); this.frames.delete(id); }

  idle(callback: IdleRequestCallback, options?: IdleRequestOptions) {
    if (this.signal.aborted) return -1;
    let id: number;
    const run: IdleRequestCallback = deadline => {
      this.idleTasks.delete(id);
      if (!this.signal.aborted) callback(deadline);
    };
    if (typeof window.requestIdleCallback === 'function') {
      id = window.requestIdleCallback(run, options);
      this.idleTasks.set(id, () => window.cancelIdleCallback(id));
    } else {
      id = window.setTimeout(() => run({ didTimeout: false, timeRemaining: () => 10 }), 1);
      this.idleTasks.set(id, () => window.clearTimeout(id));
    }
    return id;
  }

  cancelIdle(id: number) { this.idleTasks.get(id)?.(); this.idleTasks.delete(id); }

  resizeObserver(callback: ResizeObserverCallback) {
    this.check();
    const observer = new ResizeObserver((entries, current) => { if (!this.signal.aborted) callback(entries, current); });
    this.observers.add(observer); return observer;
  }

  element<K extends keyof HTMLElementTagNameMap>(tag: K, options?: ElementCreationOptions): HTMLElementTagNameMap[K] {
    this.check();
    const element = document.createElement(tag, options);
    this.elements.add(element); return element;
  }

  elementNS(namespace: string | null, tag: string, options?: ElementCreationOptions) {
    this.check();
    const element = document.createElementNS(namespace, tag, options);
    this.elements.add(element); return element;
  }

  defer(cleanup: Cleanup) {
    if (this.signal.aborted) {
      this.disposal = (this.disposal ?? Promise.resolve()).then(cleanup).catch(error => console.error('Scene cleanup failed', error));
    }
    else this.cleanups.push(cleanup);
  }

  dispose(): Promise<void> {
    if (this.disposal) return this.disposal;
    this.controller.abort();
    this.listeners.splice(0).forEach(remove => { void remove(); });
    this.timeouts.forEach(id => window.clearTimeout(id)); this.timeouts.clear();
    this.intervals.forEach(id => window.clearInterval(id)); this.intervals.clear();
    this.frames.forEach(id => window.cancelAnimationFrame(id)); this.frames.clear();
    this.idleTasks.forEach(cancel => cancel()); this.idleTasks.clear();
    this.observers.forEach(observer => observer.disconnect()); this.observers.clear();
    this.disposal = (async () => {
      for (const cleanup of this.cleanups.splice(0).reverse()) {
        try { await cleanup(); } catch (error) { console.error('Scene cleanup failed', error); }
      }
      this.elements.forEach(element => element.remove()); this.elements.clear();
    })();
    return this.disposal;
  }
}
