import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import gsap from "gsap";
import GUI from "lil-gui";

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
camera.position.set(0.990, 0.840, -0.290); // Start closer
// camera helper
// const cameraHelper = new THREE.CameraHelper(camera);
// scene.add(cameraHelper);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.querySelector("#app").appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5); // Brighter ambient for interior
scene.add(ambientLight);

const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2); // Soft overall light
scene.add(hemisphereLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Current Camera Target (for tweening lookAt)
const currentTarget = new THREE.Vector3(1.380, 0.830, -0.090);

// Helper to update controls
const updateCamera = () => {
    camera.lookAt(currentTarget);
    controls.target.copy(currentTarget);
    controls.update();
};

// Camera Views (Interior Focus)
// Assumes model is roughly centered at 0,0,0 and scale is in meters.
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
loader.load(
    "/model/scene.gltf",
    (gltf) => {
        const model = gltf.scene;
        scene.add(model);

        // Initial Animation to first view
        gsap.to(camera.position, {
            x: views[0].position.x,
            y: views[0].position.y,
            z: views[0].position.z,
            duration: 2,
            ease: "power2.inOut",
            onUpdate: updateCamera,
        });

        console.log("Model Loaded");
    },
    undefined,
    (error) => {
        console.error(error);
    }
);

// UI Controls
const controlsContainer = document.createElement("div");
controlsContainer.className = "controls";
document.body.appendChild(controlsContainer);

views.forEach((view, index) => {
    const btn = document.createElement("button");
    btn.className = "view-btn";
    btn.innerText = view.name;
    btn.onclick = () => switchView(index);
    controlsContainer.appendChild(btn);
});

let currentViewIndex = 0;

function switchView(index) {
    // Update active class
    const buttons = document.querySelectorAll(".view-btn");
    buttons.forEach((b) => b.classList.remove("active"));
    buttons[index].classList.add("active");

    const view = views[index];

    // Animate Position
    gsap.to(camera.position, {
        x: view.position.x,
        y: view.position.y,
        z: view.position.z,
        duration: 2,
        ease: "power3.inOut",
        onUpdate: updateCamera,
    });

    // Animate Target (LookAt)
    gsap.to(currentTarget, {
        x: view.target.x,
        y: view.target.y,
        z: view.target.z,
        duration: 2,
        ease: "power3.inOut",
        onUpdate: updateCamera,
    });

    currentViewIndex = index;
}

// Window Resize
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();

// Initialize first button active
document.querySelectorAll(".view-btn")[0]?.classList.add("active");


const gui = new GUI({ title: "Camera Panel" });

const camFolder = gui.addFolder("Camera Position");
camFolder.add(camera.position, "x", -10, 10, 0.01);
camFolder.add(camera.position, "y", -10, 10, 0.01);
camFolder.add(camera.position, "z", -10, 10, 0.01);

const targetFolder = gui.addFolder("Camera Target");
targetFolder.add(currentTarget, "x", -10, 10, 0.01).onChange(updateCamera);
targetFolder.add(currentTarget, "y", -10, 10, 0.01).onChange(updateCamera);
targetFolder.add(currentTarget, "z", -10, 10, 0.01).onChange(updateCamera);

const miscFolder = gui.addFolder("Other");
miscFolder.add(camera, "fov", 20, 120, 1).onChange(() => camera.updateProjectionMatrix());
miscFolder.add(controls, "enableDamping");
miscFolder.add(controls, "enabled").name("Orbit Enabled");

const actions = {
  logPreset() {
    console.log(`
{
  name: "New View",
  position: { x: ${camera.position.x.toFixed(3)}, y: ${camera.position.y.toFixed(3)}, z: ${camera.position.z.toFixed(3)} },
  target: { x: ${currentTarget.x.toFixed(3)}, y: ${currentTarget.y.toFixed(3)}, z: ${currentTarget.z.toFixed(3)} },
}
`);
  },
};

gui.add(actions, "logPreset").name("Log Camera Preset");