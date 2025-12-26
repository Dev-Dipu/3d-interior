import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
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
camera.position.set(0, 1.5, 4); // Start closer

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
const currentTarget = new THREE.Vector3(0, 1, 0);

// Helper to update controls
const updateCamera = () => {
    camera.lookAt(currentTarget);
    controls.target.copy(currentTarget);
    controls.update();
};

// Camera Views (Interior Focus)
// Assumes model is roughly centered at 0,0,0 and scale is in meters.
// Camera Views - Optimized for Kenzo's Room Interior
const views = [
    {
        name: "Room Overview",
        position: { x: 3, y: 2.5, z: 3 },
        target: { x: -1, y: 1, z: 0 },
    },
    {
        name: "Bed & Wall Art",
        position: { x: -3.5, y: 1.5, z: 1.5 },
        target: { x: -1.8, y: 1.5, z: 0 },
    },
    {
        name: "Play Area",
        position: { x: 2, y: 1.2, z: -1 },
        target: { x: 0, y: 0.5, z: 2 },
    },
    {
        name: "TV Corner",
        position: { x: 1, y: 1.5, z: 2.5 },
        target: { x: -2, y: 1, z: 0 },
    },
    {
        name: "Sofa View",
        position: { x: -2, y: 1.3, z: -2 },
        target: { x: 1, y: 1, z: 1 },
    },
    {
        name: "Bird's Eye",
        position: { x: 0, y: 6, z: 1 },
        target: { x: 0, y: 0, z: 0.5 },
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
