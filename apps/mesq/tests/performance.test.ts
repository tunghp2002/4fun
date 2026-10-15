import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ExperienceScope } from '../lib/mesq/lifetime.ts';
import { createPerformanceModule } from '../lib/mesq/scene/performance.ts';

const scrollSettings = { min: 220, max: 340, maxTouch: 940, perStop: 700, perStopTouch: 2000 };

test('quality adapts after sustained slow frames, with the original warmup and cooldown', () => {
  const saved = Object.getOwnPropertyDescriptor(globalThis, 'devicePixelRatio');
  Object.defineProperty(globalThis, 'devicePixelRatio', { value: 2, configurable: true });
  try {
    const renderSettings = { bloomScale: 0, msaa: 0 };
    const engine = createPerformanceModule(new ExperienceScope(), { renderingModule: { renderSettings }, scrollInputModule: { scrollSettings } });
    const pauses: number[] = [];
    const pacer = { tuning: { minDpr: 0, maxDpr: 0, idleFps: 0 }, paced: false, lift() {}, pause(seconds: number) { pauses.push(seconds); } };
    const lighting = { tuning: { shadowMapSize: 0 } };
    const controller = engine.createQualityController({ clientWidth: 1440, clientHeight: 1000 }, pacer, lighting);
    assert.equal(renderSettings.bloomScale, .5);
    assert.equal(pacer.tuning.maxDpr, 2);
    for (let i = 0; i < 250; i++) controller.frame(.04, true);
    assert.equal(renderSettings.bloomScale, .5);
    for (let i = 0; i < 100; i++) controller.frame(.04, true);
    assert.equal(renderSettings.bloomScale, .3);
    assert.equal(lighting.tuning.shadowMapSize, 512);
    assert.equal(pacer.tuning.idleFps, 30);
    for (let i = 0; i < 350; i++) controller.frame(.04, true);
    assert.equal(renderSettings.bloomScale, .3);
    for (let i = 0; i < 100; i++) controller.frame(.04, true);
    assert.equal(renderSettings.bloomScale, .15);
    assert.equal(renderSettings.msaa, 0);
    assert.equal(lighting.tuning.shadowMapSize, 256);
    assert.deepEqual(pauses, [2, 2, 2]);
    assert(engine.dprForTier('full', 2, 7680, 4320) < 1);
  } finally {
    if (saved) Object.defineProperty(globalThis, 'devicePixelRatio', saved);
    else Reflect.deleteProperty(globalThis, 'devicePixelRatio');
  }
});

test('scroll timing keeps mouse/touch limits and detects approaching the original stops', () => {
  const engine = createPerformanceModule(new ExperienceScope(), { renderingModule: { renderSettings: { bloomScale: .5, msaa: 4 } }, scrollInputModule: { scrollSettings } });
  assert.equal(engine.scrollDuration(0, 1000, false), 220);
  assert.equal(engine.scrollDuration(1000, 1000, false), 340);
  assert.equal(engine.scrollDuration(-1000, 1000, true), 940);
  assert.equal(engine.reachedScrollTarget(101, 110, 100, false), true);
  assert.equal(engine.reachedScrollTarget(110, 120, 100, false), true);
  assert.equal(engine.reachedScrollTarget(120, 110, 100, false), false);
  assert.equal(engine.reachedScrollTarget(120, 110, 100, true), true);
});
