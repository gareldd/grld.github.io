import { test } from 'node:test';
import assert from 'node:assert/strict';
import { damp, idlePose, portraitDistance, shouldHoldGaze, timeline } from '../src/lib/animationTimeline.ts';
import { PORTRAIT } from '../src/config/site.ts';

test('portrait reserves headroom and greeting arm room at desktop and mobile aspect ratios', () => {
  for (const aspect of [1.8, 1.3, 0.9, 0.7]) {
    const greeting = portraitDistance(aspect, 1000);
    const idle = portraitDistance(aspect, 4000);
    const halfHeight = (greeting - PORTRAIT.depthMargin) * Math.tan(PORTRAIT.fov * Math.PI / 360);
    assert.ok(halfHeight * 2 * aspect >= PORTRAIT.greetingHorizontalSpan - 1e-8);
    assert.ok(PORTRAIT.targetY + halfHeight >= 19);
    assert.ok(idle <= greeting);
    assert.ok(Math.abs(portraitDistance(aspect, 2001) - portraitDistance(aspect, 2000)) < 0.001);
  }
});

test('gaze holds while stationary and for ten seconds after the pointer leaves', () => {
  assert.equal(shouldHoldGaze(true, 60000), true);
  assert.equal(shouldHoldGaze(false, 9999), true);
  assert.equal(shouldHoldGaze(false, 10000), false);
  assert.equal(shouldHoldGaze(false, Infinity), false);
});

test('idle blends in after the greeting, owns no head rotation and respects reduced motion', () => {
  const rest = idlePose(2000);
  assert.equal(rest.leftArmX, 0);
  assert.equal(rest.chestScale, 1);
  const moving = idlePose(4500);
  assert.ok(Math.abs(moving.leftArmX) > 0.001);
  assert.ok(!('headYaw' in moving) && !('headPitch' in moving));
  assert.ok(Math.abs(moving.roll) <= 0.018);
  const reduced = idlePose(4500, true);
  assert.equal(reduced.leftArmX, 0);
  assert.equal(reduced.lean, 0);
  assert.equal(reduced.chestScale, 1);
});

test('entrance, one wave, arm return and pointer follow are exclusive', () => {
  assert.equal(timeline(0).opacity, 0);
  assert.equal(timeline(499).phase, 'entrance');
  assert.equal(timeline(499).armZ, 0);
  assert.equal(timeline(500).opacity, 1);
  assert.equal(timeline(500).phase, 'wave');
  assert.ok(timeline(1000).armZ < -2.2);
  assert.ok(Math.abs(timeline(1999).armZ) < 0.001);
  for (const time of [2000, 5000, 60000]) {
    assert.equal(timeline(time).phase, 'follow');
    assert.equal(timeline(time).armZ, 0);
    assert.equal(timeline(time).armX, 0);
    assert.equal(timeline(time).armY, 0);
    assert.equal(timeline(time).headRoll, 0);
    assert.equal(timeline(time).bodyRoll, 0);
    assert.equal(timeline(time).lift, 0);
  }
});

test('damping behaves equally across frame rates and cannot overshoot', () => {
  let sixty = 0; let thirty = 0;
  for (let i = 0; i < 60; i++) sixty = damp(sixty, 1, 1000 / 60);
  for (let i = 0; i < 30; i++) thirty = damp(thirty, 1, 1000 / 30);
  assert.ok(Math.abs(sixty - thirty) < 1e-10);
  assert.ok(sixty > 0.99 && sixty < 1);
  assert.equal(damp(1, -1, 0), 1);
});

test('reduced motion reveals promptly without waving', () => {
  const pose = timeline(0, true);
  assert.equal(pose.opacity, 1);
  assert.equal(pose.armZ, 0);
  assert.equal(pose.phase, 'follow');
});
