import { useEffect, useRef, useState } from 'react';
import { SkinViewer } from 'skinview3d';
import { DirectionalLight, Group, Mesh } from 'three';
import { MINECRAFT_MODEL, MINECRAFT_USERNAME, MOTION, PORTRAIT } from '../config/site';
import { clamp, damp, idlePose, portraitDistance, shouldHoldGaze, timeline } from '../lib/animationTimeline';
import { loadMinecraftSkin } from '../lib/minecraftSkin';

type Status = 'loading' | 'ready' | 'skin-error' | 'webgl-error';

export default function MinecraftCharacter() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const retryRef = useRef<() => void>(() => {});
  const [status, setStatus] = useState<Status>('loading');
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    let viewer: SkinViewer;
    setStatus('loading');
    canvas.style.opacity = '0';
    try {
      viewer = new SkinViewer({
        canvas, width: stage.clientWidth, height: stage.clientHeight,
        pixelRatio: Math.min(window.devicePixelRatio || 1, MOTION.maxDpr),
        enableControls: false, renderPaused: true, fov: PORTRAIT.fov,
      });
    } catch {
      setStatus('webgl-error');
      retryRef.current = () => setGeneration(value => value + 1);
      return;
    }
    viewer.autoRotate = false;
    viewer.playerObject.rotation.y = MOTION.stanceYaw;
    viewer.globalLight.intensity = 1.6;
    viewer.cameraLight.intensity = 0.15;
    const studioLight = (color: number, intensity: number, x: number, y: number, z: number) => {
      const light = new DirectionalLight(color, intensity);
      light.position.set(x, y, z);
      light.target.position.set(0, PORTRAIT.targetY, 0);
      viewer.scene.add(light, light.target);
    };
    studioLight(0xffffff, 2.0, -24, 32, 28);
    studioLight(0xf0f4ff, 0.55, 20, 12, 20);
    studioLight(0xe1eaff, 1.6, 16, 24, -18);
    viewer.camera.position.y = PORTRAIT.targetY;
    viewer.camera.lookAt(0, PORTRAIT.targetY, 0);

    // A hip joint groups the upper body while both legs remain planted.
    const skin = viewer.playerObject.skin;
    // Rotate around the middle of the shoulder face, rather than its corner.
    // Keep the model's own pivots intact: skin loading updates their slim offsets.
    for (const [arm, side] of [[skin.rightArm, 1], [skin.leftArm, -1]] as const) {
      const shoulderOffset = new Group();
      const shoulderCenterOffset = MINECRAFT_MODEL === 'slim' ? 0.5 : 1;
      shoulderOffset.position.set(side * shoulderCenterOffset, -2, 0);
      for (const child of [...arm.children]) shoulderOffset.add(child);
      arm.add(shoulderOffset);
      arm.position.x -= side * shoulderCenterOffset;
      arm.position.y += 2;
    }
    // Character's right is screen-left when facing the camera.
    skin.rightArm.position.x -= 0.35;
    skin.rightArm.position.y -= 0.3;
    const rightShoulderX = skin.rightArm.position.x;
    const upperBody = new Group();
    upperBody.position.y = -12;
    skin.add(upperBody);
    skin.updateWorldMatrix(true, true);
    for (const part of [skin.head, skin.body, skin.leftArm, skin.rightArm]) upperBody.attach(part);
    const rightShoulderY = skin.rightArm.position.y;

    let disposed = false;
    let loaded = false;
    let loading = false;
    let inView = true;
    let contextLost = false;
    let raf = 0;
    let characterReadyAt: number | null = null;
    let lastFrameAt = 0;
    let pausedAt: number | null = null;
    let pausedMs = 0;
    let targetX = 0;
    let targetY = 0;
    let pointerPresent = false;
    let pointerAbsentAt = -Infinity;
    let followX = 0;
    let followY = 0;
    const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
    const mouseAvailable = matchMedia('(any-hover: hover) and (any-pointer: fine)');
    const canRender = () => loaded && !disposed && !contextLost && !document.hidden && inView;

    const resize = () => {
      if (disposed) return;
      viewer.setSize(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight));
      viewer.pixelRatio = Math.min(window.devicePixelRatio || 1, MOTION.maxDpr);
    };
    const tick = (now: number) => {
      raf = 0;
      if (!canRender()) return;
      const delta = lastFrameAt ? Math.min(now - lastFrameAt, 100) : 0;
      lastFrameAt = now;
      const elapsed = characterReadyAt === null ? 0 : now - characterReadyAt - pausedMs;
      const reduced = motionPreference.matches;
      const pose = timeline(elapsed, reduced);
      const idle = idlePose(elapsed, reduced);
      canvas.style.opacity = String(pose.opacity);
      canvas.style.transform = `translateY(${pose.offset}px) scale(${pose.scale})`;
      canvas.dataset.phase = pose.phase;
      skin.rightArm.rotation.set(pose.armX + idle.rightArmX, pose.armY, pose.armZ + idle.rightArmZ);
      // Allow for the sleeve width as the arm turns upright: its inner face
      // meets the side of the head rather than passing through/behind it.
      skin.rightArm.position.x = rightShoulderX - 0.10 * pose.greetingWeight;
      skin.rightArm.position.y = rightShoulderY - 0.35 * pose.greetingWeight;
      skin.leftArm.rotation.set(idle.leftArmX, 0, idle.leftArmZ);
      viewer.playerObject.position.y = pose.lift;

      const tracking = pose.phase === 'follow' && !reduced && mouseAvailable.matches;
      const activePointer = tracking && shouldHoldGaze(pointerPresent, now - pointerAbsentAt);
      followX = damp(followX, activePointer ? targetX : 0, delta);
      followY = damp(followY, activePointer ? targetY : 0, delta);
      skin.head.rotation.y = tracking ? followX * MOTION.headYaw : 0.10 * pose.greetingWeight;
      // Positive screen Y points down; positive X rotation looks down from the front.
      skin.head.rotation.x = tracking ? followY * MOTION.headPitch : -0.06 * pose.greetingWeight;
      skin.head.rotation.z = pose.headRoll;
      upperBody.rotation.y = tracking ? followX * MOTION.torsoYaw : 0.04 * pose.greetingWeight;
      upperBody.rotation.x = idle.lean + 0.03 * pose.greetingWeight;
      upperBody.rotation.z = idle.roll + pose.bodyRoll;
      skin.body.scale.y = idle.chestScale;
      viewer.camera.position.x = tracking ? followX * MOTION.cameraParallax : 0;
      viewer.camera.position.z = portraitDistance(viewer.camera.aspect, elapsed, reduced);
      viewer.camera.position.y = PORTRAIT.targetY + (tracking ? -followY * MOTION.cameraParallax * 0.45 : 0);
      viewer.camera.lookAt(0, PORTRAIT.targetY, 0);
      try {
        viewer.render();
      } catch {
        contextLost = true;
        setStatus('webgl-error');
        return;
      }
      if (characterReadyAt === null) {
        characterReadyAt = now;
        setStatus('ready');
      }
      raf = requestAnimationFrame(tick);
    };
    const syncLoop = () => {
      const now = performance.now();
      if (canRender()) {
        if (pausedAt !== null && characterReadyAt !== null) pausedMs += now - pausedAt;
        pausedAt = null;
        if (!raf) { lastFrameAt = now; raf = requestAnimationFrame(tick); }
      } else {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        if (pausedAt === null && characterReadyAt !== null) pausedAt = now;
      }
    };
    const load = async () => {
      if (disposed || loading) return;
      loading = true;
      setStatus('loading');
      try {
        const image = await loadMinecraftSkin();
        if (disposed) return;
        viewer.loadSkin(image, { model: MINECRAFT_MODEL });
        skin.setOuterLayerVisible(true);
        loaded = true;
        syncLoop();
      } catch {
        if (!disposed) setStatus('skin-error');
      } finally { loading = false; }
    };
    retryRef.current = () => {
      if (contextLost) setGeneration(value => value + 1);
      else void load();
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || !mouseAvailable.matches) return;
      targetX = clamp(event.clientX / innerWidth * 2 - 1, -1, 1);
      targetY = clamp(event.clientY / innerHeight * 2 - 1, -1, 1);
      pointerPresent = true;
    };
    const leave = () => {
      if (!pointerPresent) return;
      pointerPresent = false;
      pointerAbsentAt = performance.now();
    };
    const loseContext = () => { contextLost = true; syncLoop(); setStatus('webgl-error'); };
    const restoreContext = () => { contextLost = false; setStatus(loaded ? 'ready' : 'loading'); syncLoop(); };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
    const intersectionObserver = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; syncLoop(); });
    intersectionObserver.observe(stage);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('blur', leave);
    document.documentElement.addEventListener('pointerleave', leave);
    document.documentElement.addEventListener('pointerenter', move, { passive: true });
    document.addEventListener('visibilitychange', syncLoop);
    canvas.addEventListener('webglcontextlost', loseContext);
    canvas.addEventListener('webglcontextrestored', restoreContext);
    resize();
    void load();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('blur', leave);
      document.documentElement.removeEventListener('pointerleave', leave);
      document.documentElement.removeEventListener('pointerenter', move);
      document.removeEventListener('visibilitychange', syncLoop);
      canvas.removeEventListener('webglcontextlost', loseContext);
      canvas.removeEventListener('webglcontextrestored', restoreContext);
      viewer.dispose();
      // The library disposes textures/renderer; also release mesh/composer resources.
      viewer.scene.traverse(object => {
        if (object instanceof Mesh) {
          object.geometry.dispose();
          for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose();
        }
      });
      viewer.composer.dispose();
    };
  }, [generation]);

  return (
    <div className="character-wrap">
      <div ref={stageRef} className="character-stage" aria-busy={status === 'loading'}>
        <div className="character-halo" aria-hidden="true" />
        <canvas ref={canvasRef} className="character-canvas" role="img" aria-label={`3D-персонаж Minecraft ${MINECRAFT_USERNAME}`} />
        {status !== 'ready' && <div className="character-status" role="status" aria-live="polite">
          {status === 'loading' ? <><span className="loading-dot" />Загружаю персонажа…</> : <>
            <p>{status === 'skin-error' ? 'Не удалось загрузить скин.' : '3D недоступно. Проверь поддержку WebGL в браузере.'}</p>
            <button type="button" onClick={() => retryRef.current()}>Попробовать снова</button>
          </>}
        </div>}
      </div>
    </div>
  );
}
