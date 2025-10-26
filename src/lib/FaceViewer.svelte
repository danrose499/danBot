<script>
  import * as THREE from 'three';
  import { onMount, onDestroy } from 'svelte';

  let container;
  let renderer, scene, camera;
  let pmrem;
  let model;
  let frameId;

  let targetRotX = 0;
  let targetRotY = 0;
  let currentRotX = 0;
  let currentRotY = 0;
  let t = 0;

  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  export let src = '/face.glb';
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
    t += 0.01;

    // smooth follow
    currentRotX += (targetRotX - currentRotX) * 0.08;
    currentRotY += (targetRotY - currentRotY) * 0.08;

    if (model) {
      model.rotation.x = currentRotX;
      model.rotation.y = currentRotY;
      // subtle float
      model.position.y = Math.sin(t) * 0.03;
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
      },
      undefined,
      (err) => {
        console.error('Failed to load GLB', err);
      }
    );

    resize();
    window.addEventListener('resize', resize);
    container.addEventListener('pointermove', onPointerMove);
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
