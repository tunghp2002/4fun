// Adapted from mesq — https://mesq.me/. Attribution: ../../../CREDITS.md.
import type { ExperienceScope } from '../lifetime';

type Tier = 'full' | 'balanced' | 'low';
interface ScrollTiming {
  min: number;
  max: number;
  maxTouch: number;
  perStop: number;
  perStopTouch: number;
}
interface Pacer {
  tuning: { maxDpr: number; minDpr: number; idleFps: number };
  paced: boolean;
  lift(): void;
  pause(seconds: number): void;
}

const quality = {
  full: { maxDpr: 2, pixels: 8_300_000, msaa: 4, bloom: .5, shadow: 1024, idleFps: 60 },
  balanced: { maxDpr: 1.5, pixels: 4_200_000, msaa: 4, bloom: .3, shadow: 512, idleFps: 30 },
  low: { maxDpr: 1, pixels: 2_100_000, msaa: 0, bloom: .15, shadow: 256, idleFps: 30 },
};

export function createPerformanceModule(scope: ExperienceScope, {
  renderingModule, scrollInputModule,
}: {
  renderingModule: { renderSettings: { bloomScale: number; msaa: number } };
  scrollInputModule: { scrollSettings: ScrollTiming };
}) {
  const { renderSettings } = renderingModule;
  const { scrollSettings } = scrollInputModule;

  function dprForTier(tier: Tier, dpr: number, width: number, height: number) {
    const limits = quality[tier];
    return Math.min(dpr || 1, limits.maxDpr, Math.sqrt(limits.pixels / Math.max(1, width * height)));
  }

  function createQualityController(canvas: Pick<HTMLElement, 'clientWidth' | 'clientHeight'>, pacer: Pacer, lighting: { tuning: { shadowMapSize: number } }) {
    let tier: Tier = 'full';
    let slowSeconds = 0;
    let cooldown = 8;
    let appliedTier: Tier | null = null;
    let previousDpr = devicePixelRatio;

    function refresh() {
      const limits = quality[tier];
      pacer.tuning.maxDpr = dprForTier(tier, devicePixelRatio, canvas.clientWidth, canvas.clientHeight);
      pacer.tuning.minDpr = Math.min(1, pacer.tuning.maxDpr);
      pacer.tuning.idleFps = limits.idleFps;
      if (devicePixelRatio > previousDpr + 1e-6) pacer.lift();
      previousDpr = devicePixelRatio;
      if (tier !== appliedTier) {
        appliedTier = tier;
        renderSettings.bloomScale = limits.bloom;
        renderSettings.msaa = limits.msaa;
        lighting.tuning.shadowMapSize = limits.shadow;
        pacer.pause(2);
      }
    }

    refresh();
    return {
      refresh,
      frame(delta: number, active: boolean) {
        if (!active || pacer.paced || delta <= 0 || delta > .25) {
          slowSeconds = 0;
          return;
        }
        if (cooldown > 0) {
          cooldown -= delta;
          return;
        }
        slowSeconds = delta > 1 / 48 ? slowSeconds + delta : Math.max(0, slowSeconds - delta * 2);
        if (slowSeconds > 5 && tier !== 'low') {
          tier = tier === 'full' ? 'balanced' : 'low';
          slowSeconds = 0;
          cooldown = 12;
          refresh();
        }
      },
    };
  }

  function reachedScrollTarget(current: number, previous: number, target: number, immediate: boolean) {
    return immediate || Math.abs(current - target) < 2 ||
      ((current - target) * (previous - target) > 0 && Math.abs(previous - target) > Math.abs(current - target));
  }

  function scrollDuration(distance: number, stopHeight: number, touch: boolean, timing = scrollSettings) {
    const progress = Math.min(1, Math.abs(distance) / Math.max(1, stopHeight));
    return Math.min(touch ? timing.maxTouch : timing.max, timing.min + progress * (touch ? timing.perStopTouch : timing.perStop));
  }

  return { dprForTier, createQualityController, reachedScrollTarget, scrollDuration };
}
