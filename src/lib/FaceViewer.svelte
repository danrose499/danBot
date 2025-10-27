<script>
  import * as THREE from 'three';
  import { onMount, onDestroy } from 'svelte';

  let container;
  let renderer, scene, camera;
  let pmrem;
  let model;
  let frameId;

  // Animation state
  let clock;

  let targetRotX = 0;
  let targetRotY = 0;
  let currentRotX = 0;
  let currentRotY = 0;
  let t = 0;

  // Procedural face controls
  export let speaking = false;
  export let autoBlink = true;

  // Morph target tracking
  const morphMeshes = [];
  let idx = {
    EyeBlinkLeft: null,
    EyeBlinkRight: null,
    Blink: null,
    JawOpen: null,
    MouthOpen: null
  };

  // Blink state
  let nextBlinkIn = 0; // seconds
  let blinkTime = 0;   // 0..1 progress of current blink
  let isBlinking = false;

  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  export let src = '/face.glb';
  export let blinkKeys = []; // optional explicit morph names for eyelids
  export let removeHands = false;

  function resize() {
    if (!container || !renderer || !camera) return;
    const { clientWidth: w, clientHeight: h } = container;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(DPR);
  }

  function onPointerMove(e) {
    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width; // 0..1
    const y = (e.clientY - rect.top) / rect.height; // 0..1
    const dx = (x - 0.5) * 2; // -1..1
    const dy = (y - 0.5) * 2; // -1..1

    targetRotY = dx * 0.5; // yaw
    targetRotX = dy * 0.3; // pitch (invert fixed)
  }

  function animate() {
    frameId = requestAnimationFrame(animate);
    const dt = Math.min(0.05, clock?.getDelta?.() || 0.016);
    t += dt;

    // smooth follow
    currentRotX += (targetRotX - currentRotX) * 0.08;
    currentRotY += (targetRotY - currentRotY) * 0.08;

    if (model) {
      model.rotation.x = currentRotX;
      model.rotation.y = currentRotY;
      // subtle float
      model.position.y = Math.sin(t) * 0.03;
    }

    // Procedural facial animation (morph targets only, if available)
    if (morphMeshes.length) {
      // Blink logic
      if (autoBlink) {
        nextBlinkIn -= dt;
        if (!isBlinking && nextBlinkIn <= 0) {
          isBlinking = true;
          blinkTime = 0;
        }
      }
      if (isBlinking) {
        const blinkDuration = 0.18; // seconds
        blinkTime += dt / blinkDuration;
        const x = Math.min(1, blinkTime);
        // fast ease-in-out curve
        const ease = x < 0.5 ? (2 * x * x) : (1 - Math.pow(-2 * x + 2, 2) / 2);
        const blinkVal = 1.0 * ease; // 0..1
        applyBlinkValue(blinkVal);
        if (blinkTime >= 1) {
          isBlinking = false;
          // reset influences to open
          applyBlinkValue(0);
          // schedule next blink in 3-7s
          nextBlinkIn = 3 + Math.random() * 4;
        }
      }

      // Speaking / mouth movement
      const mouthTarget = idx.JawOpen != null ? 'JawOpen' : (idx.MouthOpen != null ? 'MouthOpen' : null);
      if (mouthTarget) {
        const current = getMorphValue(mouthTarget);
        let target = 0;
        if (speaking) {
          // Layered sines pseudo-random mouth movement
          const n = Math.abs(Math.sin(t * 7) * 0.6 + Math.sin(t * 13.1 + 1.7) * 0.4);
          target = Math.min(1, Math.max(0, n));
          target = target * 0.7; // limit openness
        }
        const newVal = current + (target - current) * 0.25; // smooth
        setMorphValue(mouthTarget, newVal);
      }
    }

    renderer.render(scene, camera);
  }

  async function init() {
    scene = new THREE.Scene();
    scene.background = null;

    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 2.2);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    container.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
    hemi.position.set(0, 1, 0);
    scene.add(hemi);

    const amb = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(amb);

    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(2, 2, 2);
    dir.castShadow = false;
    scene.add(dir);

    const [
      { GLTFLoader },
      { DRACOLoader },
      { RoomEnvironment },
      { KTX2Loader },
      { MeshoptDecoder }
    ] = await Promise.all([
      import('three/examples/jsm/loaders/GLTFLoader.js'),
      import('three/examples/jsm/loaders/DRACOLoader.js'),
      import('three/examples/jsm/environments/RoomEnvironment.js'),
      import('three/examples/jsm/loaders/KTX2Loader.js'),
      import('three/examples/jsm/libs/meshopt_decoder.module.js')
    ]);

    pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');

    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
    const ktx2 = new KTX2Loader().setTranscoderPath('https://unpkg.com/three/examples/jsm/libs/basis/').detectSupport(renderer);
    loader.setKTX2Loader(ktx2);
    loader.setMeshoptDecoder(MeshoptDecoder);
    const modelPath = (import.meta.env.BASE_URL || '/') + (src?.startsWith('/') ? src.slice(1) : src) + (src?.includes('?') ? '' : `?v=${Date.now()}`);
    loader.load(
      modelPath,
      (gltf) => {
        model = gltf.scene;
        // center and scale, then fit camera
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        model.position.sub(center); // center at origin
        const maxDim = Math.max(size.x, size.y, size.z);
        const safeDim = Number.isFinite(maxDim) && maxDim > 0 ? maxDim : 1;
        const scale = 1.6 / safeDim;
        model.scale.setScalar(scale);

        if (removeHands) {
          const toRemove = [];
          model.traverse((o) => {
            if (o && o.name && /hand/i.test(o.name)) toRemove.push(o);
          });
          toRemove.forEach((n) => n.parent && n.parent.remove(n));
        }

        const fov = (camera.fov * Math.PI) / 180;
        const fitHeight = size.y * scale;
        const fitWidth = size.x * scale;
        const dist = Math.max(fitHeight, fitWidth) / (2 * Math.tan(fov / 2)) + 0.2;
        camera.position.set(0, 0, dist);
        camera.lookAt(0, 0, 0);
        scene.add(model);

        // Detect morph targets
        morphMeshes.length = 0;
        idx = { EyeBlinkLeft: null, EyeBlinkRight: null, Blink: null, JawOpen: null, MouthOpen: null };
        const allKeys = new Set();
        model.traverse((o) => {
          if (o && o.isMesh && o.morphTargetDictionary && o.morphTargetInfluences) {
            const dict = o.morphTargetDictionary;
            const found = {};
            // per-mesh blink indices
            const any = [];
            const left = [];
            const right = [];
            for (const key in dict) {
              const k = key.toLowerCase();
              allKeys.add(key);
              const byProp = Array.isArray(blinkKeys) && blinkKeys.some((n) => n && n.toLowerCase() === k);
              const isBlinkAny = byProp || k.includes('blink') || (k.includes('eye') && (k.includes('close') || k.includes('shut') || k.includes('lid')));
              if (isBlinkAny) any.push(dict[key]);
              if ((k === 'eyeblinkleft' || (k.includes('blink') && (k.includes('left') || k.endsWith('_l') || k.endsWith('.l') || k.includes('l_')))) ) left.push(dict[key]);
              if ((k === 'eyeblinkright' || (k.includes('blink') && (k.includes('right') || k.endsWith('_r') || k.endsWith('.r') || k.includes('r_')))) ) right.push(dict[key]);
              if (isBlinkAny && !('Blink' in found)) found['Blink'] = dict[key];
              if (left.length && !('EyeBlinkLeft' in found)) found['EyeBlinkLeft'] = left[0];
              if (right.length && !('EyeBlinkRight' in found)) found['EyeBlinkRight'] = right[0];
              if ((k.includes('jawopen') || k === 'jawopen') && !('JawOpen' in found)) found['JawOpen'] = dict[key];
              if ((k.includes('mouthopen') || k === 'mouthopen') && !('MouthOpen' in found)) found['MouthOpen'] = dict[key];
            }
            // Enable morph targets on material if supported
            if (Array.isArray(o.material)) {
              for (const mat of o.material) if (mat && 'morphTargets' in mat) mat.morphTargets = true;
            } else if (o.material && 'morphTargets' in o.material) {
              o.material.morphTargets = true;
            }
            // Save per-mesh blink indices for direct application
            o.userData.__blinkAny = any;
            o.userData.__blinkLeft = left;
            o.userData.__blinkRight = right;
            // Record any indices we discovered
            for (const n in found) {
              if (idx[n] == null) idx[n] = found[n];
            }
            // Only keep meshes that have any of our targets
            if (any.length || left.length || right.length || Object.keys(found).length) morphMeshes.push(o);
          }
        });
        const totalBlinkSlots = morphMeshes.reduce((acc, m) => acc + (m.userData.__blinkAny?.length||0) + (m.userData.__blinkLeft?.length||0) + (m.userData.__blinkRight?.length||0), 0);
        if (!totalBlinkSlots) {
          console.warn('No morph targets related to eyelid/blink were found on the loaded model. Available morph keys:', Array.from(allKeys));
          fallbackBlink = true;
        } else {
          console.log(`[FaceViewer] Blink targets: meshes=${morphMeshes.length}, slots=${totalBlinkSlots}. All keys:`, Array.from(allKeys));
          fallbackBlink = false;
        }

        // (camera fit already computed above before detection)
      },
      undefined,
      (err) => {
        console.error('Failed to load GLB', err);
      }
    );

    resize();
    window.addEventListener('resize', resize);
    container.addEventListener('pointermove', onPointerMove);
    clock = new THREE.Clock();
    // schedule initial blink
    nextBlinkIn = 1.5 + Math.random() * 2.0;
    animate();
  }

  onMount(() => {
    init();
  });

  onDestroy(() => {
    cancelAnimationFrame(frameId);
    window.removeEventListener('resize', resize);
    container?.removeEventListener('pointermove', onPointerMove);
    renderer?.dispose();
    pmrem?.dispose?.();
  });

  function setMorphValue(name, value) {
    if (!morphMeshes.length) return;
    for (const m of morphMeshes) {
      const dict = m.morphTargetDictionary;
      const infl = m.morphTargetInfluences;
      if (!dict || !infl) continue;
      const i = dict[name] ?? idx[name];
      if (i != null && infl[i] != null) infl[i] = value;
    }
  }

  function getMorphValue(name) {
    if (!morphMeshes.length) return 0;
    const m = morphMeshes[0];
    const dict = m.morphTargetDictionary;
    const infl = m.morphTargetInfluences;
    const i = dict?.[name] ?? idx[name];
    return i != null && infl?.[i] != null ? infl[i] : 0;
  }

  export function blinkNow() {
    if (!morphMeshes.length) return;
    isBlinking = true;
    blinkTime = 0;
    nextBlinkIn = 1 + Math.random() * 2;
  }

  function applyBlinkValue(v) {
    if (!morphMeshes.length) return;
    for (const m of morphMeshes) {
      const infl = m.morphTargetInfluences;
      const dict = m.morphTargetDictionary;
      if (!infl || !dict) continue;
      const any = m.userData.__blinkAny || [];
      const left = m.userData.__blinkLeft || [];
      const right = m.userData.__blinkRight || [];
      if (any.length + left.length + right.length === 0) {
        const iAny = dict['Blink'] ?? idx.Blink;
        const iL = dict['EyeBlinkLeft'] ?? idx.EyeBlinkLeft;
        const iR = dict['EyeBlinkRight'] ?? idx.EyeBlinkRight;
        if (iAny != null && infl[iAny] != null) infl[iAny] = v;
        if (iL != null && infl[iL] != null) infl[iL] = v;
        if (iR != null && infl[iR] != null) infl[iR] = v;
        continue;
      }
      for (const i of any) if (infl[i] != null) infl[i] = v;
      for (const i of left) if (infl[i] != null) infl[i] = v;
      for (const i of right) if (infl[i] != null) infl[i] = v;
    }
  }
  </script>

<div class="viewer" bind:this={container}>
  <!-- three.js canvas injected -->
</div>

<style>
  .viewer {
    width: 100%;
    height: min(60vh, 60svh);
    margin: 0 auto;
  }
  :global(canvas) {
    display: block;
    width: 100% !important;
    height: 100% !important;
  }
</style>
