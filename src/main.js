import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import gsap from "gsap";

// Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Camera Setup
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0.99, 0.84, -0.29);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.physicallyCorrectLights = true;
document.querySelector("#app").appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enabled = false;
// Lighting
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

const hemi = new THREE.HemisphereLight(0xf5f0e6, 0x1a1a1a, 0.8);
scene.add(hemi);

const keyLight = new THREE.DirectionalLight(0xfff2e0, 2.5);
keyLight.position.set(5, 8, 3);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffe0b2, 1.2);
fillLight.position.set(-3, 4, 2);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
rimLight.position.set(0, 5, -5);
scene.add(rimLight);

// Environment
new RGBELoader()
  .load("https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/hilly_terrain_01_2k.hdr", (hdr) => {
    scene.environment = hdr;
    scene.background = hdr;
  });

// Camera Target
const currentTarget = new THREE.Vector3(1.38, 0.83, -0.09);
const updateCamera = () => {
  camera.lookAt(currentTarget);
  controls.target.copy(currentTarget);
  controls.update();
};

// Views
const views = [
  {
    name: "Living Area",
    position: { x: 0.990, y: 0.840, z: -0.290 },
    target: { x: 1.380, y: 0.830, z: -0.090 },
  },
  {
    name: "TV & Sofa",
    position: { x: -0.130, y: 0.860, z: 1.320 },
    target: { x: -1.960, y: 0.620, z: -0.520 },
  },
  {
    name: "Bedroom View",
    position: { x: -2.769, y: 1.465, z: 1.240 },
    target: { x: -3.320, y: 1.180, z: 0.650 },
  },
  {
    name: "Kitchen Corner",
    position: { x: -0.850, y: 1.150, z: 1.797 },
    target: { x: -7.540, y: -0.130, z: 5.880 },
  },
  {
    name: "Play Area",
    position: { x: -3.270, y: 3.120, z: -0.570 },
    target: { x: -9.670, y: -0.820, z: 10.000 },
  },
];

// Load Model
const loader = new GLTFLoader();
loader.load("/model/scene.gltf", (gltf) => {
  const model = gltf.scene;
  scene.add(model);

  model.traverse((child) => {
    if (child.isMesh && child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((mat) => {
        if (mat.map) {
          mat.map.encoding = THREE.sRGBEncoding;
          mat.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
        }
        mat.depthWrite = true;
        mat.depthTest = true;
        mat.polygonOffset = true;
        mat.polygonOffsetFactor = -1;
        mat.polygonOffsetUnits = -1;
        mat.roughness = Math.min(mat.roughness ?? 0.8, 0.9);
        mat.metalness = Math.min(mat.metalness ?? 0.1, 0.2);
      });
    }
  });

  gsap.to(camera.position, {
    ...views[0].position,
    duration: 2,
    ease: "power2.inOut",
    onUpdate: updateCamera,
  });
});

// UI Buttons
const controlsContainer = document.createElement("div");
controlsContainer.className = "controls";
document.body.appendChild(controlsContainer);

views.forEach((view, i) => {
  const btn = document.createElement("button");
  btn.className = "view-btn";
  btn.innerText = view.name;
  btn.onclick = () => switchView(i);
  controlsContainer.appendChild(btn);
});

function switchView(i) {
  const v = views[i];
  gsap.to(camera.position, { ...v.position, duration: 2, onUpdate: updateCamera });
  gsap.to(currentTarget, { ...v.target, duration: 2, onUpdate: updateCamera });
}

// Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animate
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
