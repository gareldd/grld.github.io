import { IDLE, MOTION, PORTRAIT } from '../config/site.ts';

export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const smoothstep = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };
export const damp = (current: number, target: number, deltaMs: number) =>
  current + (target - current) * (1 - Math.exp(-Math.max(0, deltaMs) / MOTION.responseMs));

export const shouldHoldGaze = (pointerPresent: boolean, absentForMs: number) =>
  pointerPresent || absentForMs < MOTION.pointerIdleMs;

// Reserve space for head pitch and the extended greeting arm, including near-side depth.
export function portraitDistance(aspect: number, elapsedMs: number, reducedMotion = false) {
  const settle = reducedMotion ? 1 : smoothstep((elapsedMs - MOTION.greetingEndMs) / PORTRAIT.settleMs);
  const width = PORTRAIT.greetingHorizontalSpan + (PORTRAIT.horizontalSpan - PORTRAIT.greetingHorizontalSpan) * settle;
  const height = Math.max(PORTRAIT.verticalSpan, width / Math.max(0.1, aspect));
  return height / (2 * Math.tan(PORTRAIT.fov * Math.PI / 360)) + PORTRAIT.depthMargin;
}

// Independent breathing/weight shift layer; deliberately owns no head yaw/pitch.
export function idlePose(elapsedMs: number, reducedMotion = false) {
  const time = Math.max(0, elapsedMs - MOTION.greetingEndMs);
  const blend = reducedMotion ? 0 : smoothstep(time / IDLE.blendMs);
  if (blend === 0) return { lean: 0, roll: 0, chestScale: 1, leftArmX: 0, rightArmX: 0, leftArmZ: 0, rightArmZ: 0 };
  const breath = Math.sin(time / IDLE.breathPeriodMs * Math.PI * 2);
  const sway = Math.sin(time / IDLE.swayPeriodMs * Math.PI * 2);
  const arms = Math.sin(time / IDLE.armPeriodMs * Math.PI * 2);
  return {
    lean: breath * 0.018 * blend,
    roll: sway * 0.018 * blend,
    chestScale: 1 + breath * 0.006 * blend,
    leftArmX: (0.025 + arms * 0.035) * blend,
    rightArmX: (0.02 - arms * 0.03) * blend,
    leftArmZ: (0.045 + breath * 0.012) * blend,
    rightArmZ: -(0.045 - breath * 0.012) * blend,
  };
}

// Elapsed time starts at the first frame rendered with the actual skin.
export function timeline(elapsedMs: number, reducedMotion = false) {
  if (reducedMotion) return { phase: 'follow', opacity: 1, scale: 1, offset: 0, armX: 0, armY: 0, armZ: 0, greetingWeight: 0, headRoll: 0, bodyRoll: 0, lift: 0 } as const;
  const entrance = 1 - Math.pow(1 - clamp(elapsedMs / MOTION.entranceMs), 3);
  const waveMs = elapsedMs - MOTION.entranceMs;
  const waveDuration = MOTION.greetingEndMs - MOTION.entranceMs;
  const envelope = waveMs >= 0 && elapsedMs < MOTION.greetingEndMs
    ? smoothstep(waveMs / MOTION.armRaiseMs) * smoothstep((waveDuration - waveMs) / MOTION.armReturnMs)
    : 0;
  const waveProgress = clamp((waveMs - MOTION.armRaiseMs) / (waveDuration - MOTION.armRaiseMs - MOTION.armReturnMs));
  const beat = Math.sin(waveProgress * Math.PI * 2 * MOTION.waveBeats);
  return {
    phase: elapsedMs < MOTION.entranceMs ? 'entrance' : elapsedMs < MOTION.greetingEndMs ? 'wave' : 'follow',
    opacity: entrance, scale: 0.96 + entrance * 0.04, offset: (1 - entrance) * 12,
    // Two distinct hand waves; the torso only leans once and returns.
    // Keep the wave in the shoulder plane; never swing behind the head.
    armX: 0,
    armY: 0,
    armZ: envelope === 0 ? 0 : (-2.92 + beat * 0.22) * envelope,
    greetingWeight: envelope,
    headRoll: 0.055 * envelope,
    bodyRoll: envelope === 0 ? 0 : -0.025 * envelope,
    lift: 0,
  } as const;
}
