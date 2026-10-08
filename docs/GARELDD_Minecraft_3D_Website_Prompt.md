# GARELDD — Interactive Minecraft Skin Landing Page

> **Implementation prompt for an AI website builder / coding agent**  
> Adapted from the supplied MotionSites `neon-logic` / SynapseX prompt.  
> **Build the actual, functioning website, not a visual mockup or an implementation plan.**

## 0. Primary goal — read this first

Create a premium, cinematic, single-page website for **GARELDD**, built around a **real, fully animated, interactive 3D Minecraft Java skin**. This is a personal Minecraft-themed landing page, **not** a SynapseX / neural-AI product website.

The Minecraft username is **`gareldd`**. The character uses the **Slim / Alex geometry** (3-pixel-wide arms). **Never substitute Steve's wide-arm geometry.**

**The skin texture must be fetched from the current online Minecraft profile at runtime**, rather than committed as a permanent PNG asset or recreated by generative AI. If `gareldd` changes their Minecraft skin, visitors should see the newer skin on a later visit/refresh once the external data source updates. Treat any intermediary API cache delays honestly.

The character must perform this exact, once-per-page-visit sequence:

| Relative time from character readiness | Required behavior |
| --- | --- |
| **0.0–0.5 seconds** | Smoothly fade and slightly scale/translate in from invisible to fully visible. |
| **0.5–2.0 seconds** | Friendly, natural **one-handed wave**; subtle accompanying idle motion. |
| **2.0 seconds onward** | Return arm to rest and continuously **follow the visitor's mouse cursor with the head/upper body and a very subtle camera parallax**. |

The movements must flow together naturally without snapping, looping the greeting, or beginning cursor-tracking early. The model stays visible after the greeting.

**Important interpretation:** The original reference hero scrubs a pre-rendered video with mouse movement. **Replace that behavior with genuine 3D geometry, bone/joint animation and interactive camera response.** It must react to the cursor in real time from multiple directions, not scrub video frames or swap flat images.

## 1. Stack

Use:

- React + TypeScript + Vite.
- Tailwind CSS for layout and styling.
- Framer Motion / Motion for UI transitions and text animation, following the original reference's feel.
- **`skinview3d`** for the Minecraft player, powered by Three.js. Prefer the library's public APIs and avoid reinventing the skin mesh and UV mapping.
- `lucide-react` only when icons are truly needed.
- Google Fonts: **Space Mono** as the primary font and **Anton SC** only for the large low-opacity background wordmark.
- No authentication, database, route system or unnecessary CMS.

Install and import compatible current packages; do not assume an unpublished package version. Build with TypeScript strict mode enabled and make sure the project compiles and runs.

Reference library: https://github.com/bs-community/skinview3d

## 2. Dynamic Minecraft skin loading — mandatory

### Required identifier

```ts
const MINECRAFT_USERNAME = "gareldd";
const MINECRAFT_MODEL = "slim" as const;
const FALLBACK_SKIN_ENDPOINT = `https://mc-heads.net/skin/${MINECRAFT_USERNAME}`;
```

### Basic implementation that also works on static hosting

- On each fresh page visit, resolve/load the skin from the Minecraft username using a functioning skin API; a practical initial source is **`https://mc-heads.net/skin/gareldd`**.
- The response must be used as the **actual texture** on the 3D player, not an avatar image overlaid on a mannequin.
- MCHeads supports CORS and the full raw skin endpoint, but it caches skins: **do not claim changes appear immediately**. It currently documents approximately **24-hour skin caching** on its servers. Browser/CDN caching may contribute further delay.
- Use `skinViewer.loadSkin(skinUrl, { model: "slim" })` or the equivalent **public API for the installed library version**. Force Slim even if the helper endpoint provides no geometry metadata. Do not infer arm width from a plain 64×64 PNG.
- Preserve the correct UV orientation, pixel-perfect nearest-neighbor texture sampling, transparency and second/outer skin layers (hat, jacket, sleeves, pants).
- Preserve the skin's original colors. Do not invent costume parts, face details or cosmetic accessories.
- **Never** hardcode a one-time texture file or use the skin belonging to a different user for normal rendering.
- On each load, use ordinary HTTP caching rather than adding an ever-changing timestamp every animation frame.
- If the player loads successfully, retain that texture while the UI is active. Do not refetch on mouse movement.

### Optional, more reliable freshness route

If the target deployment supports serverless functions, create an optional **same-origin skin resolver** that resolves the username to the actual Mojang player UUID, reads the current authenticated profile's public texture reference, and returns/redirects to the skin texture or safely proxies it. Respect upstream API limits, input validation and caching (suggested moderate server-side TTL: 15–60 minutes). The texture URL itself should be refreshed when the profile texture changes. **Do not silently assume that browser-side requests to the official Mojang endpoints will work across origins**; handle CORS explicitly.

For a **static-only deployment** (such as GitHub Pages), do not implement a fake `/api` route that cannot run. Use the working public CORS-compatible endpoint and document the caching limitation.

### Error handling

- Show a tasteful, small loading state/skeleton while the skin and renderer become ready.
- Begin the animation sequence **after both the actual skin texture and the first valid rendered frame are ready**, so a slow connection does not skip the wave.
- If loading fails, retain the last successfully loaded texture during that session if available; otherwise present a discreet error with a **Retry** action. An optional temporary generic silhouette must clearly be a loading/error fallback, **never** a claimed representation of `gareldd`.
- Never let a broken texture URL leave an empty, unusable page or a crashing renderer.
- A small **Refresh skin** control may be included if visually appropriate; it reloads the texture but must not spam third-party APIs or promise to bypass upstream caches.

## 3. 3D player rendering and composition

- Use a **single, persistent** SkinViewer instance mounted into a React-managed canvas and disposed correctly on unmount. Avoid creating a new renderer on every render or animation frame.
- Render the complete **full-body player**; head, arms, torso and legs must all remain visible. Avoid cutting off the feet or top of the head at typical desktop viewport sizes.
- Character starts facing slightly toward the viewer, with a friendly front/three-quarter stance (subtle angle, not back-facing).
- Character is visually large and unmistakably the focal point, ideally in the central to center-right area of the hero. Layout must remain balanced with hero text.
- Give the character enough breathing room to rotate naturally without clipping into the navbar or text.
- Use a transparent WebGL background above the dark site background.
- Use very subtle, consistent studio-style lighting that does not wash out the original Minecraft colors. Preserve blocky geometry and crisp pixel art — **no smooth human anatomy, no rounded arms, no AI-generated body, no realistic skin shader**.
- **No uncontrolled autoRotate.** The model should not spin on its own.
- Disable default orbit/pan/zoom interactions when they interfere with the custom mouse-follow behavior. In particular, hovering and scrolling should not unexpectedly drag or zoom the model.

## 4. Animation timeline (non-negotiable)

Implement a deterministic animation state machine with elapsed time measured from `characterReadyAt` (`performance.now()` or equivalent). Do not assume website mount time equals texture readiness.

### Phase A — 0–500 ms: entrance

- At t=0, the **ready** 3D character is visually hidden (`opacity: 0`, scale around `0.96`, vertical offset around `+12px`).
- By t=500 ms, smoothly reach `opacity: 1`, scale `1`, vertical offset `0`.
- Suggested easing: `cubic-bezier(0.22, 1, 0.36, 1)`.
- The navbar and hero typography can have their own coordinated subtle fade/scramble-in, but the **character timeline must follow the precise schedule**.
- Do not start the wave before t=500 ms.

### Phase B — 500–2000 ms: greeting wave

- Raise one arm naturally and wave the hand **approximately 2–3 small beats**. Aim for a friendly, visible wave, not walking, swinging both arms, punching or a frantic repeated loop.
- The arm should rotate about the **shoulder joint** in Minecraft's blocky skeleton. The opposite arm hangs naturally.
- Add very gentle breathing/body sway. Feet should stay planted, with no sliding.
- `skinview3d` includes **`WaveAnimation`** and **`IdleAnimation`**. You may use a built-in wave if you can stop it cleanly at exactly t=2000 ms, or implement a small custom joint animation when more exact control is required.
- Blend the arm back to neutral during the last ~200–300 ms; at t=2000 ms the greeting is fully complete.
- **Do not loop or replay the wave** unless a future explicit user interaction requests it.

### Phase C — 2000 ms onward: mouse follow

This is the core interaction. Follow mouse movements smoothly and naturally:

1. Listen to **global pointer movement** across the window/hero, not just when the pointer is on the canvas.
2. Convert the pointer position into normalized coordinates around the viewport/hero center, clamped to approximately `[-1, +1]` on each axis.
3. Rotate the **head toward the pointer** with a maximum horizontal yaw of about `±25–30°` and vertical pitch about `±12–18°`. Correct the sign based on the actual 3D camera so the face truly looks toward the pointer.
4. Add a **small torso/shoulder-follow** (roughly `±5–8°` yaw), noticeably less than the head rotation. Legs remain planted.
5. Add extremely subtle **camera parallax** (small camera position/target offset only) so the scene responds cinematically, without orbiting the entire model or making the user seasick.
6. Use **frame-rate-independent damping**, spring smoothing or time-based exponential lerp (~150–250 ms response). No snapping on rapid cursor movement.
7. When the cursor leaves the page or pointer input is inactive, smoothly return head/torso/camera to a calm neutral stance after an appropriate delay.
8. Keep a barely perceptible idle breathing/sway effect, but ensure it does not overwrite cursor-controlled joint transforms.
9. The whole body must never spin 360°, flip backwards, leave the frame or drift permanently away from center.
10. **The waving arm must finish returning to rest before the pointer tracking takes over.** No conflicting animation systems may fight over the same joints.

Important: The visitor is effectively being **watched by the Minecraft character**, while the camera adds a complementary tiny parallax. Do not implement only a moving camera while the character's head stays motionless.

### Mobile / reduced-motion behavior

- On touch-only devices, there is no permanent cursor. After the greeting, use a graceful neutral idle. Optionally let the character glance toward the latest touch position, then ease back to center.
- For `prefers-reduced-motion: reduce`, minimize/skip nonessential wave and camera movement and reveal the character promptly; keep the site usable.
- The renderer must never hijack scrolling or trap touch input.

## 5. Visual direction — retain the best of the supplied MotionSites reference

Create a sophisticated, minimal, premium black-and-white design inspired by the original `neon-logic` prompt, but **rebrand every element for GARELDD**.

### Palette and background

- Near-black / black page background: `#000000` and `#0D0D0D`.
- Main text: white / off-white.
- Secondary text: approximately `rgba(255,255,255,0.55)`.
- Small, restrained accent color may use a muted burnt orange such as `#FF983C`, but **do not turn the whole page into a saturated neon gradient**.
- A subtle dot-grid texture similar to the original (`radial-gradient(#ffffff 1px, transparent 1px)` on a `24px × 24px` repeat), around 0.04–0.06 opacity, behind the model.
- Optional faint, diffuse background glow behind the character to improve silhouette separation; keep the page dark.
- An enormous, low-opacity background watermark reading **`GARELDD`** in **Anton SC**, centered behind the hero (responsive `clamp(...)`, around 0.05–0.10 opacity). It must not obscure the skin or interfere with pointer events.

### Typography / animation

- Use **Space Mono** for all interface text, matching the source style.
- Keep large, thin, carefully spaced headings and tiny understated labels.
- Adapt the reference's animated text components:
  - `ScrambleIn` — tasteful left-to-right character reveal on initial load, ~25 ms frame steps.
  - `ScrambleText` — brief text scramble on button/link hover, resetting cleanly on mouse-out.
- Do not overuse character scramble on every text paragraph. Preserve readability.
- UI motion should feel restrained, fluid and deliberate. Framer Motion springs for pills/navbar transitions; smooth fade-up for small copy.

## 6. Page layout

### Hero (main and most important section)

- Full viewport height on desktop and `min-height: 100dvh` where appropriate; avoid mobile viewport cutoff.
- The **3D character** is the focal point, appearing prominently in the middle/center-right, with real depth and animation.
- Small top-left glassy pill with **`GARELDD`** (text logo is fine; do not copy the SynapseX SVG).
- Minimal, animated hamburger/nav pill may be retained from the reference for later future content, but if no destinations exist, **omit nonfunctional menu items**.
- Primary heading near the lower left: **`HEY, I'M` / `GARELDD`**, set in large Space Mono with the reference-like entrance reveal.
- Short explanatory copy below the heading: **`Move your cursor. I'll follow.`**
- Small supporting label near lower right or beneath the model: **`MINECRAFT CHARACTER // LIVE SKIN`** (do not claim it is an instant real-time sync feed; "live" only means dynamically loaded).
- The character must not overlap or hide the text on laptop widths. Use responsive repositioning/scale, not arbitrary absolute coordinates that break at 1366×768.
- Optionally display a small noninteractive `SLIM MODEL` tag, but keep the interface clean.

### Navbar / footer

- Navbar fixed or absolute at top (desktop target around 80px), translucent `bg-white/10` pills, mild backdrop blur, rounded corners similar to the reference.
- On mobile use smaller pills and fit them without overflow.
- If social links or further page sections are not provided, do **not** invent working links or filler pages. Keep navigation minimal: site name and perhaps an interaction hint.
- Optional tiny footer with `© 2026 GARELDD`. If used, make sure it does not obstruct the full-height hero.

### Important adaptation from the original source

**Remove** the SynapseX brand and logo, neural-science marketing claims, fake performance metrics, "Brain / And Body / One Network" copy, Apple download button, five CloudFront background videos, technology/architecture sales sections and the video-scrubbing code. Those are specific to the original product and do not belong on this personal Minecraft character landing page.

**Keep** the minimalist black/white design language, typography, dot grid, subtle watermark, entrance animations, compact glass nav, accessibility and responsive layout.

Do not add unrelated “Projects,” “Achievements,” “Download,” or “Statistics” sections with invented content. A polished **single-scene hero** is preferable to several filler sections.

## 7. Responsiveness and performance

- Desktop: approximately 1920×1080 and 1366×768 must look intentional and balanced.
- Tablet: protect the model's visible body silhouette and avoid text collision.
- Mobile: stack/resize intelligently, keep the whole model visible, avoid fixed heights that crop feet or head, allow touch scrolling, and maintain the dark premium style.
- Account for device pixel ratio but cap rendered DPR (for example `Math.min(window.devicePixelRatio, 2)`) to avoid wasting GPU time.
- Resize the viewer with a `ResizeObserver` or equivalent; never leave a low-resolution, stretched canvas after resize.
- Use a single `requestAnimationFrame`-based animation update (or library animation loop) with time-based values. Cleanup RAF, resize handlers, pointer handlers and GPU resources on unmount. Handle React StrictMode remounting without duplicates.
- Keep mouse motion handling efficient (update a ref/target position; render at most once per animation frame rather than React state-setting per mouse event).
- Pause or throttle 3D animation when the tab is hidden or the scene is off-screen, then resume smoothly without large jumps in animation time.
- If WebGL is unavailable, display a small graceful fallback explanation rather than a blank black hero.
- No full-screen autoplay videos, giant image downloads, heavy particle fields or other elements that compete with the character.

## 8. Suggested project structure

```text
src/
  App.tsx
  index.css
  components/
    MinecraftCharacter.tsx
    Hero.tsx
    Navbar.tsx
    ScrambleIn.tsx
    ScrambleText.tsx
  lib/
    minecraftSkin.ts
    animationTimeline.ts
  hooks/
    usePointerTarget.ts
  config/
    site.ts
```

You may simplify this if a cleaner structure is possible. The Minecraft skin username, slim model setting, tracking sensitivity and timeline values must be in a clearly identifiable config/constants file rather than scattered as magic numbers.

## 9. Implementation safeguards

- Never create a 2D sprite sheet, GIF or video of a Minecraft character as a substitute for the live 3D player.
- Never use a hardcoded one-time Minecraft skin screenshot.
- Never render Steve geometry; `gareldd` must have **Slim arms** with the correct textures and layers.
- Do not turn "follow cursor" into simple horizontal scrubbing of a canned rotation animation. Support head pitch, yaw, upper-body response and subtle camera parallax.
- Do not run waving and mouse tracking at the same time.
- Do not restart the 0–2-second entrance sequence every time React rerenders, the pointer moves or the window resizes.
- Do not claim instant propagation when the chosen skin service has a documented cache.
- No console errors, uncaught loading promise errors, React memory leaks, or TypeScript build errors.

## 10. Test / acceptance checklist — all items required

1. Loading the page fetches the actual current skin linked to Minecraft username `gareldd`, not a local fixed asset.
2. The rendered model has **Slim / 3-pixel-wide arms** and displays its outer skin layers correctly.
3. The 3D model smoothly appears during its **first 0.5 seconds after loading readiness**.
4. The model raises one arm and waves between **0.5 and 2.0 seconds**.
5. By 2.0 seconds the arm has returned naturally to rest; the wave does not repeat.
6. From 2.0 seconds onward the face visibly follows cursor movement in **left, right, up and down** directions.
7. Torso and camera respond only slightly; there are no sudden jumps, incorrect inverted directions or full-body spins.
8. The view settles naturally to neutral after the pointer leaves.
9. A simulated slow skin request **does not cause the wave to be skipped**; animation begins only once the model is ready.
10. A simulated failed request shows a useful retry/fallback state rather than breaking the page.
11. Mobile displays the full player without cropping and does not rely on a nonexistent mouse cursor.
12. After an upstream skin change propagates through the selected provider's cache, reloading the website displays the changed skin **without editing source code or redeploying**.
13. `npm run build` succeeds; no repeated canvas creation, memory leaks or broken links.

## 11. Deliverables

Implement the complete working site in the project. Include:

- All necessary React/TypeScript/CSS code and installed dependency configuration.
- A visible and working animated Minecraft 3D player.
- Real dynamic skin loading, with sensible caching/error handling.
- Exact three-phase timeline and responsive pointer-follow behavior.
- A short README documenting `npm install`, `npm run dev`, `npm run build`, optional deployment to static hosting, and the skin-refresh delay caveat.
- Explain briefly how to change the username, motion sensitivity and greeting timings in the config.

**Prioritize actual correctness of the model, online skin loading and three animation phases over decorative polish.** Do not stop after generating a screenshot. Implement and test the interactive page.
