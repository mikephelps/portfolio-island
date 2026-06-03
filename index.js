import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Scene setup
const scene = new THREE.Scene();

// Gradient sky dome — MV-style teal-blue to soft lavender horizon
{
  const skyGeo = new THREE.SphereGeometry(400, 32, 16);
  const skyMat = new THREE.ShaderMaterial({
    uniforms: {
      topColor:    { value: new THREE.Color(0x7AB0CC) },
      horizColor:  { value: new THREE.Color(0xC0B8D4) },
      bottomColor: { value: new THREE.Color(0xD0C4CC) },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 horizColor;
      uniform vec3 bottomColor;
      varying vec3 vWorldPos;
      void main() {
        float h = normalize(vWorldPos).y;
        float t = pow(max(h, 0.0), 0.6);
        float b = max(-h * 0.5, 0.0);
        vec3 col = mix(horizColor, topColor, t);
        col = mix(col, bottomColor, b);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
  });
  scene.add(new THREE.Mesh(skyGeo, skyMat));
}

scene.fog = new THREE.Fog(0xC4C0D0, 50, 130);

// Desktop: lower, more frontal, shows sky above title + water on sides
// Mobile: wider/overhead to fit everything
const _isDesktop = window.innerWidth >= 1024;
const camera = new THREE.PerspectiveCamera(
  _isDesktop ? 38 : 44,
  window.innerWidth / window.innerHeight, 0.1, 1000
);
camera.position.set(
  _isDesktop ? 7.65 : -18,
  _isDesktop ? 13.35 : 20,
  _isDesktop ? 26.6 : 26
);
camera.lookAt(1, -1, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const root = document.getElementById('root') ?? document.body;
root.style.margin = '0';
root.style.overflow = 'hidden';
root.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xEEEAF8, 0.7);
ambientLight.name = 'ambientLight';
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xFFF6E8, 1.2);
dirLight.name = 'directionalLight';
dirLight.position.set(12, 24, 14);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 70;
dirLight.shadow.camera.left = -30;
dirLight.shadow.camera.right = 30;
dirLight.shadow.camera.top = 30;
dirLight.shadow.camera.bottom = -30;
dirLight.shadow.bias = -0.001;
dirLight.shadow.normalBias = 0.02;
scene.add(dirLight);

const fillLight = new THREE.DirectionalLight(0xE4D4F4, 0.4);
fillLight.name = 'fillLight';
fillLight.position.set(-8, 6, -4);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xC8D8F0, 0.2);
rimLight.name = 'rimLight';
rimLight.position.set(-5, 3, 10);
scene.add(rimLight);

// Master group
const island = new THREE.Group();
island.name = 'islandGroup';
island.position.set(2, 0, 1);
island.scale.setScalar(0.85);
scene.add(island);

// Helper: Rounded box
function createRoundedBox(w, h, d, r, color, segments = 4, roughness = 0.42, metalness = 0.05) {
  const geo = new THREE.BoxGeometry(w, h, d, segments, segments, segments);
  const positions = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < positions.count; i++) {
    v.fromBufferAttribute(positions, i);
    const hw = w / 2, hh = h / 2, hd = d / 2;
    const sx = Math.max(0, Math.abs(v.x) - (hw - r)) * Math.sign(v.x);
    const sy = Math.max(0, Math.abs(v.y) - (hh - r)) * Math.sign(v.y);
    const sz = Math.max(0, Math.abs(v.z) - (hd - r)) * Math.sign(v.z);
    const len = Math.sqrt(sx * sx + sy * sy + sz * sz);
    if (len > 0) {
      const scale = r / len;
      v.x = (hw - r) * Math.sign(v.x) * (Math.abs(v.x) >= hw - r ? 1 : Math.abs(v.x) / (hw - r)) + sx * scale;
      v.y = (hh - r) * Math.sign(v.y) * (Math.abs(v.y) >= hh - r ? 1 : Math.abs(v.y) / (hh - r)) + sy * scale;
      v.z = (hd - r) * Math.sign(v.z) * (Math.abs(v.z) >= hd - r ? 1 : Math.abs(v.z) / (hd - r)) + sz * scale;
    }
    positions.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color, roughness, metalness });
  return new THREE.Mesh(geo, mat);
}

// FLOATING ISLAND BASE - much wider
function createIslandBase() {
  const baseGroup = new THREE.Group();
  baseGroup.name = 'islandBase';

  const mainSlab = createRoundedBox(26, 5, 24, 1.4, 0xC0AA8A, 6, 0.55, 0.02);
  mainSlab.name = 'mainSlab';
  mainSlab.position.y = -3;
  mainSlab.castShadow = true;
  mainSlab.receiveShadow = true;
  baseGroup.add(mainSlab);

  const bottomSlab = createRoundedBox(20, 3, 18, 1.5, 0xAE9878, 5, 0.58, 0.02);
  bottomSlab.name = 'bottomSlab';
  bottomSlab.position.y = -6.5;
  bottomSlab.castShadow = true;
  baseGroup.add(bottomSlab);

  const tipSlab = createRoundedBox(10, 2.5, 9, 1.2, 0x9E8868, 4, 0.60, 0.02);
  tipSlab.name = 'tipSlab';
  tipSlab.position.y = -9;
  tipSlab.castShadow = true;
  baseGroup.add(tipSlab);

  const grassTop = createRoundedBox(26.2, 0.6, 24.2, 0.5, 0x88C462, 6, 0.65, 0.0);
  grassTop.name = 'grassTop';
  grassTop.position.y = -0.3;
  grassTop.receiveShadow = true;
  baseGroup.add(grassTop);

  const dirtPatch1 = createRoundedBox(3, 1.5, 2, 0.5, 0xB4A082, 3, 0.60, 0.02);
  dirtPatch1.name = 'dirtPatch1';
  dirtPatch1.position.set(-10, -2, 3);
  dirtPatch1.rotation.z = 0.2;
  baseGroup.add(dirtPatch1);

  const dirtPatch2 = createRoundedBox(2.5, 1.2, 3, 0.4, 0xB4A082, 3, 0.60, 0.02);
  dirtPatch2.name = 'dirtPatch2';
  dirtPatch2.position.set(8, -5, -9);
  dirtPatch2.rotation.z = -0.15;
  baseGroup.add(dirtPatch2);

  const dirtPatch3 = createRoundedBox(2, 1.3, 2.5, 0.4, 0xB4A082, 3, 0.60, 0.02);
  dirtPatch3.name = 'dirtPatch3';
  dirtPatch3.position.set(10, -3, 5);
  dirtPatch3.rotation.z = 0.1;
  baseGroup.add(dirtPatch3);

  return baseGroup;
}

island.add(createIslandBase());

// Building body with per-face color variation — top lighter, sides/back darker
function createBuildingBox(w, h, d, color, roughness = 0.36, metalness = 0.06) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const c = new THREE.Color(color);
  const top  = c.clone().lerp(new THREE.Color(0xffffff), 0.22);
  const side = c.clone().lerp(new THREE.Color(0x000000), 0.07);
  const dark = c.clone().lerp(new THREE.Color(0x000000), 0.16);
  const mk = col => new THREE.MeshStandardMaterial({ color: col, roughness, metalness });
  const mesh = new THREE.Mesh(geo, [mk(side), mk(side), mk(top), mk(dark), mk(c), mk(dark)]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// BUILDINGS - slightly smaller, all doors face toward center
function createBuilding(params) {
  const { w, h, d, color, x, z, roofColor, windowColor, name: bName, roofStyle, doorSide } = params;
  const bGroup = new THREE.Group();
  bGroup.name = bName;

  const body = createBuildingBox(w, h, d, color);
  body.name = bName + '_body';
  body.position.y = h / 2;
  bGroup.add(body);

  // Architectural cornice — lighter top cap that catches light
  const capColor = new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.28);
  const cap = createRoundedBox(w + 0.08, 0.14, d + 0.08, 0.04, capColor.getHex(), 3, 0.28, 0.10);
  cap.name = bName + '_cap';
  cap.position.y = h - 0.07;
  cap.castShadow = true;
  bGroup.add(cap);

  if (roofStyle === 'dome') {
    const roofGeo = new THREE.SphereGeometry(Math.min(w, d) * 0.55, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.38, metalness: 0.08 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.name = bName + '_roof';
    roof.position.y = h;
    roof.castShadow = true;
    bGroup.add(roof);
  } else if (roofStyle === 'flat') {
    const roofSlab = createRoundedBox(w + 0.3, 0.35, d + 0.3, 0.15, roofColor, 3);
    roofSlab.name = bName + '_roof';
    roofSlab.position.y = h + 0.18;
    roofSlab.castShadow = true;
    bGroup.add(roofSlab);
  } else if (roofStyle === 'stepped') {
    const step1 = createRoundedBox(w * 0.75, 0.6, d * 0.75, 0.2, roofColor, 3);
    step1.name = bName + '_roofStep1';
    step1.position.y = h + 0.3;
    step1.castShadow = true;
    bGroup.add(step1);
    const step2 = createRoundedBox(w * 0.45, 0.5, d * 0.45, 0.18, roofColor, 3);
    step2.name = bName + '_roofStep2';
    step2.position.y = h + 0.85;
    step2.castShadow = true;
    bGroup.add(step2);
  }

  // Windows
  const winCol = windowColor || 0xD6EAF8;
  const wMat = new THREE.MeshStandardMaterial({
    color: winCol,
    roughness: 0.12,
    metalness: 0.25,
    emissive: new THREE.Color(winCol),
    emissiveIntensity: 0.06,
  });
  const windowRows = Math.max(1, Math.floor(h / 1.2));
  const windowCols = Math.max(1, Math.floor(w / 1.1));

  for (let row = 0; row < windowRows; row++) {
    for (let col = 0; col < windowCols; col++) {
      const wGeo = new THREE.BoxGeometry(0.4, 0.35, 0.08, 2, 2, 1);
      const winPositions = wGeo.attributes.position;
      const wv = new THREE.Vector3();
      for (let i = 0; i < winPositions.count; i++) {
        wv.fromBufferAttribute(winPositions, i);
        const rr = 0.08;
        const shx = Math.max(0, Math.abs(wv.x) - (0.2 - rr)) * Math.sign(wv.x);
        const shy = Math.max(0, Math.abs(wv.y) - (0.175 - rr)) * Math.sign(wv.y);
        const l = Math.sqrt(shx * shx + shy * shy);
        if (l > 0) {
          wv.x = (0.2 - rr) * Math.sign(wv.x) * (Math.abs(wv.x) >= 0.2 - rr ? 1 : Math.abs(wv.x) / (0.2 - rr)) + shx * (rr / l);
          wv.y = (0.175 - rr) * Math.sign(wv.y) * (Math.abs(wv.y) >= 0.175 - rr ? 1 : Math.abs(wv.y) / (0.175 - rr)) + shy * (rr / l);
        }
        winPositions.setXYZ(i, wv.x, wv.y, wv.z);
      }
      wGeo.computeVertexNormals();

      // Windows on all visible faces
      const win = new THREE.Mesh(wGeo, wMat);
      win.name = `${bName}_winF_${row}_${col}`;
      const wx = -w / 2 + 0.5 + col * (w - 1) / Math.max(1, windowCols - 1);
      const wy = 0.8 + row * 1.1;
      win.position.set(windowCols === 1 ? 0 : wx, wy, d / 2 + 0.04);
      bGroup.add(win);

      // Back windows
      const winBack = new THREE.Mesh(wGeo, wMat);
      winBack.name = `${bName}_winB_${row}_${col}`;
      winBack.position.set(windowCols === 1 ? 0 : wx, wy, -d / 2 - 0.04);
      winBack.rotation.y = Math.PI;
      bGroup.add(winBack);

      if (col < Math.floor(d / 1.1)) {
        const winSide = new THREE.Mesh(wGeo, wMat);
        winSide.name = `${bName}_winS_${row}_${col}`;
        const wz = -d / 2 + 0.5 + col * (d - 1) / Math.max(1, Math.floor(d / 1.1) - 1);
        winSide.position.set(w / 2 + 0.04, wy, Math.floor(d / 1.1) === 1 ? 0 : wz);
        winSide.rotation.y = Math.PI / 2;
        bGroup.add(winSide);

        const winSide2 = new THREE.Mesh(wGeo, wMat);
        winSide2.name = `${bName}_winS2_${row}_${col}`;
        winSide2.position.set(-w / 2 - 0.04, wy, Math.floor(d / 1.1) === 1 ? 0 : wz);
        winSide2.rotation.y = -Math.PI / 2;
        bGroup.add(winSide2);
      }
    }
  }

  // Door with hinge pivot so it can swing open when skater arrives
  const doorGeo = new THREE.BoxGeometry(0.5, 0.7, 0.1, 3, 3, 1);
  const dPositions = doorGeo.attributes.position;
  for (let i = 0; i < dPositions.count; i++) {
    const dv = new THREE.Vector3().fromBufferAttribute(dPositions, i);
    if (dv.y > 0.25) {
      const dx = dv.x / 0.25;
      const excess = dv.y - 0.25;
      dv.y = 0.25 + excess * Math.sqrt(Math.max(0, 1 - dx * dx * 0.5));
    }
    dPositions.setXYZ(i, dv.x, dv.y, dv.z);
  }
  doorGeo.computeVertexNormals();
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x6A4E3C, roughness: 0.65, metalness: 0.05 });
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.name = bName + '_door';
  door.castShadow = true;

  // Pivot group — hinge sits at one vertical edge; door panel offset inside so that edge is at pivot origin
  const doorPivot = new THREE.Group();
  doorPivot.name = bName + '_doorPivot';

  const stepGeo = new THREE.BoxGeometry(0.8, 0.06, 0.35, 2, 1, 1);
  const stepMat = new THREE.MeshStandardMaterial({ color: 0xD0C8B8, roughness: 0.55, metalness: 0.04 });
  const doorStep = new THREE.Mesh(stepGeo, stepMat);
  doorStep.name = bName + '_doorStep';
  doorStep.receiveShadow = true;

  if (doorSide === '+z') {
    // Hinge on +x edge; door opens outward +z
    doorPivot.position.set(0.25, 0.35, d / 2 + 0.05);
    door.position.set(-0.25, 0, 0);
    doorPivot.userData.openAngle = Math.PI / 2;
    doorStep.position.set(0, 0.03, d / 2 + 0.2);
  } else if (doorSide === '-z') {
    // Hinge on -x edge; door opens outward -z
    doorPivot.position.set(-0.25, 0.35, -(d / 2 + 0.05));
    door.position.set(0.25, 0, 0);
    door.rotation.y = Math.PI;
    doorPivot.userData.openAngle = Math.PI / 2;
    doorStep.position.set(0, 0.03, -(d / 2 + 0.2));
  } else if (doorSide === '+x') {
    // Hinge on +z edge; door opens outward +x
    doorPivot.position.set(w / 2 + 0.05, 0.35, 0.25);
    door.position.set(0, 0, -0.25);
    door.rotation.y = Math.PI / 2;
    doorPivot.userData.openAngle = -Math.PI / 2;
    doorStep.position.set(w / 2 + 0.2, 0.03, 0);
    doorStep.rotation.y = Math.PI / 2;
  } else if (doorSide === '-x') {
    // Hinge on +z edge; door opens outward -x
    doorPivot.position.set(-(w / 2 + 0.05), 0.35, 0.25);
    door.position.set(0, 0, -0.25);
    door.rotation.y = -Math.PI / 2;
    doorPivot.userData.openAngle = Math.PI / 2;
    doorStep.position.set(-(w / 2 + 0.2), 0.03, 0);
    doorStep.rotation.y = Math.PI / 2;
  }
  doorPivot.add(door);
  bGroup.add(doorPivot);
  bGroup.add(doorStep);

  bGroup.position.set(x, 0, z);
  return bGroup;
}

// Buildings: HQ center, 4 corners pushed far out, doors facing inward
const buildings = [
  // Main HQ - center (LinkedIn — refined slate blue)
  { w: 2.8, h: 4, d: 2.6, color: 0x5882A8, x: 0, z: 0, roofColor: 0x3A5E80, windowColor: 0xC0DCF0, name: 'buildingHQ', roofStyle: 'stepped', doorSide: '+z' },
  // Studio - front-left corner (Visier — muted sage teal)
  { w: 2.2, h: 2.8, d: 2.2, color: 0x6AB0AC, x: -9, z: 8, roofColor: 0x4A8C88, windowColor: 0xCCE8E6, name: 'buildingStudio', roofStyle: 'dome', doorSide: '+x' },
  // Lab - front-right corner (Shared Beginnings — sage green)
  { w: 1.8, h: 2, d: 1.8, color: 0x82A87A, x: 9, z: 8, roofColor: 0x5E8858, windowColor: 0xCCE4CC, name: 'buildingLab', roofStyle: 'flat', doorSide: '-x' },
  // Tower - back-right corner (Atlantic — dusty mauve)
  { w: 1.6, h: 4.8, d: 1.6, color: 0x9A88B4, x: 9, z: -8, roofColor: 0x726898, windowColor: 0xDED8F0, name: 'buildingTower', roofStyle: 'dome', doorSide: '-x' },
  // Gallery - back-left corner (Roboro — muted dusty rose)
  { w: 3, h: 1.8, d: 2, color: 0xBE6888, x: -9, z: -8, roofColor: 0x984E6E, windowColor: 0xF0D0DC, name: 'buildingGallery', roofStyle: 'flat', doorSide: '+x' },
];

buildings.forEach(b => island.add(createBuilding(b)));

// SIDEWALKS - L-shaped and winding paths, not simple X diagonals
// Each path goes from HQ area out to a corner building's door with turns

function createPathSegment(x1, z1, x2, z2, width, name) {
  const dx = x2 - x1, dz = z2 - z1;
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dx, dz);

  const swGroup = new THREE.Group();
  swGroup.name = name;

  const pathMat = new THREE.MeshStandardMaterial({ color: 0xDCD4C0, roughness: 0.62, metalness: 0.03 });
  const pathGeo = new THREE.BoxGeometry(width, 0.12, length, 1, 1, Math.max(2, Math.floor(length * 2)));
  const path = new THREE.Mesh(pathGeo, pathMat);
  path.name = name + '_surface';
  path.receiveShadow = true;
  swGroup.add(path);

  // Tile lines
  const tileMat = new THREE.MeshStandardMaterial({ color: 0xC8C0AE, roughness: 0.65, metalness: 0.02 });
  const tileCount = Math.max(1, Math.floor(length / 0.8));
  for (let i = 0; i <= tileCount; i++) {
    const tileGeo = new THREE.BoxGeometry(width + 0.02, 0.01, 0.04);
    const tile = new THREE.Mesh(tileGeo, tileMat);
    tile.name = `${name}_tile_${i}`;
    tile.position.y = 0.07;
    tile.position.z = -length / 2 + i * (length / tileCount);
    swGroup.add(tile);
  }

  swGroup.position.set((x1 + x2) / 2, 0.06, (z1 + z2) / 2);
  swGroup.rotation.y = angle;
  return swGroup;
}

function createCurbSegment(x1, z1, x2, z2, name) {
  const dx = x2 - x1, dz = z2 - z1;
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dx, dz);

  const curbGeo = new THREE.BoxGeometry(0.15, 0.18, length, 2, 2, 2);
  const positions = curbGeo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < positions.count; i++) {
    v.fromBufferAttribute(positions, i);
    if (v.y > 0.05) v.x *= 0.85;
    positions.setXYZ(i, v.x, v.y, v.z);
  }
  curbGeo.computeVertexNormals();
  const curbMat = new THREE.MeshStandardMaterial({ color: 0xC8C0B0, roughness: 0.58, metalness: 0.03 });
  const curb = new THREE.Mesh(curbGeo, curbMat);
  curb.name = name;
  curb.position.set((x1 + x2) / 2, 0.15, (z1 + z2) / 2);
  curb.rotation.y = angle;
  curb.castShadow = true;
  return curb;
}

// Path width
const PW = 1.1;
const curbOff = PW / 2 + 0.1;

// ====== PATH TO STUDIO (front-left) ======
// HQ front -> go forward (z+) -> turn left (x-) -> go left -> turn forward -> arrive at Studio door (+x side)
// Segment 1: HQ front, go z+ from z=1.3 to z=3.5
island.add(createPathSegment(0, 1.3, 0, 3.5, PW, 'pathStudio_s1'));
// Segment 2: turn corner, go x- from x=0 to x=-5
island.add(createPathSegment(0, 3.5, -5, 3.5, PW, 'pathStudio_s2'));
// Segment 3: go z+ from z=3.5 to z=8 (to studio door level)
island.add(createPathSegment(-5, 3.5, -5, 8, PW, 'pathStudio_s3'));
// Segment 4: short connector from path end to Studio door at x=-7.8, z=8
island.add(createPathSegment(-5, 8, -7.8, 8, PW, 'pathStudio_s4'));

// Corner fill patches (where path turns)
const cornerMat = new THREE.MeshStandardMaterial({ color: 0xDCD4C0, roughness: 0.62, metalness: 0.03 });
const corner1Geo = new THREE.BoxGeometry(PW, 0.12, PW);
const corner1 = new THREE.Mesh(corner1Geo, cornerMat);
corner1.name = 'pathStudio_corner1';
corner1.position.set(0, 0.06, 3.5);
corner1.receiveShadow = true;
island.add(corner1);

const corner2 = new THREE.Mesh(corner1Geo, cornerMat);
corner2.name = 'pathStudio_corner2';
corner2.position.set(-5, 0.06, 3.5);
corner2.receiveShadow = true;
island.add(corner2);

const corner3 = new THREE.Mesh(corner1Geo, cornerMat);
corner3.name = 'pathStudio_corner3';
corner3.position.set(-5, 0.06, 8);
corner3.receiveShadow = true;
island.add(corner3);

// ====== PATH TO LAB (front-right) ======
// From shared segment 1 (HQ front z+), split right at z=3.5
// Segment 2: go x+ from x=0 to x=4
island.add(createPathSegment(0, 3.5, 4, 3.5, PW, 'pathLab_s2'));
// Segment 3: go z+ from z=3.5 to z=8
island.add(createPathSegment(4, 3.5, 4, 8, PW, 'pathLab_s3'));
// Segment 4: go x+ from x=4 to Lab door at x=7.7, z=8
island.add(createPathSegment(4, 8, 7.7, 8, PW, 'pathLab_s4'));

const corner4 = new THREE.Mesh(corner1Geo, cornerMat);
corner4.name = 'pathLab_corner1';
corner4.position.set(4, 0.06, 3.5);
corner4.receiveShadow = true;
island.add(corner4);

const corner5 = new THREE.Mesh(corner1Geo, cornerMat);
corner5.name = 'pathLab_corner2';
corner5.position.set(4, 0.06, 8);
corner5.receiveShadow = true;
island.add(corner5);

// ====== PATH TO TOWER (back-right) ======
// HQ back -> go z- -> turn right (x+) -> go right -> turn z- -> arrive at Tower door (-x side)
// Segment 1: HQ back, go z- from z=-1.3 to z=-3.5
island.add(createPathSegment(0, -1.3, 0, -3.5, PW, 'pathTower_s1'));
// Segment 2: go x+ from x=0 to x=4
island.add(createPathSegment(0, -3.5, 4, -3.5, PW, 'pathTower_s2'));
// Segment 3: go z- from z=-3.5 to z=-8
island.add(createPathSegment(4, -3.5, 4, -8, PW, 'pathTower_s3'));
// Segment 4: go x+ from x=4 to Tower door at x=7.4, z=-8
island.add(createPathSegment(4, -8, 7.4, -8, PW, 'pathTower_s4'));

const corner6 = new THREE.Mesh(corner1Geo, cornerMat);
corner6.name = 'pathTower_corner1';
corner6.position.set(0, 0.06, -3.5);
corner6.receiveShadow = true;
island.add(corner6);

const corner7 = new THREE.Mesh(corner1Geo, cornerMat);
corner7.name = 'pathTower_corner2';
corner7.position.set(4, 0.06, -3.5);
corner7.receiveShadow = true;
island.add(corner7);

const corner8 = new THREE.Mesh(corner1Geo, cornerMat);
corner8.name = 'pathTower_corner3';
corner8.position.set(4, 0.06, -8);
corner8.receiveShadow = true;
island.add(corner8);

// ====== PATH TO GALLERY (back-left) ======
// From shared segment (HQ back z-), split left at z=-3.5
// Segment 2: go x- from x=0 to x=-5
island.add(createPathSegment(0, -3.5, -5, -3.5, PW, 'pathGallery_s2'));
// Segment 3: go z- from z=-3.5 to z=-8
island.add(createPathSegment(-5, -3.5, -5, -8, PW, 'pathGallery_s3'));
// Segment 4: go x- from x=-5 to Gallery door at x=-7.5, z=-8
island.add(createPathSegment(-5, -8, -7.5, -8, PW, 'pathGallery_s4'));

const corner9 = new THREE.Mesh(corner1Geo, cornerMat);
corner9.name = 'pathGallery_corner1';
corner9.position.set(-5, 0.06, -3.5);
corner9.receiveShadow = true;
island.add(corner9);

const corner10 = new THREE.Mesh(corner1Geo, cornerMat);
corner10.name = 'pathGallery_corner2';
corner10.position.set(-5, 0.06, -8);
corner10.receiveShadow = true;
island.add(corner10);

// Central plaza around HQ
const plazaGeo = new THREE.CylinderGeometry(3, 3, 0.12, 32);
const plazaMat = new THREE.MeshStandardMaterial({ color: 0xDED8C8, roughness: 0.55, metalness: 0.04 });
const plaza = new THREE.Mesh(plazaGeo, plazaMat);
plaza.name = 'centralPlaza';
plaza.position.set(0, 0.06, 0);
plaza.receiveShadow = true;
island.add(plaza);

for (let ring = 0; ring < 3; ring++) {
  const ringGeo = new THREE.TorusGeometry(0.8 + ring * 0.9, 0.02, 4, 32);
  const ringMat = new THREE.MeshStandardMaterial({ color: 0xC8C0B0, roughness: 0.55, metalness: 0.04 });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.name = `plazaRing_${ring}`;
  ringMesh.rotation.x = -Math.PI / 2;
  ringMesh.position.set(0, 0.13, 0);
  island.add(ringMesh);
}

// CURBS along path edges
// Studio path curbs
island.add(createCurbSegment(-curbOff, 1.3, -curbOff, 3.5, 'curbStudioA1'));
island.add(createCurbSegment(curbOff, 1.3, curbOff, 3.5, 'curbStudioA2'));
island.add(createCurbSegment(-5, 3.5 + curbOff, 0, 3.5 + curbOff, 'curbStudioB1'));
island.add(createCurbSegment(-5 - curbOff, 3.5, -5 - curbOff, 8, 'curbStudioC1'));
island.add(createCurbSegment(-5 + curbOff, 3.5 + curbOff, -5 + curbOff, 8, 'curbStudioC2'));
island.add(createCurbSegment(-7.8, 8 + curbOff, -5, 8 + curbOff, 'curbStudioD1'));
island.add(createCurbSegment(-7.8, 8 - curbOff, -5, 8 - curbOff, 'curbStudioD2'));

// Lab path curbs
island.add(createCurbSegment(0, 3.5 + curbOff, 4, 3.5 + curbOff, 'curbLabB1'));
island.add(createCurbSegment(4 - curbOff, 3.5 + curbOff, 4 - curbOff, 8, 'curbLabC1'));
island.add(createCurbSegment(4 + curbOff, 3.5, 4 + curbOff, 8, 'curbLabC2'));
island.add(createCurbSegment(4, 8 + curbOff, 7.2, 8 + curbOff, 'curbLabD1'));
island.add(createCurbSegment(4, 8 - curbOff, 7.2, 8 - curbOff, 'curbLabD2'));

// Tower path curbs
island.add(createCurbSegment(-curbOff, -1.3, -curbOff, -3.5, 'curbTowerA1'));
island.add(createCurbSegment(curbOff, -1.3, curbOff, -3.5, 'curbTowerA2'));
island.add(createCurbSegment(0, -3.5 - curbOff, 4, -3.5 - curbOff, 'curbTowerB1'));
island.add(createCurbSegment(4 - curbOff, -3.5 - curbOff, 4 - curbOff, -8, 'curbTowerC1'));
island.add(createCurbSegment(4 + curbOff, -3.5, 4 + curbOff, -8, 'curbTowerC2'));
island.add(createCurbSegment(4, -8 - curbOff, 7.4, -8 - curbOff, 'curbTowerD1'));
island.add(createCurbSegment(4, -8 + curbOff, 7.4, -8 + curbOff, 'curbTowerD2'));

// Gallery path curbs
island.add(createCurbSegment(-5, -3.5 - curbOff, 0, -3.5 - curbOff, 'curbGalleryB1'));
island.add(createCurbSegment(-5 - curbOff, -3.5, -5 - curbOff, -8, 'curbGalleryC1'));
island.add(createCurbSegment(-5 + curbOff, -3.5 - curbOff, -5 + curbOff, -8, 'curbGalleryC2'));
island.add(createCurbSegment(-7.5, -8 - curbOff, -5, -8 - curbOff, 'curbGalleryD1'));
island.add(createCurbSegment(-7.5, -8 + curbOff, -5, -8 + curbOff, 'curbGalleryD2'));

// HANDRAILS (yellow) - placed on path segments where skater would grind
function createHandrail(x1, z1, x2, z2, name) {
  const dx = x2 - x1, dz = z2 - z1;
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dx, dz);

  const hrGroup = new THREE.Group();
  hrGroup.name = name;

  const railMat = new THREE.MeshStandardMaterial({ color: 0xE0BC5C, roughness: 0.35, metalness: 0.45 });

  const barGeo = new THREE.CylinderGeometry(0.04, 0.04, length, 8);
  barGeo.rotateX(Math.PI / 2);
  const topBar = new THREE.Mesh(barGeo, railMat);
  topBar.name = name + '_topBar';
  topBar.position.y = 0.55;
  topBar.castShadow = true;
  hrGroup.add(topBar);

  const postCount = Math.max(2, Math.ceil(length / 1.0));
  for (let i = 0; i < postCount; i++) {
    const postGeo = new THREE.CylinderGeometry(0.035, 0.04, 0.55, 8);
    const post = new THREE.Mesh(postGeo, railMat);
    post.name = `${name}_post_${i}`;
    post.position.z = -length / 2 + i * length / (postCount - 1);
    post.position.y = 0.275;
    post.castShadow = true;
    hrGroup.add(post);
  }

  hrGroup.position.set((x1 + x2) / 2, 0.05, (z1 + z2) / 2);
  hrGroup.rotation.y = angle;
  return hrGroup;
}

// Rails along the long straight segments where the skater will grind
// Studio path: rail along the z+ segment (x=-5, z=4.5 to z=7)
island.add(createHandrail(-5 + curbOff + 0.15, 4.5, -5 + curbOff + 0.15, 7, 'handrailStudio'));
// Lab path: rail along z+ segment (x=4, z=4.5 to z=7)
island.add(createHandrail(4 - curbOff - 0.15, 4.5, 4 - curbOff - 0.15, 7, 'handrailLab'));
// Tower path: rail along z- segment (x=4, z=-4.5 to z=-7)
island.add(createHandrail(4 + curbOff + 0.15, -4.5, 4 + curbOff + 0.15, -7, 'handrailTower'));
// Gallery path: rail along z- segment (x=-5, z=-4.5 to z=-7)
island.add(createHandrail(-5 - curbOff - 0.15, -4.5, -5 - curbOff - 0.15, -7, 'handrailGallery'));

// GRINDING LEDGES - placed along the x-axis path segments
function createGrindLedge(x, z, length, angle, name) {
  const ledgeGroup = new THREE.Group();
  ledgeGroup.name = name;

  const ledgeMat = new THREE.MeshStandardMaterial({ color: 0xB0A898, roughness: 0.48, metalness: 0.12 });

  const shape = new THREE.Shape();
  const lw = 0.25, lh = 0.3;
  const lr = 0.06;
  shape.moveTo(-lw + lr, 0);
  shape.lineTo(lw - lr, 0);
  shape.quadraticCurveTo(lw, 0, lw, lr);
  shape.lineTo(lw, lh - lr);
  shape.quadraticCurveTo(lw, lh, lw - lr, lh);
  shape.lineTo(-lw + lr, lh);
  shape.quadraticCurveTo(-lw, lh, -lw, lh - lr);
  shape.lineTo(-lw, lr);
  shape.quadraticCurveTo(-lw, 0, -lw + lr, 0);

  const extrudeSettings = { steps: 1, depth: length, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3 };
  const ledgeGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const ledge = new THREE.Mesh(ledgeGeo, ledgeMat);
  ledge.name = name + '_body';
  ledge.position.z = -length / 2;
  ledge.castShadow = true;
  ledge.receiveShadow = true;
  ledgeGroup.add(ledge);

  const stripGeo = new THREE.BoxGeometry(0.48, 0.02, length + 0.06);
  const stripMat = new THREE.MeshStandardMaterial({ color: 0xD0CCBE, roughness: 0.22, metalness: 0.65 });
  const strip = new THREE.Mesh(stripGeo, stripMat);
  strip.name = name + '_strip';
  strip.position.y = 0.31;
  ledgeGroup.add(strip);

  ledgeGroup.position.set(x, 0.01, z);
  ledgeGroup.rotation.y = angle;
  return ledgeGroup;
}

// Grinding ledges on the horizontal (x-axis) segments of each path
// Studio path x-segment: along x from -1 to -4 at z=3.5
island.add(createGrindLedge(-2.5, 3.5 - curbOff - 0.3, 2.5, Math.PI / 2, 'grindLedgeStudio'));
// Lab path x-segment: along x from 1 to 3 at z=3.5
island.add(createGrindLedge(2, 3.5 - curbOff - 0.3, 2.5, Math.PI / 2, 'grindLedgeLab'));
// Tower path x-segment: along x from 1 to 3 at z=-3.5
island.add(createGrindLedge(2, -3.5 + curbOff + 0.3, 2.5, Math.PI / 2, 'grindLedgeTower'));
// Gallery path x-segment: along x from -1 to -4 at z=-3.5
island.add(createGrindLedge(-2.5, -3.5 + curbOff + 0.3, 2.5, Math.PI / 2, 'grindLedgeGallery'));

// Extra ledges near building entrances
island.add(createGrindLedge(-6.5, 8 + curbOff + 0.3, 1.8, Math.PI / 2, 'grindLedgeStudioDoor'));
island.add(createGrindLedge(5.5, 8 - curbOff - 0.3, 1.8, Math.PI / 2, 'grindLedgeLabDoor'));
island.add(createGrindLedge(5.5, -8 + curbOff + 0.3, 1.8, Math.PI / 2, 'grindLedgeTowerDoor'));
island.add(createGrindLedge(-6.5, -8 - curbOff - 0.3, 1.8, Math.PI / 2, 'grindLedgeGalleryDoor'));

// TREES - stacked cones with flatShading for illustrated/stylized look
function createTree(x, z, scale, name) {
  const treeGroup = new THREE.Group();
  treeGroup.name = name;

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x9A7E6A, roughness: 0.58, metalness: 0.02 });
  const trunkGeo = new THREE.CylinderGeometry(0.07 * scale, 0.11 * scale, 0.75 * scale, 6);
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.name = name + '_trunk';
  trunk.position.y = 0.38 * scale;
  trunk.castShadow = true;
  treeGroup.add(trunk);

  const leafMat = new THREE.MeshStandardMaterial({ color: 0x72B864, roughness: 0.58, metalness: 0.0, flatShading: true });

  const crown1Geo = new THREE.ConeGeometry(0.52 * scale, 1.05 * scale, 7);
  const crown1 = new THREE.Mesh(crown1Geo, leafMat);
  crown1.name = name + '_crown';
  crown1.position.y = 1.05 * scale;
  crown1.castShadow = true;
  treeGroup.add(crown1);

  const crown2Geo = new THREE.ConeGeometry(0.36 * scale, 0.74 * scale, 7);
  const crown2 = new THREE.Mesh(crown2Geo, leafMat);
  crown2.name = name + '_crown2';
  crown2.position.y = 1.55 * scale;
  crown2.castShadow = true;
  treeGroup.add(crown2);

  treeGroup.position.set(x, 0, z);
  return treeGroup;
}

// Trees: one near each building, on the far side from the path
island.add(createTree(1.8, -1.5, 1.2, 'treeHQ'));
island.add(createTree(-10.5, 9.5, 1.0, 'treeStudio'));
island.add(createTree(10.5, 9.5, 0.9, 'treeLab'));
island.add(createTree(10.5, -9.5, 1.1, 'treeTower'));
island.add(createTree(-10.5, -9.5, 1.0, 'treeGallery'));

// BUSHES - one per building, opposite side from the tree
function createBush(x, z, scale, name) {
  const bushGroup = new THREE.Group();
  bushGroup.name = name;
  const bushMat = new THREE.MeshStandardMaterial({ color: 0x68A860, roughness: 0.65, metalness: 0.0, flatShading: true });

  const b1 = new THREE.Mesh(new THREE.SphereGeometry(0.3 * scale, 10, 8), bushMat);
  b1.name = name + '_main';
  b1.position.set(0, 0.15 * scale, 0);
  b1.scale.y = 0.7;
  b1.castShadow = true;
  bushGroup.add(b1);

  const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.22 * scale, 8, 6), bushMat);
  b2.name = name + '_side';
  b2.position.set(0.2 * scale, 0.12 * scale, 0.15 * scale);
  b2.scale.y = 0.7;
  b2.castShadow = true;
  bushGroup.add(b2);

  bushGroup.position.set(x, 0, z);
  return bushGroup;
}

island.add(createBush(-1.8, 1.5, 1.2, 'bushHQ'));
island.add(createBush(-9, 10, 1.0, 'bushStudio'));
island.add(createBush(9, 10, 0.9, 'bushLab'));
island.add(createBush(9, -10, 1.0, 'bushTower'));
island.add(createBush(-9, -10, 1.0, 'bushGallery'));

// ====== SKATER HOUSE (right of HQ) ======
function createHouse(x, z, name) {
  const houseGroup = new THREE.Group();
  houseGroup.name = name;

  // Main house body
  const body = createRoundedBox(2.4, 1.8, 2.2, 0.2, 0xEDE0CE, 5, 0.40, 0.04);
  body.name = name + '_body';
  body.position.y = 0.9;
  body.castShadow = true;
  body.receiveShadow = true;
  houseGroup.add(body);

  // Pitched roof using a triangular prism shape
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-1.5, 0);
  roofShape.lineTo(0, 1.1);
  roofShape.lineTo(1.5, 0);
  roofShape.lineTo(-1.5, 0);
  const roofGeo = new THREE.ExtrudeGeometry(roofShape, {
    steps: 1, depth: 2.5, bevelEnabled: true,
    bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 3
  });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xC87458, roughness: 0.50, metalness: 0.04 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.name = name + '_roof';
  roof.position.set(0, 1.8, -1.25);
  roof.castShadow = true;
  houseGroup.add(roof);

  // Front door (faces -x toward HQ/plaza)
  const doorGeo2 = new THREE.BoxGeometry(0.1, 0.7, 0.45, 2, 3, 1);
  const dPositions2 = doorGeo2.attributes.position;
  for (let i = 0; i < dPositions2.count; i++) {
    const dv = new THREE.Vector3().fromBufferAttribute(dPositions2, i);
    if (dv.y > 0.2) {
      const dx2 = dv.z / 0.225;
      const excess = dv.y - 0.2;
      dv.y = 0.2 + excess * Math.sqrt(Math.max(0, 1 - dx2 * dx2 * 0.5));
    }
    dPositions2.setXYZ(i, dv.x, dv.y, dv.z);
  }
  doorGeo2.computeVertexNormals();
  const doorMat2 = new THREE.MeshStandardMaterial({ color: 0x6A4E3C, roughness: 0.62, metalness: 0.04 });
  const houseDoor = new THREE.Mesh(doorGeo2, doorMat2);
  houseDoor.name = name + '_door';
  houseDoor.position.set(-1.21, 0.35, 0);
  houseGroup.add(houseDoor);

  // Door step
  const houseStep = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.06, 0.65, 2, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0xD0C8B8, roughness: 0.55, metalness: 0.04 })
  );
  houseStep.name = name + '_doorStep';
  houseStep.position.set(-1.38, 0.03, 0);
  houseGroup.add(houseStep);

  // Windows on front face (-x)
  const wMat2 = new THREE.MeshStandardMaterial({ color: 0xC8E0F4, roughness: 0.12, metalness: 0.25, emissive: new THREE.Color(0xC8E0F4), emissiveIntensity: 0.06 });
  const winGeo2 = new THREE.BoxGeometry(0.08, 0.35, 0.4, 1, 2, 2);
  const winL = new THREE.Mesh(winGeo2, wMat2);
  winL.name = name + '_winL';
  winL.position.set(-1.21, 1.2, -0.6);
  houseGroup.add(winL);
  const winR = new THREE.Mesh(winGeo2, wMat2);
  winR.name = name + '_winR';
  winR.position.set(-1.21, 1.2, 0.6);
  houseGroup.add(winR);

  // Side windows (+z and -z)
  const sideWinGeo = new THREE.BoxGeometry(0.4, 0.35, 0.08, 2, 2, 1);
  const sideWin1 = new THREE.Mesh(sideWinGeo, wMat2);
  sideWin1.name = name + '_sideWin1';
  sideWin1.position.set(0, 1.2, 1.11);
  houseGroup.add(sideWin1);
  const sideWin2 = new THREE.Mesh(sideWinGeo, wMat2);
  sideWin2.name = name + '_sideWin2';
  sideWin2.position.set(0, 1.2, -1.11);
  houseGroup.add(sideWin2);

  // Back window (+x side, looking into backyard)
  const backWin = new THREE.Mesh(winGeo2, wMat2);
  backWin.name = name + '_backWin';
  backWin.position.set(1.21, 1.2, 0);
  backWin.rotation.y = Math.PI;
  houseGroup.add(backWin);

  // Chimney
  const chimney = createRoundedBox(0.35, 0.9, 0.35, 0.06, 0xB07858, 3, 0.50, 0.04);
  chimney.name = name + '_chimney';
  chimney.position.set(-0.5, 2.5, -0.5);
  chimney.castShadow = true;
  houseGroup.add(chimney);

  // Mailbox in front
  const mailPostGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6);
  const mailPostMat = new THREE.MeshStandardMaterial({ color: 0x8090A4, roughness: 0.42, metalness: 0.42 });
  const mailPost = new THREE.Mesh(mailPostGeo, mailPostMat);
  mailPost.name = name + '_mailPost';
  mailPost.position.set(-1.8, 0.3, -0.7);
  mailPost.castShadow = true;
  houseGroup.add(mailPost);
  const mailBoxGeo = new THREE.BoxGeometry(0.22, 0.18, 0.16, 2, 2, 2);
  const mailBoxMat = new THREE.MeshStandardMaterial({ color: 0x4870A0, roughness: 0.42, metalness: 0.08 });
  const mailBox = new THREE.Mesh(mailBoxGeo, mailBoxMat);
  mailBox.name = name + '_mailBox';
  mailBox.position.set(-1.8, 0.65, -0.7);
  mailBox.castShadow = true;
  houseGroup.add(mailBox);

  // === BACKYARD (behind house, +x side) ===

  // Backyard fence (wooden picket style)
  const fenceMat = new THREE.MeshStandardMaterial({ color: 0xD8D0C4, roughness: 0.60, metalness: 0.02 });
  const fenceRailMat = new THREE.MeshStandardMaterial({ color: 0xC8C0B4, roughness: 0.58, metalness: 0.02 });

  function addFenceSection(startX, startZ, endX, endZ, fenceName) {
    const fdx = endX - startX;
    const fdz = endZ - startZ;
    const fenceLen = Math.sqrt(fdx * fdx + fdz * fdz);
    const fenceAngle = Math.atan2(fdx, fdz);
    const fenceSection = new THREE.Group();
    fenceSection.name = fenceName;

    // Top rail
    const railGeo = new THREE.BoxGeometry(0.06, 0.06, fenceLen);
    const topRail = new THREE.Mesh(railGeo, fenceRailMat);
    topRail.name = fenceName + '_topRail';
    topRail.position.y = 0.55;
    fenceSection.add(topRail);
    // Bottom rail
    const botRail = new THREE.Mesh(railGeo, fenceRailMat);
    botRail.name = fenceName + '_botRail';
    botRail.position.y = 0.2;
    fenceSection.add(botRail);

    // Pickets
    const picketCount = Math.max(2, Math.floor(fenceLen / 0.25));
    for (let p = 0; p < picketCount; p++) {
      const picketGeo = new THREE.BoxGeometry(0.06, 0.65, 0.04, 1, 2, 1);
      const pPos = picketGeo.attributes.position;
      for (let pi = 0; pi < pPos.count; pi++) {
        const pv = new THREE.Vector3().fromBufferAttribute(pPos, pi);
        if (pv.y > 0.25) { pv.x *= (1 - (pv.y - 0.25) * 0.6); }
        pPos.setXYZ(pi, pv.x, pv.y, pv.z);
      }
      picketGeo.computeVertexNormals();
      const picket = new THREE.Mesh(picketGeo, fenceMat);
      picket.name = `${fenceName}_picket_${p}`;
      picket.position.set(0, 0.325, -fenceLen / 2 + p * (fenceLen / (picketCount - 1)));
      picket.castShadow = true;
      fenceSection.add(picket);
    }

    fenceSection.position.set((startX + endX) / 2, 0, (startZ + endZ) / 2);
    fenceSection.rotation.y = fenceAngle;
    return fenceSection;
  }

  // Fence around backyard: back side (+x), and two sides connecting to house corners
  // Right side fence (+z side of backyard)
  houseGroup.add(addFenceSection(1.2, 1.1, 3.2, 1.1, name + '_fenceRight'));
  // Left side fence (-z side of backyard)
  houseGroup.add(addFenceSection(1.2, -1.1, 3.2, -1.1, name + '_fenceLeft'));
  // Back fence (far +x end)
  houseGroup.add(addFenceSection(3.2, -1.1, 3.2, 1.1, name + '_fenceBack'));

  // Backyard trees
  function addBackyardTree(tx, tz, scale, treeName) {
    const tGroup = new THREE.Group();
    tGroup.name = treeName;
    const trunkMat2 = new THREE.MeshStandardMaterial({ color: 0x9A7E6A, roughness: 0.58, metalness: 0.02 });
    const trunkGeo2 = new THREE.CylinderGeometry(0.06 * scale, 0.09 * scale, 0.6 * scale, 6);
    const trunk2 = new THREE.Mesh(trunkGeo2, trunkMat2);
    trunk2.name = treeName + '_trunk';
    trunk2.position.y = 0.3 * scale;
    trunk2.castShadow = true;
    tGroup.add(trunk2);
    const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x72B864, roughness: 0.58, metalness: 0.0, flatShading: true });
    const crownGeo2 = new THREE.ConeGeometry(0.32 * scale, 0.7 * scale, 6);
    const crown3 = new THREE.Mesh(crownGeo2, leafMat2);
    crown3.name = treeName + '_crown';
    crown3.position.y = 0.72 * scale;
    crown3.castShadow = true;
    tGroup.add(crown3);
    tGroup.position.set(tx, 0, tz);
    return tGroup;
  }

  houseGroup.add(addBackyardTree(2.6, 0.7, 1.1, name + '_backyardTree1'));
  houseGroup.add(addBackyardTree(2.8, -0.6, 0.85, name + '_backyardTree2'));

  // Dog in backyard
  function createDog(dogName) {
    const dogGroup = new THREE.Group();
    dogGroup.name = dogName;

    const furMat = new THREE.MeshStandardMaterial({ color: 0xA0704B, roughness: 0.95 });
    const darkFurMat = new THREE.MeshStandardMaterial({ color: 0x7D5A3C, roughness: 0.95 });
    const noseMat = new THREE.MeshStandardMaterial({ color: 0x2E2E2E, roughness: 0.8 });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1A1A1A, roughness: 0.5 });

    // Body
    const bodyGeo = new THREE.CapsuleGeometry(0.12, 0.28, 6, 8);
    const dogBody = new THREE.Mesh(bodyGeo, furMat);
    dogBody.name = dogName + '_body';
    dogBody.rotation.z = Math.PI / 2;
    dogBody.position.y = 0.22;
    dogBody.castShadow = true;
    dogGroup.add(dogBody);

    // Head
    const headGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const head = new THREE.Mesh(headGeo, furMat);
    head.name = dogName + '_head';
    head.position.set(0.24, 0.3, 0);
    head.scale.set(1, 0.9, 0.85);
    head.castShadow = true;
    dogGroup.add(head);

    // Snout
    const snoutGeo = new THREE.SphereGeometry(0.055, 6, 6);
    const snout = new THREE.Mesh(snoutGeo, darkFurMat);
    snout.name = dogName + '_snout';
    snout.position.set(0.32, 0.27, 0);
    snout.scale.set(1.2, 0.8, 0.9);
    dogGroup.add(snout);

    // Nose
    const noseGeo = new THREE.SphereGeometry(0.02, 6, 6);
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.name = dogName + '_nose';
    nose.position.set(0.37, 0.28, 0);
    dogGroup.add(nose);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.018, 6, 6);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.name = dogName + '_eyeL';
    eyeL.position.set(0.3, 0.33, 0.06);
    dogGroup.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.name = dogName + '_eyeR';
    eyeR.position.set(0.3, 0.33, -0.06);
    dogGroup.add(eyeR);

    // Ears (floppy)
    const earGeo = new THREE.SphereGeometry(0.045, 6, 6);
    const earL = new THREE.Mesh(earGeo, darkFurMat);
    earL.name = dogName + '_earL';
    earL.position.set(0.2, 0.36, 0.08);
    earL.scale.set(0.6, 1, 0.7);
    earL.rotation.z = 0.3;
    dogGroup.add(earL);
    const earR = new THREE.Mesh(earGeo, darkFurMat);
    earR.name = dogName + '_earR';
    earR.position.set(0.2, 0.36, -0.08);
    earR.scale.set(0.6, 1, 0.7);
    earR.rotation.z = 0.3;
    dogGroup.add(earR);

    // Legs (4)
    const legGeo = new THREE.CylinderGeometry(0.03, 0.025, 0.15, 6);
    const legPositions = [
      { x: 0.12, z: 0.07 }, { x: 0.12, z: -0.07 },
      { x: -0.12, z: 0.07 }, { x: -0.12, z: -0.07 },
    ];
    legPositions.forEach((lp, li) => {
      const leg = new THREE.Mesh(legGeo, furMat);
      leg.name = `${dogName}_leg_${li}`;
      leg.position.set(lp.x, 0.075, lp.z);
      leg.castShadow = true;
      dogGroup.add(leg);
    });

    // Tail (curled up)
    const tailGeo = new THREE.CylinderGeometry(0.02, 0.015, 0.15, 6);
    const tail = new THREE.Mesh(tailGeo, furMat);
    tail.name = dogName + '_tail';
    tail.position.set(-0.2, 0.3, 0);
    tail.rotation.z = -0.8;
    dogGroup.add(tail);

    return dogGroup;
  }

  const dog = createDog(name + '_dog');
  dog.position.set(2.0, 0, 0.1);
  dog.rotation.y = -Math.PI / 4;
  houseGroup.add(dog);

  houseGroup.position.set(x, 0, z);
  return houseGroup;
}

// Place house at the far-right edge of the island
island.add(createHouse(9.0, 0, 'skaterHouse'));

// Sidewalk from house front door all the way to central plaza
// House moved to x=9.0, door at x=9.0-1.21=~7.8, connects west to plaza edge at ~x=3
island.add(createPathSegment(3, 0, 7.8, 0, PW * 0.85, 'pathHouse_s1'));

// Curbs along house sidewalk
island.add(createCurbSegment(3, 0 + curbOff * 0.75, 7.8, 0 + curbOff * 0.75, 'curbHouse1'));
island.add(createCurbSegment(3, 0 - curbOff * 0.75, 7.8, 0 - curbOff * 0.75, 'curbHouse2'));

// Street lamps at path corners
function createLamp(x, z, name) {
  const lampGroup = new THREE.Group();
  lampGroup.name = name;

  const poleMat = new THREE.MeshStandardMaterial({ color: 0x8090A4, roughness: 0.42, metalness: 0.45 });
  const poleGeo = new THREE.CylinderGeometry(0.04, 0.06, 1.8, 8);
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.name = name + '_pole';
  pole.position.y = 0.9;
  pole.castShadow = true;
  lampGroup.add(pole);

  const headMat = new THREE.MeshStandardMaterial({ color: 0xFFF4D0, roughness: 0.28, metalness: 0.1, emissive: new THREE.Color(0xFFE890), emissiveIntensity: 0.45 });
  const headGeo = new THREE.SphereGeometry(0.12, 10, 8);
  const head = new THREE.Mesh(headGeo, headMat);
  head.name = name + '_head';
  head.position.y = 1.85;
  lampGroup.add(head);

  lampGroup.position.set(x, 0, z);
  return lampGroup;
}

// Lamps at the turn corners of each path
island.add(createLamp(-5 - curbOff - 0.3, 3.5, 'lampStudioCorner'));
island.add(createLamp(4 + curbOff + 0.3, 3.5, 'lampLabCorner'));
island.add(createLamp(4 + curbOff + 0.3, -3.5, 'lampTowerCorner'));
island.add(createLamp(-5 - curbOff - 0.3, -3.5, 'lampGalleryCorner'));
// Lamps near building entrances
island.add(createLamp(-7.8, 8 + 1.3, 'lampStudioDoor'));
island.add(createLamp(7.2, 8 + 1.3, 'lampLabDoor'));
island.add(createLamp(7.4, -8 - 1.3, 'lampTowerDoor'));
island.add(createLamp(-7.5, -8 - 1.3, 'lampGalleryDoor'));

// Benches near the central plaza
function createBench(x, z, rotation, name) {
  const benchGroup = new THREE.Group();
  benchGroup.name = name;

  const woodMat = new THREE.MeshStandardMaterial({ color: 0xA08878, roughness: 0.60, metalness: 0.02 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x8090A4, roughness: 0.40, metalness: 0.48 });

  const seatGeo = new THREE.BoxGeometry(0.8, 0.06, 0.3, 2, 1, 1);
  const seat = new THREE.Mesh(seatGeo, woodMat);
  seat.name = name + '_seat';
  seat.position.y = 0.35;
  seat.castShadow = true;
  benchGroup.add(seat);

  for (let i = -1; i <= 1; i += 2) {
    const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.35, 6);
    const legF = new THREE.Mesh(legGeo, metalMat);
    legF.name = `${name}_leg_${i}_f`;
    legF.position.set(i * 0.3, 0.175, 0.1);
    benchGroup.add(legF);
    const legB = new THREE.Mesh(legGeo, metalMat);
    legB.name = `${name}_leg_${i}_b`;
    legB.position.set(i * 0.3, 0.175, -0.1);
    benchGroup.add(legB);
  }

  benchGroup.position.set(x, 0, z);
  benchGroup.rotation.y = rotation;
  return benchGroup;
}

island.add(createBench(-3.2, 0, -Math.PI / 2, 'bench2'));
island.add(createBench(0, 3.2, 0, 'bench3'));
island.add(createBench(0, -3.2, Math.PI, 'bench4'));

// Small floating clouds
function createCloud(x, y, z, scale, name) {
  const cloudGroup = new THREE.Group();
  cloudGroup.name = name;
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xF0EEF8, roughness: 0.9, metalness: 0.0, transparent: true, opacity: 0.78 });

  const puffs = [
    { px: 0, py: 0, pz: 0, s: 0.5 },
    { px: 0.35, py: 0.05, pz: 0.1, s: 0.4 },
    { px: -0.3, py: 0.08, pz: -0.05, s: 0.38 },
    { px: 0.15, py: 0.15, pz: -0.1, s: 0.3 },
    { px: -0.15, py: -0.05, pz: 0.15, s: 0.35 },
  ];

  puffs.forEach((p, i) => {
    const geo = new THREE.SphereGeometry(p.s * scale, 10, 8);
    const mesh = new THREE.Mesh(geo, cloudMat);
    mesh.name = `${name}_puff_${i}`;
    mesh.position.set(p.px * scale * 2, p.py * scale * 2, p.pz * scale * 2);
    cloudGroup.add(mesh);
  });

  cloudGroup.position.set(x, y, z);
  return cloudGroup;
}

const clouds = [
  { x: -12, y: 9, z: -7, s: 1.2, n: 'cloud1' },
  { x: 14, y: 11, z: -10, s: 1.0, n: 'cloud2' },
  { x: -7, y: 13, z: 7, s: 0.8, n: 'cloud3' },
  { x: 15, y: 8, z: 4, s: 0.9, n: 'cloud4' },
  { x: -14, y: 7, z: -3, s: 1.1, n: 'cloud5' },
];
clouds.forEach(c => scene.add(createCloud(c.x, c.y, c.z, c.s, c.n)));

// ====== WATER ======
// Lowpoly faceted water — island floats on it like the MV island-on-water reference
const waterMesh = (() => {
  const segments = 48;
  const geo = new THREE.PlaneGeometry(260, 260, segments, segments);
  geo.rotateX(-Math.PI / 2);

  // Pre-displace vertices for faceted polygon look; keep edges calmer
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const distFromIsland = Math.max(0, Math.sqrt(x * x + z * z) - 14);
    const strength = Math.min(1, distFromIsland / 20);
    pos.setY(i, (Math.random() - 0.5) * 1.6 * strength);
  }
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    color: 0x4AABBC,
    roughness: 0.06,
    metalness: 0.38,
    flatShading: true,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'water';
  mesh.position.y = -4.0;
  mesh.receiveShadow = false;
  scene.add(mesh);
  return mesh;
})();

// Dark shadow ring beneath island where it enters the water
{
  const foamGeo = new THREE.RingGeometry(10.2, 14.5, 52);
  foamGeo.rotateX(-Math.PI / 2);
  const foamMat = new THREE.MeshStandardMaterial({
    color: 0x1A6070,
    roughness: 0.95,
    transparent: true,
    opacity: 0.38,
  });
  const foam = new THREE.Mesh(foamGeo, foamMat);
  foam.name = 'waterFoam';
  foam.position.set(2, -3.92, 1);
  scene.add(foam);
}

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2.1;
controls.minDistance = 14;
controls.maxDistance = 50;
controls.target.set(1, -0.5, 0);
controls.enablePan = false;

// Logo overlay
const overlay = document.createElement('div');
overlay.id = 'logoOverlay';
overlay.innerHTML = `
  <div style="
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    pointer-events: none; user-select: none;
    text-align: center;
    padding-top: clamp(20px, 5vw, 36px);
  ">
    <div style="
      font-family: 'Solway', 'Satoshi', 'Inter', serif;
      font-size: clamp(32px, 7.5vw, 40px); font-weight: 700; color: #1a1a2e;
      letter-spacing: -0.5px; line-height: 1.1;
    ">Pofo Village</div>
    <div style="
      font-family: 'Satoshi', 'Inter', -apple-system, sans-serif;
      font-size: clamp(15px, 3.5vw, 16px); font-weight: 500; color: #1a1a2e;
      letter-spacing: 0.5px; margin-top: 4px; opacity: 0.6;
    ">recent projects by Mike Phelps</div>
  </div>
`;
document.body.appendChild(overlay);

// ===== CAMERA CONTROLS UI (bottom bar) =====
const controlsUIStyles = document.createElement('style');
controlsUIStyles.textContent = `
  #cameraControls {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 100;
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,255,255,0.88);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: 14px;
    padding: 6px 8px;
    box-shadow: 0 2px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04);
    border: 1px solid rgba(0,0,0,0.06);
    font-family: 'Satoshi', 'Inter', -apple-system, sans-serif;
    transition: opacity 0.4s ease;
  }
  #cameraControls.hidden {
    opacity: 0;
    pointer-events: none;
  }
  .cam-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: none;
    background: transparent;
    color: #444;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .cam-btn:hover {
    background: rgba(0,0,0,0.06);
    color: #111;
  }
  .cam-btn:active {
    background: rgba(0,0,0,0.10);
  }
  .cam-btn svg {
    width: 18px;
    height: 18px;
    stroke: currentColor;
    stroke-width: 2;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .cam-divider {
    width: 1px;
    height: 22px;
    background: rgba(0,0,0,0.1);
    margin: 0 2px;
  }
`;
document.head.appendChild(controlsUIStyles);

const cameraControlsEl = document.createElement('div');
cameraControlsEl.id = 'cameraControls';
cameraControlsEl.innerHTML = `
  <button class="cam-btn" id="camZoomIn" title="Zoom In">
    <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
  </button>
  <button class="cam-btn" id="camZoomOut" title="Zoom Out">
    <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
  </button>
  <div class="cam-divider"></div>
  <button class="cam-btn" id="camRotateLeft" title="Rotate Left">
    <svg viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
  </button>
  <button class="cam-btn" id="camRotateRight" title="Rotate Right">
    <svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/></svg>
  </button>
  <div class="cam-divider"></div>
  <button class="cam-btn" id="camReset" title="Reset View">
    <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  </button>
`;
document.body.appendChild(cameraControlsEl);

// Camera control handlers
const defaultCameraPos = window.innerWidth >= 1024
  ? new THREE.Vector3(7.65, 13.35, 26.6)
  : new THREE.Vector3(-18, 20, 26);
const defaultCameraTarget = new THREE.Vector3(1, -0.5, 0);

document.getElementById('camZoomIn').addEventListener('click', () => {
  if (overlayActive) return;
  const dir = new THREE.Vector3().subVectors(controls.target, camera.position).normalize();
  const newPos = camera.position.clone().add(dir.multiplyScalar(3));
  const dist = newPos.distanceTo(controls.target);
  if (dist >= controls.minDistance) {
    animateCamera(camera.position, newPos, controls.target, controls.target, 400, null);
  }
});

document.getElementById('camZoomOut').addEventListener('click', () => {
  if (overlayActive) return;
  const dir = new THREE.Vector3().subVectors(controls.target, camera.position).normalize();
  const newPos = camera.position.clone().add(dir.multiplyScalar(-3));
  const dist = newPos.distanceTo(controls.target);
  if (dist <= controls.maxDistance) {
    animateCamera(camera.position, newPos, controls.target, controls.target, 400, null);
  }
});

document.getElementById('camRotateLeft').addEventListener('click', () => {
  if (overlayActive) return;
  const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
  const angle = 0.35;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const nx = offset.x * cos + offset.z * sin;
  const nz = -offset.x * sin + offset.z * cos;
  const newPos = new THREE.Vector3(controls.target.x + nx, camera.position.y, controls.target.z + nz);
  animateCamera(camera.position, newPos, controls.target, controls.target, 500, null);
});

document.getElementById('camRotateRight').addEventListener('click', () => {
  if (overlayActive) return;
  const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
  const angle = -0.35;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const nx = offset.x * cos + offset.z * sin;
  const nz = -offset.x * sin + offset.z * cos;
  const newPos = new THREE.Vector3(controls.target.x + nx, camera.position.y, controls.target.z + nz);
  animateCamera(camera.position, newPos, controls.target, controls.target, 500, null);
});

document.getElementById('camReset').addEventListener('click', () => {
  if (overlayActive) return;
  animateCamera(camera.position, defaultCameraPos, controls.target, defaultCameraTarget, 800, null);
});

// ===== TOOLTIP SYSTEM FOR HQ (LinkedIn) =====
const tooltipStyles = document.createElement('style');
tooltipStyles.textContent = `
  .building-tooltip {
    position: fixed;
    pointer-events: auto;
    z-index: 200;
    transform: translate(-50%, -100%);
    transition: transform 0.15s ease;
  }
  .tooltip-inner {
    background: #ffffff;
    border-radius: 14px;
    padding: 10px 12px 8px 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06);
    cursor: pointer;
    position: relative;
    width: 56px;
    transition: box-shadow 0.25s ease;
  }
  .tooltip-inner:hover {
    box-shadow: 0 6px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08);
  }
  .tooltip-inner::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    width: 12px;
    height: 12px;
    background: #ffffff;
    border-radius: 0 0 3px 0;
    box-shadow: 2px 2px 4px rgba(0,0,0,0.06);
    z-index: -1;
  }
  .tooltip-logo {
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 1;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .tooltip-logo svg {
    width: 26px;
    height: 26px;
  }
  .tooltip-inner:hover .tooltip-logo {
    transform: scale(1.12) rotate(-3deg);
  }
  .tooltip-cta {
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 9px;
    font-weight: 600;
    color: #0A66C2;
    letter-spacing: 0.2px;
    margin-top: 0px;
    opacity: 0;
    max-height: 0;
    overflow: hidden;
    white-space: nowrap;
    transition: opacity 0.3s ease 0.05s, max-height 0.3s ease 0.05s, margin-top 0.3s ease 0.05s;
  }
  .tooltip-inner:hover .tooltip-cta {
    opacity: 1;
    max-height: 18px;
    margin-top: 5px;
  }
`;
document.head.appendChild(tooltipStyles);

const linkedinSVG = `<svg width="26" height="26" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_4069_1035)"><path d="M34 2.5V31.5C34 32.163 33.7366 32.7989 33.2678 33.2678C32.7989 33.7366 32.163 34 31.5 34H2.5C1.83696 34 1.20107 33.7366 0.732233 33.2678C0.263392 32.7989 0 32.163 0 31.5L0 2.5C0 1.83696 0.263392 1.20107 0.732233 0.732233C1.20107 0.263392 1.83696 0 2.5 0L31.5 0C32.163 0 32.7989 0.263392 33.2678 0.732233C33.7366 1.20107 34 1.83696 34 2.5ZM10 13H5V29H10V13ZM10.45 7.5C10.4526 7.12179 10.3807 6.74677 10.2384 6.39634C10.0961 6.04591 9.88621 5.72695 9.62063 5.45765C9.35505 5.18836 9.03903 4.97402 8.69062 4.82686C8.3422 4.67971 7.96821 4.60262 7.59 4.6H7.5C6.73087 4.6 5.99325 4.90553 5.44939 5.44939C4.90553 5.99325 4.6 6.73087 4.6 7.5C4.6 8.26913 4.90553 9.00675 5.44939 9.55061C5.99325 10.0945 6.73087 10.4 7.5 10.4C7.87824 10.4093 8.2546 10.344 8.60758 10.2078C8.96057 10.0716 9.28326 9.86717 9.55721 9.60622C9.83117 9.34527 10.051 9.03289 10.2042 8.68694C10.3574 8.34099 10.4409 7.96824 10.45 7.59V7.5ZM29 19.28C29 14.47 25.94 12.6 22.9 12.6C21.9046 12.5502 20.9136 12.7622 20.0258 13.2149C19.1379 13.6676 18.3843 14.3451 17.84 15.18H17.7V13H13V29H18V20.49C17.9277 19.6184 18.2023 18.7535 18.764 18.0832C19.3257 17.4129 20.1292 16.9913 21 16.91H21.19C22.78 16.91 23.96 17.91 23.96 20.43V29H28.96L29 19.28Z" fill="#0A66C2"/></g><defs><clipPath id="clip0_4069_1035"><rect width="34" height="34" fill="white"/></clipPath></defs></svg>`;

const visierSVG = `<svg width="26" height="26" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 0C26.3888 0 34 7.61116 34 17C34 26.3888 26.3888 34 17 34C7.61116 34 0 26.3888 0 17C0 7.61116 7.61116 0 17 0ZM22.3809 16.8643C22.097 16.7066 21.7599 16.6635 21.4434 16.7451C21.1269 16.8267 20.8573 17.0259 20.6934 17.2988L15.9434 25.2158C15.8351 25.3965 15.7783 25.6019 15.7783 25.8105C15.7784 26.019 15.8352 26.2237 15.9434 26.4043C16.0517 26.5851 16.2078 26.7353 16.3955 26.8398C16.5831 26.9443 16.7959 26.9997 17.0127 27C17.2297 27.0002 17.4429 26.9452 17.6309 26.8408C17.8189 26.7364 17.9755 26.5862 18.084 26.4053L22.834 18.4883C22.9977 18.2152 23.0418 17.8905 22.957 17.5859C22.8722 17.2813 22.6647 17.022 22.3809 16.8643ZM15.6279 18.3408C15.3441 18.1831 15.0061 18.14 14.6895 18.2217C14.3729 18.3034 14.1033 18.5032 13.9395 18.7764L13.0098 20.3252C12.9014 20.5059 12.8448 20.7113 12.8447 20.9199C12.8447 21.1286 12.9014 21.3339 13.0098 21.5146C13.1181 21.6954 13.2743 21.8457 13.4619 21.9502C13.6495 22.0546 13.8624 22.1101 14.0791 22.1104C14.2961 22.1105 14.5093 22.0554 14.6973 21.9512C14.8854 21.8467 15.0418 21.6957 15.1504 21.5146L16.0801 19.9658C16.2439 19.6927 16.2879 19.3681 16.2031 19.0635C16.1183 18.7589 15.9117 18.4986 15.6279 18.3408ZM14.2109 10.04C14.05 10.0196 13.8863 10.0289 13.7295 10.0693C13.5727 10.1097 13.4257 10.1803 13.2969 10.2754C13.1682 10.3704 13.0597 10.4888 12.9785 10.624L10.085 15.4492C9.9766 15.63 9.91896 15.8353 9.91895 16.0439C9.91893 16.2526 9.97566 16.4579 10.084 16.6387C10.1923 16.8194 10.3484 16.9697 10.5361 17.0742C10.7237 17.1786 10.9367 17.2331 11.1533 17.2334C11.3704 17.2337 11.5843 17.1795 11.7725 17.0752C11.9607 16.9708 12.117 16.8198 12.2256 16.6387L15.1191 11.8135C15.2003 11.6782 15.2532 11.5288 15.2744 11.374C15.2956 11.2193 15.2851 11.0619 15.2432 10.9111C15.2012 10.7604 15.1289 10.619 15.0303 10.4951C14.9315 10.3712 14.8075 10.2666 14.667 10.1885C14.5266 10.1105 14.3716 10.0605 14.2109 10.04ZM20.5117 10.1982C20.228 10.0407 19.8907 9.99848 19.5742 10.0801C19.2578 10.1617 18.9881 10.3608 18.8242 10.6338L16.4082 14.6611C16.2999 14.8419 16.2422 15.0472 16.2422 15.2559C16.2423 15.4644 16.3 15.669 16.4082 15.8496C16.5165 16.0303 16.6718 16.1807 16.8594 16.2852C17.0471 16.3896 17.2607 16.4451 17.4775 16.4453C17.6945 16.4455 17.9077 16.3905 18.0957 16.2861C18.2838 16.1817 18.4403 16.0316 18.5488 15.8506L20.9648 11.8232C21.1286 11.5501 21.1727 11.2255 21.0879 10.9209C21.0031 10.6162 20.7956 10.356 20.5117 10.1982ZM26.3818 10.1953C26.098 10.0376 25.76 9.9955 25.4434 10.0771C25.127 10.1589 24.8572 10.3578 24.6934 10.6309L23.1621 13.1836C23.0538 13.3643 22.9961 13.5697 22.9961 13.7783C22.9961 13.987 23.0538 14.1923 23.1621 14.373C23.2703 14.5535 23.426 14.7032 23.6133 14.8076C23.8009 14.9121 24.0146 14.9675 24.2314 14.9678C24.4485 14.9679 24.6616 14.913 24.8496 14.8086C25.0377 14.7042 25.1942 14.554 25.3027 14.373L26.834 11.8203C26.9978 11.5472 27.0418 11.2226 26.957 10.918C26.8722 10.6133 26.6657 10.353 26.3818 10.1953ZM8.25195 10C7.56088 10 7.00018 10.5391 7 11.2041C7 11.8693 7.56077 12.4092 8.25195 12.4092C8.94293 12.4089 9.50293 11.8691 9.50293 11.2041C9.50275 10.5392 8.94282 10.0002 8.25195 10Z" fill="#24A3A9"/></svg>`;

const tooltipEl = document.createElement('div');
tooltipEl.className = 'building-tooltip';
tooltipEl.id = 'tooltipHQ';
tooltipEl.innerHTML = `
  <div class="tooltip-inner" data-brand="linkedin">
    <div class="tooltip-logo">${linkedinSVG}</div>
    <div class="tooltip-cta" style="color: #0A66C2;">view work</div>
  </div>
`;
document.body.appendChild(tooltipEl);

const tooltipStudio = document.createElement('div');
tooltipStudio.className = 'building-tooltip';
tooltipStudio.id = 'tooltipStudio';
tooltipStudio.innerHTML = `
  <div class="tooltip-inner" data-brand="visier">
    <div class="tooltip-logo">${visierSVG}</div>
    <div class="tooltip-cta" style="color: #24A3A9;">view work</div>
  </div>
`;
document.body.appendChild(tooltipStudio);

const sharedBeginningsSVG = `<svg width="26" height="26" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="34" height="34" rx="8" fill="#3A4B42"/><path d="M7.96929 7.35226C11.1546 8.90159 13.9096 11.3168 15.8675 14.2658H15.868C16.9192 15.8487 17.7834 17.6686 18.0236 19.6488V19.6499C18.2972 21.9296 17.687 24.3077 16.3375 26.1722C14.9897 28.0344 12.9307 29.3667 10.6753 29.823C10.244 29.9103 9.82367 29.6312 9.73632 29.1999C9.64905 28.7686 9.92804 28.3482 10.3594 28.2609C12.22 27.8844 13.9321 26.7779 15.0467 25.2379C15.0728 25.2018 15.0976 25.1649 15.123 25.1284C14.9339 24.571 14.5507 23.9969 14.0896 23.4625C13.5692 22.8596 13.0102 22.3751 12.681 22.0929C12.0535 21.5555 11.408 21.0785 10.7174 20.5318C10.0442 19.999 9.35814 19.4217 8.74749 18.7435C6.12001 15.8255 5.3689 11.3819 6.88552 7.76108L7.21133 6.9834L7.96929 7.35226ZM8.06372 9.19556C7.20174 12.084 7.91186 15.4335 9.93191 17.6769C10.4514 18.2537 11.053 18.765 11.7062 19.282C12.3418 19.7851 13.0609 20.3197 13.7181 20.8825H13.7186C14.0556 21.1714 14.6925 21.7216 15.2963 22.4213C15.5436 22.7079 15.7955 23.0324 16.0231 23.3857C16.4335 22.256 16.5841 21.0296 16.4413 19.8398V19.8392C16.2411 18.1918 15.5112 16.6097 14.5404 15.1477C12.9036 12.6821 10.658 10.6205 8.06372 9.19556Z" fill="#C9DDD3"/><path d="M26.844 10.5973L27.5268 10.6118L27.617 11.2883C27.9086 13.473 27.5341 15.8858 26.6241 18.0384C25.7143 20.1901 24.2434 22.1412 22.2833 23.3447L22.2822 23.3452C21.9092 23.5735 21.5233 23.7717 21.1751 23.9537C20.8173 24.1408 20.4924 24.3146 20.1884 24.512C19.5791 24.9075 19.1338 25.3755 18.9656 25.8883L18.965 25.8894C18.7501 26.5408 19.1476 27.2361 20.0099 27.852H20.0094C21.2666 28.7475 22.8809 29.1258 24.4041 28.8797C24.8385 28.8097 25.2476 29.1052 25.3177 29.5396C25.3878 29.974 25.0922 30.3831 24.6578 30.4532C22.7195 30.7662 20.6816 30.2879 19.0838 29.1495L19.0833 29.149C18.1136 28.4563 16.881 27.1176 17.4512 25.3898C17.7828 24.3807 18.5745 23.6595 19.3209 23.175C19.695 22.9322 20.0809 22.7277 20.4369 22.5416C20.8024 22.3504 21.1332 22.1799 21.4501 21.9859C23.0643 20.9945 24.3443 19.3383 25.1564 17.4174C25.865 15.7412 26.1971 13.9085 26.1042 12.2247C24.2031 12.4437 22.4017 13.6816 21.1362 15.3292C19.7082 17.1884 18.8823 19.4525 18.0369 21.821C17.889 22.2354 17.4329 22.4518 17.0185 22.304C16.6041 22.156 16.3877 21.7 16.5355 21.2856C17.3674 18.9552 18.2665 16.4488 19.8719 14.3586C21.4841 12.2595 24.0149 10.5365 26.844 10.5973Z" fill="#C9DDD3"/><path d="M20.07 8.13876C20.07 6.61409 19.2204 5.28988 17.9694 4.60626C16.7159 5.28933 15.8704 6.61284 15.8704 8.13876C15.8704 9.66332 16.7201 10.9871 17.971 11.6707C19.2244 10.9877 20.07 9.66459 20.07 8.13876ZM21.6638 8.13876C21.6637 10.4479 20.2755 12.4229 18.2885 13.2884L17.9694 13.4274L17.6509 13.2884C15.6719 12.4234 14.2767 10.4492 14.2766 8.13876C14.2766 5.82953 15.6649 3.85415 17.6519 2.98865L17.971 2.84961L18.2895 2.98917C20.2685 3.85422 21.6638 5.82831 21.6638 8.13876Z" fill="#C9DDD3"/></svg>`;

const roboroSVG = `<svg width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_3128_1157)"><mask id="mask0_3128_1157" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32"><path d="M0 0H32V32H0V0Z" fill="white"/></mask><g mask="url(#mask0_3128_1157)"><path d="M29.0462 0H2.95385C1.32248 0 0 1.32248 0 2.95385V29.0462C0 30.6775 1.32248 32 2.95385 32H29.0462C30.6775 32 32 30.6775 32 29.0462V2.95385C32 1.32248 30.6775 0 29.0462 0Z" fill="#E60058"/><path d="M19.9163 14.0246C22.1433 14.0246 23.9485 12.2077 23.9485 9.96618C23.9485 7.7247 22.1433 5.90771 19.9163 5.90771C17.6892 5.90771 15.8839 7.7247 15.8839 9.96618C15.8839 12.2077 17.6892 14.0246 19.9163 14.0246ZM7.9035 9.96618C7.9035 12.2072 9.70929 14.0246 11.9357 14.0246V5.90771C9.70929 5.90771 7.9035 7.72519 7.9035 9.96618ZM11.9357 26.0753C14.1627 26.0753 15.9681 24.2584 15.9681 22.0169C15.9681 19.7755 14.1627 17.9584 11.9357 17.9584C9.70879 17.9584 7.9035 19.7755 7.9035 22.0169C7.9035 24.2584 9.70879 26.0753 11.9357 26.0753Z" fill="white"/></g></g><defs><clipPath id="clip0_3128_1157"><rect width="32" height="32" fill="white"/></clipPath></defs></svg>`;

const atlanticSVG = `<svg width="26" height="26" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M126.934 94.4167C127.236 94.6788 127.55 94.954 127.852 95.1768C130.409 97.1951 133.465 98.7547 136.966 99.8687C137.124 99.908 137.268 99.9473 137.425 100.026C139.523 93.5124 140.586 86.6843 140.586 79.7514C140.586 62.1766 133.753 45.6765 121.321 33.2523C108.889 20.8281 92.3786 14 74.7928 14C57.207 14 40.6965 20.8281 28.2644 33.2523C15.8324 45.6765 9 62.1766 9 79.7514C9 97.3261 15.8324 113.826 28.2644 126.25C40.6965 138.675 57.207 145.503 74.7928 145.503C86.8445 145.503 98.5553 142.266 108.732 136.093C105.716 134.376 102.817 132.436 100.195 130.339C99.3553 129.697 98.516 129.003 97.7554 128.321C96.9948 127.679 96.2341 126.945 95.4342 126.224C88.9166 129.121 81.9662 130.602 74.8059 130.602C46.7683 130.602 23.9237 107.811 23.9237 79.7514C23.9237 51.692 46.7289 28.9012 74.8059 28.9012C102.883 28.9012 125.688 51.692 125.688 79.7514C125.688 83.7093 125.229 87.6803 124.311 91.5727C125.032 92.5688 125.911 93.5124 126.986 94.4298H126.947L126.934 94.4167Z" fill="#5A3651"/><path d="M149.32 120.759C144.481 120.117 139.826 118.924 135.472 117.142C124.902 112.83 115.224 104.639 109.073 94.9934V79.7121C109.073 60.7744 93.7038 45.4407 74.7803 45.4407C55.8569 45.4407 40.4873 60.8006 40.4873 79.7121C40.4873 98.6237 55.8569 113.984 74.7803 113.984C82.6749 113.984 89.9532 111.31 95.7627 106.815C110.372 119.318 130.2 126.526 149.346 123.236C150.802 123.013 150.723 120.916 149.307 120.72V120.759H149.32ZM74.8066 95.9108C66.23 95.9108 59.2141 89.2007 58.6764 80.7737C58.6764 80.4329 58.637 80.0922 58.637 79.7383C58.637 79.3845 58.637 79.0568 58.6764 78.703C59.2141 70.276 66.23 63.5659 74.8066 63.5659C83.3831 63.5659 90.9761 70.8133 90.9761 79.7252C90.9761 88.6371 83.7241 95.8846 74.8066 95.8846V95.9108Z" fill="#212123"/></svg>`;

const tooltipTower = document.createElement('div');
tooltipTower.className = 'building-tooltip';
tooltipTower.id = 'tooltipTower';
tooltipTower.innerHTML = `
  <div class="tooltip-inner" data-brand="atlantic">
    <div class="tooltip-logo">${atlanticSVG}</div>
    <div class="tooltip-cta" style="color: #5A3651;">view work</div>
  </div>
`;
document.body.appendChild(tooltipTower);

const tooltipGallery = document.createElement('div');
tooltipGallery.className = 'building-tooltip';
tooltipGallery.id = 'tooltipGallery';
tooltipGallery.innerHTML = `
  <div class="tooltip-inner" data-brand="roboro">
    <div class="tooltip-logo">${roboroSVG}</div>
    <div class="tooltip-cta" style="color: #E60058;">view work</div>
  </div>
`;
document.body.appendChild(tooltipGallery);

const tooltipLab = document.createElement('div');
tooltipLab.className = 'building-tooltip';
tooltipLab.id = 'tooltipLab';
tooltipLab.innerHTML = `
  <div class="tooltip-inner" data-brand="sharedbeginnings">
    <div class="tooltip-logo">${sharedBeginningsSVG}</div>
    <div class="tooltip-cta" style="color: #3A4B42;">view work</div>
  </div>
`;
document.body.appendChild(tooltipLab);

// House tooltip (home icon)
const houseSVG = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 9.5L12 3L21 9.5V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9.5Z" fill="#E07A5F" stroke="#C0604A" stroke-width="1"/><path d="M9 22V12H15V22" fill="#F5EDE3" stroke="#C0604A" stroke-width="1"/></svg>`;

const tooltipHouse = document.createElement('div');
tooltipHouse.className = 'building-tooltip';
tooltipHouse.id = 'tooltipHouse';
tooltipHouse.innerHTML = `
  <div class="tooltip-inner" data-brand="house">
    <div class="tooltip-logo">${houseSVG}</div>
    <div class="tooltip-cta" style="color: #E07A5F;">about me</div>
  </div>
`;
document.body.appendChild(tooltipHouse);

// Tooltip position updater - always visible, tracks building
function updateTooltipForBuilding(buildingName, tooltipDom, yOffset) {
  const group = island.getObjectByName(buildingName);
  if (!group) return;

  const worldPos = new THREE.Vector3();
  group.getWorldPosition(worldPos);
  worldPos.y += yOffset;

  const screenPos = worldPos.clone().project(camera);
  const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;

  tooltipDom.style.left = x + 'px';
  tooltipDom.style.top = y + 'px';

  // Hide if behind camera
  tooltipDom.style.display = screenPos.z > 1 ? 'none' : '';
}

function updateTooltipPosition() {
  updateTooltipForBuilding('buildingHQ', tooltipEl, 5.8);
  updateTooltipForBuilding('buildingStudio', tooltipStudio, 4.5);
  updateTooltipForBuilding('buildingLab', tooltipLab, 3.5);
  updateTooltipForBuilding('buildingTower', tooltipTower, 6.5);
  updateTooltipForBuilding('buildingGallery', tooltipGallery, 3.5);
  updateTooltipForBuilding('skaterHouse', tooltipHouse, 4.2);
}

// ===== SKATER CHARACTER (cute bean-style, like the inspiration drawing) =====
function createSkater(name) {
  const skaterGroup = new THREE.Group();
  skaterGroup.name = name;
  skaterGroup.scale.setScalar(1.6);

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xF5EDE3, roughness: 0.85 });
  const outlineMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });
  const hatMat = new THREE.MeshStandardMaterial({ color: 0xFFCC00, roughness: 0.75 });
  const boardMat = new THREE.MeshStandardMaterial({ color: 0x8D6E63, roughness: 0.7 });
  const gripMat = new THREE.MeshStandardMaterial({ color: 0x2A2A2A, roughness: 0.95 });
  const truckMat = new THREE.MeshStandardMaterial({ color: 0xAAAAAA, roughness: 0.4, metalness: 0.5 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0xEEEEEE, roughness: 0.5, metalness: 0.2 });

  // === SKATEBOARD (big, chunky, very visible) ===
  // Board is built along Z-axis so its nose points forward (+Z = skater's forward)
  const boardGroup = new THREE.Group();
  boardGroup.name = name + '_boardGroup';

  // Deck — long axis is Z (forward/back), width is X (left/right)
  const boardGeo = new THREE.BoxGeometry(0.22, 0.045, 0.7, 2, 1, 6);
  const bPos = boardGeo.attributes.position;
  const bv = new THREE.Vector3();
  for (let i = 0; i < bPos.count; i++) {
    bv.fromBufferAttribute(bPos, i);
    // Kick nose/tail along Z
    if (Math.abs(bv.z) > 0.25) {
      bv.y += (Math.abs(bv.z) - 0.25) * 0.4;
    }
    // Slight concave across width (X)
    if (bv.y > 0) bv.y += Math.abs(bv.x) * 0.04;
    bPos.setXYZ(i, bv.x, bv.y, bv.z);
  }
  boardGeo.computeVertexNormals();
  const board = new THREE.Mesh(boardGeo, boardMat);
  board.name = name + '_board';
  board.castShadow = true;
  boardGroup.add(board);

  // Grip tape on top
  const gripGeo = new THREE.BoxGeometry(0.19, 0.005, 0.58);
  const grip = new THREE.Mesh(gripGeo, gripMat);
  grip.name = name + '_grip';
  grip.position.y = 0.025;
  boardGroup.add(grip);

  // Trucks (two metal axle bars) — positioned along Z
  const truckPositions = [0.2, -0.2];
  truckPositions.forEach((tz, ti) => {
    // Base plate
    const basePlateGeo = new THREE.BoxGeometry(0.12, 0.02, 0.1);
    const basePlate = new THREE.Mesh(basePlateGeo, truckMat);
    basePlate.name = `${name}_truckBase_${ti}`;
    basePlate.position.set(0, -0.03, tz);
    boardGroup.add(basePlate);
    // Axle — runs along X (side to side)
    const axleGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.24, 8);
    const axle = new THREE.Mesh(axleGeo, truckMat);
    axle.name = `${name}_axle_${ti}`;
    axle.position.set(0, -0.05, tz);
    axle.rotation.z = Math.PI / 2;
    boardGroup.add(axle);
  });

  // Wheels — wrapper group handles position + rolling (rotation.x), mesh child handles orientation
  const wheelGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.065, 14);
  const hubGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.01, 10);
  const hubMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.7 });
  const valveMat = new THREE.MeshStandardMaterial({ color: 0xff4400, roughness: 0.5 });
  const valveGeo = new THREE.SphereGeometry(0.013, 6, 6);
  const wheelSpots = [
    { x: 0.155, z: 0.2 }, { x: -0.155, z: 0.2 },
    { x: 0.155, z: -0.2 }, { x: -0.155, z: -0.2 },
  ];
  wheelSpots.forEach((wp, wi) => {
    const wheelWrapper = new THREE.Group();
    wheelWrapper.name = `${name}_wheel_${wi}`;
    wheelWrapper.position.set(wp.x, -0.05, wp.z);

    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheelWrapper.add(wheel);

    // Hub caps on each face
    [-0.037, 0.037].forEach(hx => {
      const hub = new THREE.Mesh(hubGeo, hubMat);
      hub.rotation.z = Math.PI / 2;
      hub.position.x = hx;
      wheelWrapper.add(hub);
    });

    // Valve dot — orbits visibly when rolling
    const valve = new THREE.Mesh(valveGeo, valveMat);
    valve.position.set(0, 0.075, 0);
    wheelWrapper.add(valve);

    boardGroup.add(wheelWrapper);
  });

  // y raised so larger wheels (r=0.08) still just touch the ground: 0.13 - 0.05 - 0.08 = 0
  boardGroup.position.y = 0.13;
  skaterGroup.add(boardGroup);

  // === BODY GROUP (the cute bean person) ===
  const bodyGroup = new THREE.Group();
  bodyGroup.name = name + '_bodyGroup';
  bodyGroup.position.y = 0.12;

  // Big round head (the dominant feature like the drawing)
  const headGeo = new THREE.SphereGeometry(0.16, 16, 14);
  const head = new THREE.Mesh(headGeo, bodyMat);
  head.name = name + '_head';
  head.position.set(0, 0.48, 0);
  head.castShadow = true;
  bodyGroup.add(head);

  // Head outline ring (thin dark stroke effect at bottom)
  const outlineRingGeo = new THREE.TorusGeometry(0.16, 0.008, 8, 24);
  const outlineRing = new THREE.Mesh(outlineRingGeo, outlineMat);
  outlineRing.name = name + '_headOutline';
  outlineRing.position.set(0, 0.42, 0);
  outlineRing.rotation.x = Math.PI / 2;
  bodyGroup.add(outlineRing);

  // Eyes — small dots like the drawing (face +Z forward)
  const eyeGeo = new THREE.SphereGeometry(0.02, 8, 8);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.name = name + '_leftEye';
  leftEye.position.set(0.06, 0.48, 0.12);
  bodyGroup.add(leftEye);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.name = name + '_rightEye';
  rightEye.position.set(-0.06, 0.48, 0.12);
  bodyGroup.add(rightEye);

  // Little mouth line (subtle, faces +Z)
  const mouthGeo = new THREE.BoxGeometry(0.04, 0.006, 0.003);
  const mouth = new THREE.Mesh(mouthGeo, outlineMat);
  mouth.name = name + '_mouth';
  mouth.position.set(0, 0.44, 0.155);
  bodyGroup.add(mouth);

  // Backwards cap
  const capTopGeo = new THREE.SphereGeometry(0.165, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.45);
  const capTop = new THREE.Mesh(capTopGeo, hatMat);
  capTop.name = name + '_capTop';
  capTop.position.set(0, 0.48, 0);
  capTop.castShadow = true;
  bodyGroup.add(capTop);

  // Cap brim (backward — points -Z since character faces +Z)
  const brimGeo = new THREE.BoxGeometry(0.22, 0.028, 0.12, 2, 1, 2);
  const bPos2 = brimGeo.attributes.position;
  for (let i = 0; i < bPos2.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(bPos2, i);
    const cx = Math.abs(v.x) / 0.11;
    if (cx > 0.8 && v.z < 0) v.z *= (1.3 - cx * 0.4);
    bPos2.setXYZ(i, v.x, v.y, v.z);
  }
  brimGeo.computeVertexNormals();
  const brim = new THREE.Mesh(brimGeo, hatMat);
  brim.name = name + '_capBrim';
  brim.position.set(0, 0.565, -0.17);
  brim.castShadow = true;
  bodyGroup.add(brim);

  // Cap button
  const capBtn = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), hatMat);
  capBtn.name = name + '_capBtn';
  capBtn.position.set(0, 0.645, 0);
  bodyGroup.add(capBtn);

  // Stubby torso (small, bean-like)
  const torsoGeo = new THREE.CapsuleGeometry(0.065, 0.1, 6, 8);
  const torso = new THREE.Mesh(torsoGeo, bodyMat);
  torso.name = name + '_torso';
  torso.position.set(0, 0.28, 0);
  torso.castShadow = true;
  bodyGroup.add(torso);

  // Stubby arms (short, round — like the drawing)
  const armGeo = new THREE.CapsuleGeometry(0.03, 0.09, 4, 6);
  const leftArm = new THREE.Mesh(armGeo, bodyMat);
  leftArm.name = name + '_leftArm';
  leftArm.position.set(0, 0.28, 0.11);
  leftArm.rotation.z = -0.3;
  leftArm.castShadow = true;
  bodyGroup.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, bodyMat);
  rightArm.name = name + '_rightArm';
  rightArm.position.set(0, 0.28, -0.11);
  rightArm.rotation.z = 0.3;
  rightArm.castShadow = true;
  bodyGroup.add(rightArm);

  // Stubby legs
  const legGeo = new THREE.CapsuleGeometry(0.035, 0.09, 4, 6);
  const leftLeg = new THREE.Mesh(legGeo, bodyMat);
  leftLeg.name = name + '_leftLeg';
  leftLeg.position.set(0, 0.12, 0.05);
  leftLeg.castShadow = true;
  bodyGroup.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, bodyMat);
  rightLeg.name = name + '_rightLeg';
  rightLeg.position.set(0, 0.12, -0.05);
  rightLeg.castShadow = true;
  bodyGroup.add(rightLeg);

  // Little feet/shoes
  const shoeGeo = new THREE.SphereGeometry(0.035, 8, 6);
  const leftShoe = new THREE.Mesh(shoeGeo, outlineMat);
  leftShoe.name = name + '_leftShoe';
  leftShoe.position.set(0.01, 0.04, 0.05);
  leftShoe.scale.set(1.2, 0.7, 1);
  leftShoe.castShadow = true;
  bodyGroup.add(leftShoe);

  const rightShoe = new THREE.Mesh(shoeGeo, outlineMat);
  rightShoe.name = name + '_rightShoe';
  rightShoe.position.set(0.01, 0.04, -0.05);
  rightShoe.scale.set(1.2, 0.7, 1);
  rightShoe.castShadow = true;
  bodyGroup.add(rightShoe);

  skaterGroup.add(bodyGroup);

  skaterGroup.position.set(7.8, 0, 0);
  skaterGroup.rotation.y = Math.PI; // face -Z initially (toward plaza)
  return skaterGroup;
}

const skater = createSkater('skater');
island.add(skater);

// ===== PATHFINDING NETWORK =====
// Nodes: each named location with island-local coordinates
const pathNodes = {
  house: { x: 7.8, z: 0 },
  plazaE: { x: 3, z: 0 },
  plazaNE: { x: 2, z: 2 },   // NE corner bypass around HQ building
  plazaSE: { x: 2, z: -2 },  // SE corner bypass around HQ building
  plazaN: { x: 0, z: 1.3 },
  plazaS: { x: 0, z: -1.3 },
  forkNE: { x: 0, z: 3.5 },
  forkNW_a: { x: -5, z: 3.5 },
  forkNE_a: { x: 4, z: 3.5 },
  studioJct: { x: -5, z: 8 },
  studioDoor: { x: -7.8, z: 8 },
  labJct: { x: 4, z: 8 },
  labDoor: { x: 7.7, z: 8 },
  forkSE: { x: 0, z: -3.5 },
  forkSW_a: { x: -5, z: -3.5 },
  forkSE_a: { x: 4, z: -3.5 },
  towerJct: { x: 4, z: -8 },
  towerDoor: { x: 7.4, z: -8 },
  galleryJct: { x: -5, z: -8 },
  galleryDoor: { x: -7.5, z: -8 },
};

const pathEdges = [
  ['house', 'plazaE'],
  ['plazaE', 'plazaNE'],
  ['plazaNE', 'plazaN'],
  ['plazaE', 'plazaSE'],
  ['plazaSE', 'plazaS'],
  ['plazaN', 'forkNE'],
  ['forkNE', 'forkNW_a'],
  ['forkNE', 'forkNE_a'],
  ['forkNW_a', 'studioJct'],
  ['studioJct', 'studioDoor'],
  ['forkNE_a', 'labJct'],
  ['labJct', 'labDoor'],
  ['plazaS', 'forkSE'],
  ['forkSE', 'forkSW_a'],
  ['forkSE', 'forkSE_a'],
  ['forkSE_a', 'towerJct'],
  ['towerJct', 'towerDoor'],
  ['forkSW_a', 'galleryJct'],
  ['galleryJct', 'galleryDoor'],
];

// Build adjacency list
const adjacency = {};
Object.keys(pathNodes).forEach(n => adjacency[n] = []);
pathEdges.forEach(([a, b]) => {
  adjacency[a].push(b);
  adjacency[b].push(a);
});

function distNodes(a, b) {
  const na = pathNodes[a], nb = pathNodes[b];
  return Math.sqrt((na.x - nb.x) ** 2 + (na.z - nb.z) ** 2);
}

function findPath(startNode, endNode) {
  // BFS shortest path
  const visited = new Set();
  const queue = [[startNode]];
  visited.add(startNode);
  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];
    if (current === endNode) return path;
    for (const neighbor of adjacency[current]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }
  return [startNode]; // fallback
}

// Building name -> door node
const buildingDoorNode = {
  buildingHQ: 'plazaN',
  buildingStudio: 'studioDoor',
  buildingLab: 'labDoor',
  buildingTower: 'towerDoor',
  buildingGallery: 'galleryDoor',
  skaterHouse: 'house',
};

// Closest node to skater's current position
function closestNode(x, z) {
  let bestNode = 'house';
  let bestDist = Infinity;
  for (const [name, pos] of Object.entries(pathNodes)) {
    const d = Math.sqrt((pos.x - x) ** 2 + (pos.z - z) ** 2);
    if (d < bestDist) { bestDist = d; bestNode = name; }
  }
  return bestNode;
}

// ===== SKATER ANIMATION STATE =====
let skaterState = 'idle'; // idle | skating | trick | entering | done
let skaterPath = []; // array of {x, z} waypoints
let skaterPathIndex = 0;
let skaterSpeed = 3.5; // much slower for visibility
let skaterTargetBuilding = null;
let skaterTrickTimer = 0;
let skaterTrickPhase = ''; // kickflip | heelflip | treflip
let skaterEnterTimer = 0;
let pendingBuildingKey = null;
let skaterCurrentNode = 'house';
let skaterDidTrick = false; // only one trick per journey
let skaterTrickWaypointIndex = -1; // which path segment to do the trick at

const flipTrickTypes = ['kickflip', 'heelflip', 'treflip'];

function startSkaterJourney(buildingKey) {
  if (skaterState !== 'idle' && skaterState !== 'done') return;

  const doorNode = buildingDoorNode[buildingKey];
  if (!doorNode) return;

  const sx = skater.position.x;
  const sz = skater.position.z;
  const startNode = closestNode(sx, sz);

  const nodePath = findPath(startNode, doorNode);
  skaterPath = nodePath.map(n => ({ x: pathNodes[n].x, z: pathNodes[n].z, node: n }));

  const firstNode = pathNodes[nodePath[0]];
  if (Math.abs(sx - firstNode.x) > 0.3 || Math.abs(sz - firstNode.z) > 0.3) {
    skaterPath.unshift({ x: sx, z: sz, node: startNode });
  }

  skaterPathIndex = 0;
  skaterTargetBuilding = buildingKey;
  skaterState = 'skating';
  skaterTrickPhase = '';
  skaterTrickTimer = 0;
  pendingBuildingKey = buildingKey;
  skaterDidTrick = false;

  // Pick a waypoint roughly in the middle of the path for the flip trick
  if (skaterPath.length >= 4) {
    skaterTrickWaypointIndex = Math.floor(skaterPath.length / 2);
  } else if (skaterPath.length >= 3) {
    skaterTrickWaypointIndex = 1;
  } else {
    skaterTrickWaypointIndex = -1; // too short, skip trick
  }
}

function updateSkater(delta) {
  if (skaterState === 'idle' || skaterState === 'done') {
    // Idle sway animation
    const bodyGroup = skater.getObjectByName('skater_bodyGroup');
    if (bodyGroup) bodyGroup.position.y = Math.sin(time * 3) * 0.005;
    // Spin wheels slowly
    for (let wi = 0; wi < 4; wi++) {
      const wheel = skater.getObjectByName(`skater_wheel_${wi}`);
      if (wheel) wheel.rotation.x += 0.01;
    }
    return;
  }

  const bodyGroup = skater.getObjectByName('skater_bodyGroup');
  const boardGroup = skater.getObjectByName('skater_boardGroup');
  const leftLeg = skater.getObjectByName('skater_leftLeg');
  const rightLeg = skater.getObjectByName('skater_rightLeg');
  const leftArm = skater.getObjectByName('skater_leftArm');
  const rightArm = skater.getObjectByName('skater_rightArm');

  if (skaterState === 'skating') {
    if (skaterPathIndex >= skaterPath.length - 1) {
      // Arrived at destination — go directly to entering, no trick at the door
      skaterState = 'entering';
      skaterEnterTimer = 0;
      skaterCurrentNode = skaterPath[skaterPath.length - 1].node || closestNode(skater.position.x, skater.position.z);
      // Reset pose
      if (leftLeg) leftLeg.rotation.x = 0;
      if (rightLeg) rightLeg.rotation.x = 0;
      if (leftArm) { leftArm.rotation.x = 0; leftArm.rotation.z = -0.3; }
      if (rightArm) { rightArm.rotation.x = 0; rightArm.rotation.z = 0.3; }
      if (bodyGroup) { bodyGroup.rotation.z = 0; bodyGroup.position.y = 0; }
      return;
    }

    // Check if we should do a mid-path flip trick
    if (!skaterDidTrick && skaterTrickWaypointIndex > 0 && skaterPathIndex === skaterTrickWaypointIndex) {
      skaterDidTrick = true;
      skaterState = 'trick';
      skaterTrickTimer = 0;
      skaterTrickPhase = flipTrickTypes[Math.floor(Math.random() * flipTrickTypes.length)];
      return;
    }

    const target = skaterPath[skaterPathIndex + 1];
    const dx = target.x - skater.position.x;
    const dz = target.z - skater.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.15) {
      skaterPathIndex++;
      return;
    }

    // Move toward target
    const moveSpeed = skaterSpeed * delta;
    const mx = (dx / dist) * Math.min(moveSpeed, dist);
    const mz = (dz / dist) * Math.min(moveSpeed, dist);
    skater.position.x += mx;
    skater.position.z += mz;

    // Face direction of movement
    const targetAngle = Math.atan2(dx, dz);
    let angleDiff = targetAngle - skater.rotation.y;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    skater.rotation.y += angleDiff * 0.12;

    // Push-kick animation (back foot pumps off ground)
    const pushCycle = Math.sin(time * 8);
    if (rightLeg) {
      // Right leg = push foot — extends back and returns
      rightLeg.rotation.x = pushCycle > 0 ? -pushCycle * 0.35 : 0;
      rightLeg.position.y = 0.12 - (pushCycle > 0 ? pushCycle * 0.02 : 0);
    }
    if (leftLeg) {
      // Left foot stays planted
      leftLeg.rotation.x = Math.sin(time * 8) * 0.05;
    }

    // Natural arm sway
    if (leftArm) {
      leftArm.rotation.x = Math.sin(time * 7) * 0.15;
      leftArm.rotation.z = -0.3 + Math.sin(time * 5) * 0.08;
    }
    if (rightArm) {
      rightArm.rotation.x = -Math.sin(time * 7) * 0.15;
      rightArm.rotation.z = 0.3 - Math.sin(time * 5) * 0.08;
    }

    // Slight body lean into turns
    if (bodyGroup) {
      bodyGroup.rotation.z = -angleDiff * 0.06;
      bodyGroup.position.y = Math.sin(time * 10) * 0.006;
    }

    // Spin wheels (rolling forward)
    for (let wi = 0; wi < 4; wi++) {
      const wheel = skater.getObjectByName(`skater_wheel_${wi}`);
      if (wheel) wheel.rotation.x += 0.25;
    }

    return;
  }

  if (skaterState === 'trick') {
    skaterTrickTimer += delta;
    const t = skaterTrickTimer;

    // All flip tricks share similar structure: jump, board spins, land
    const jumpDuration = 0.65;

    if (t < jumpDuration) {
      const nt = t / jumpDuration;
      const jumpH = Math.sin(nt * Math.PI) * 0.35;

      if (bodyGroup) bodyGroup.position.y = jumpH;
      if (boardGroup) {
        boardGroup.position.y = 0.13 + jumpH;
        if (skaterTrickPhase === 'kickflip') {
          // Flip around the board's long axis (Z) — rolls sideways (X rotation)
          boardGroup.rotation.x = nt * Math.PI * 2;
          boardGroup.rotation.y = 0;
          boardGroup.rotation.z = 0;
        } else if (skaterTrickPhase === 'heelflip') {
          boardGroup.rotation.x = -nt * Math.PI * 2;
          boardGroup.rotation.y = 0;
          boardGroup.rotation.z = 0;
        } else if (skaterTrickPhase === 'treflip') {
          // Kickflip + shuvit (board spins around Y while flipping)
          boardGroup.rotation.x = nt * Math.PI * 2;
          boardGroup.rotation.y = nt * Math.PI * 2;
          boardGroup.rotation.z = 0;
        }
      }
      // Tuck legs up
      if (leftLeg) leftLeg.rotation.x = -0.5 * Math.sin(nt * Math.PI);
      if (rightLeg) rightLeg.rotation.x = -0.5 * Math.sin(nt * Math.PI);
      // Arms out for balance
      if (leftArm) leftArm.rotation.z = -0.3 - 0.7 * Math.sin(nt * Math.PI);
      if (rightArm) rightArm.rotation.z = 0.3 + 0.7 * Math.sin(nt * Math.PI);

      // Continue forward momentum during trick
      const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(skater.quaternion);
      skater.position.x += fwd.x * delta * skaterSpeed * 0.5;
      skater.position.z += fwd.z * delta * skaterSpeed * 0.5;
    } else {
      // Land — reset everything
      if (bodyGroup) bodyGroup.position.y = 0;
      if (boardGroup) {
        boardGroup.position.y = 0.13;
        boardGroup.rotation.set(0, 0, 0);
      }
      if (leftLeg) { leftLeg.rotation.x = 0; leftLeg.position.y = 0.12; }
      if (rightLeg) { rightLeg.rotation.x = 0; rightLeg.position.y = 0.12; }
      if (leftArm) { leftArm.rotation.z = -0.3; leftArm.rotation.x = 0; }
      if (rightArm) { rightArm.rotation.z = 0.3; rightArm.rotation.x = 0; }

      // Landing bounce
      skaterState = 'skating';
      skaterTrickTimer = 0;
    }
    return;
  }

  if (skaterState === 'entering') {
    skaterEnterTimer += delta;

    const doorOpenDur  = 0.45;
    const walkDur      = 0.55;
    const doorCloseDur = 0.35;
    const totalDur     = doorOpenDur + walkDur + doorCloseDur;

    const doorPivot  = island.getObjectByName(skaterTargetBuilding + '_doorPivot');
    const openAngle  = doorPivot ? doorPivot.userData.openAngle : 0;
    const t          = skaterEnterTimer;

    // Entry direction from skater's current facing (atan2-style: sin/cos of rotation.y)
    const fwdX = Math.sin(skater.rotation.y);
    const fwdZ = Math.cos(skater.rotation.y);

    if (t < doorOpenDur) {
      // Phase 1: door swings open, skater stands still
      const nt = t / doorOpenDur;
      const eased = 1 - Math.pow(1 - nt, 3);
      if (doorPivot) doorPivot.rotation.y = eased * openAngle;

    } else if (t < doorOpenDur + walkDur) {
      // Phase 2: door fully open, skater walks through doorway
      if (doorPivot) doorPivot.rotation.y = openAngle;
      skater.position.x += fwdX * delta * 1.1;
      skater.position.z += fwdZ * delta * 1.1;

      // Spin wheels while walking in
      for (let wi = 0; wi < 4; wi++) {
        const wheel = skater.getObjectByName(`skater_wheel_${wi}`);
        if (wheel) wheel.rotation.x += delta * 6;
      }

      // Snap invisible once skater crosses the door plane into building
      const walkNt = (t - doorOpenDur) / walkDur;
      if (walkNt >= 0.65) skater.visible = false;

    } else if (t < totalDur) {
      // Phase 3: door swings closed
      skater.visible = false;
      const nt = (t - doorOpenDur - walkDur) / doorCloseDur;
      if (doorPivot) doorPivot.rotation.y = openAngle * (1 - Math.pow(nt, 2));

    } else {
      // Done — door fully closed, fire overlay
      if (doorPivot) doorPivot.rotation.y = 0;
      skater.visible = false;
      skaterState = 'done';
      triggerWipeTransition(pendingBuildingKey);
    }
  }
}

function resetSkater() {
  skater.visible = true;
  skater.scale.setScalar(1.6);
  skater.position.y = 0;
  skaterState = 'idle';
  cameraFollowMode = false;

  // Close any door that was left open
  if (skaterTargetBuilding) {
    const doorPivot = island.getObjectByName(skaterTargetBuilding + '_doorPivot');
    if (doorPivot) doorPivot.rotation.y = 0;
  }

  const bodyGroup = skater.getObjectByName('skater_bodyGroup');
  const boardGroup = skater.getObjectByName('skater_boardGroup');
  if (bodyGroup) { bodyGroup.position.y = 0; bodyGroup.rotation.z = 0; }
  if (boardGroup) { boardGroup.position.y = 0.13; boardGroup.rotation.set(0, 0, 0); }
}

// ===== WIPE TRANSITION =====
const wipeStyles = document.createElement('style');
wipeStyles.textContent = `
  #wipeOverlay {
    position: fixed;
    inset: 0;
    z-index: 450;
    background: #1a1824;
    pointer-events: none;
    transform: translateY(100%);
    transition: none;
  }
  #wipeOverlay.wipe-in {
    animation: wipeIn 0.45s cubic-bezier(0.65, 0, 0.35, 1) forwards;
  }
  #wipeOverlay.wipe-out {
    animation: wipeOut 0.4s cubic-bezier(0.65, 0, 0.35, 1) forwards;
  }
  @keyframes wipeIn {
    0% { transform: translateY(100%); }
    100% { transform: translateY(0%); }
  }
  @keyframes wipeOut {
    0% { transform: translateY(0%); }
    100% { transform: translateY(-100%); }
  }
`;
document.head.appendChild(wipeStyles);

const wipeEl = document.createElement('div');
wipeEl.id = 'wipeOverlay';
document.body.appendChild(wipeEl);

function triggerWipeTransition(buildingKey) {
  // Wipe in
  wipeEl.className = '';
  void wipeEl.offsetWidth; // reflow
  wipeEl.classList.add('wipe-in');

  setTimeout(() => {
    // While screen is covered, set up camera and overlay
    openWork(buildingKey);

    // Wipe out
    setTimeout(() => {
      wipeEl.classList.remove('wipe-in');
      void wipeEl.offsetWidth;
      wipeEl.classList.add('wipe-out');

      setTimeout(() => {
        wipeEl.className = '';
        wipeEl.style.transform = 'translateY(100%)';
      }, 450);
    }, 150);
  }, 480);
}

// Animate the dog's tail wagging
const dogTail = island.getObjectByName('skaterHouse_dog_tail');

// Raycaster for click/hover on buildings
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function getBuildingMeshes(...names) {
  const meshes = [];
  names.forEach(name => {
    const group = island.getObjectByName(name);
    if (group) {
      group.traverse((child) => {
        if (child.isMesh) meshes.push(child);
      });
    }
  });
  return meshes;
}

// ===== PORTFOLIO WORK OVERLAY SYSTEM =====
const brandData = {
  buildingHQ: {
    brand: 'LinkedIn',
    color: '#0A66C2',
    website: 'https://business.linkedin.com/hire',
    role: 'Senior UX Designer',
    period: '2025 – Present',
    bullets: [
      'Co-lead of LinkedIn brand web design system — owning strategy, token architecture, component design, sprint planning, weekly stand-ups, and office hours for team.',
      'Audited 25+ Hire page templates to surface reused content patterns that seeded the design system component library',
      'Delivered a Current State / Future State proposal identifying critical gaps in brand release processes and CMS build quality — secured org buy-in and shifted the team toward a design system–driven model',
      'Led a full CMS and design system audit, producing component blueprints and a prioritized build roadmap',
      'Only designer on the team doing hands-on engineering work — shipped color tokens, components, responsive typography, a custom Lottie Animation component, and carousel control variants using an AI-assisted Claude Code workflow',
      'Pioneered the AI design engineering workflow; first to install and configure Claude Code, Cursor, and MCP tooling; produced walkthrough videos that surfaced to marketing leadership and were featured in company town halls',
    ],
    visuals: [
      { img: 'assets/li-01.jpg', label: 'Design System - Custom Components' },
      { img: 'assets/li-02.jpg', label: 'Hire Pages - Redesign Top 25' },
      { img: 'assets/li-03.jpg', label: 'Custom Component - Comparison Tables' },
      { img: 'assets/li-04.jpg', label: 'Custom Component - Quote' },
    ],
  },
  buildingStudio: {
    brand: 'Visier',
    color: '#24A3A9',
    website: 'https://visier.com',
    role: 'Lead UI/UX Designer',
    period: '2021 – 2025',
    bullets: [
      'Built a scalable, component-based web design system that extended the brand and visual identity across multiple digital domains, inclusive of standards and guidelines',
      'Created a marketing-facing product UI library in collaboration with product UX to ensure clean, effective representation of key product features',
      'Led persona-based homepage redesign, reducing bounce/drop-off by ~25%',
      'Redesigned resource landing pages, contributing to 20% YoY growth in organic/direct conversionss',
      'Reduced request-to-launch time by ~50% through optimized asset creation workflows',
      'Produced high-impact motion and imagery to enhance user journey and conversions',
    ],
    visuals: [
      { img: 'assets/visier-01.jpg', label: 'Design System Components' },
      { img: 'assets/visier-02.jpg', label: 'Design System Cards' },
      { img: 'assets/visier-03.jpg', label: 'Custom Rive Animation Web Experiences' },
      { img: 'assets/visier-04.jpg', label: 'Blog Architecture & Design' },
      { img: 'assets/visier-05.jpg', label: 'Custom Proof Components' },
    ],
  },
  buildingLab: {
    brand: 'Shared Beginnings',
    color: '#3A4B42',
    website: 'https://sharedbeginnings.life',
    role: 'Brand / Web Design + Build: Freelance',
    period: '2025 – 2025',
    bullets: [
      'Designed the brand identity & comprehensive brand guide',
      'Full design for reimagined website & digital experience',
      'Built custom website in Frame including forms & interactive elementsr',
    ],
    visuals: [
      { img: 'assets/sb-01.jpg', label: 'Brand - Logo & Colors' },
      { img: 'assets/sb-02.jpg', label: 'Brand - Patterns & Icons' },
      { img: 'assets/sb-03.jpg', label: 'Web - Hero' },
      { img: 'assets/sb-04.jpg', label: 'Web Components w/ Custom Iconography' },
      { img: 'assets/sb-05.jpg', label: 'Web Components w/ Custom Imagery' },
      { img: 'assets/sb-06.jpg', label: 'Thoughtfully Responsive Web Experience' },
      { img: 'assets/sb-07.jpg', label: 'Custom Web UI' },
    ],
  },
  buildingTower: {
    brand: 'Atlantic Fertility',
    color: '#5A3651',
    website: 'https://atlanticfertility.com',
    role: 'Brand / Web Design + Build: Freelance',
    period: '2025 – 2026',
    bullets: [
      'Designed the brand identity & comprehensive brand guide',
      'Full design for reimagined website & digital experience',
      'Built custom website in Frame including forms & interactive elementsr',
    ],
    visuals: [
      { img: 'assets/atlantic-00.jpg', label: 'Brand Guide Preview' },
      { img: 'assets/atlantic-01.jpg', label: 'Web Design - Hero' },
      { img: 'assets/atlantic-02.jpg', label: 'Custom Web Components' },
      { img: 'assets/atlantic-03.jpg', label: 'Custom Web Components' },
      { img: 'assets/atlantic-04.jpg', label: 'Custom Web Components' },
    ],
  },
  buildingGallery: {
    brand: 'Roboro',
    color: '#E60058',
    website: 'https://roboro.ai',
    role: 'Lead Web & Product Designer: Freelance',
    period: '2024 – 2026',
    bullets: [
      'Built brand foundations and visual identity',
      'Designed and built Framer website with custom blog experience',
      'Designed SaaS product from ground up',
    ],
    visuals: [
      { img: 'assets/roboro-01.jpg', label: 'Design System - Web App' },
      { img: 'assets/roboro-02.jpg', label: 'Product Design - Bill Cards' },
      { img: 'assets/roboro-03.jpg', label: 'Product Design - Interactive w/ Filtering' },
      { img: 'assets/roboro-04.jpg', label: 'Web - Hero Design' },
      { img: 'assets/roboro-05.jpg', label: 'Web - Custom Iconography & Components' },
    ],
  },
  skaterHouse: {
    brand: 'About Me',
    color: '#E07A5F',
    resume: 'assets/Mike-Phelps-Resume-2026.pdf',
    role: 'Mike Phelps',
    period: 'Designer · Dreamer · Builder',
    bullets: [
      'This is a brand new portfolio experience, still in progress & made with Three.JS',
      'I also have a new Astro website focused on Nutrition Tools, screenshots below - see at: CaloricLab.com',
      '2 Fun Facts: I love writing/recording music and equally love tortilla chips.',
    ],
    visuals: [
      { img: 'assets/cl-01.jpg', label: 'Web - Home' },
      { img: 'assets/cl-02.jpg', label: 'Custom Food Log Web App' },
      { img: 'assets/cl-03.jpg', label: 'Custom Habit Tracker Web App' },
      { img: 'assets/cl-04.jpg', label: 'Web - Home CTAs' },
    ],
  },
};

// Build the overlay DOM
const overlayStyles = document.createElement('style');
overlayStyles.textContent = `
  #workOverlay {
    position: fixed;
    inset: 0;
    z-index: 500;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.5s ease;
  }
  #workOverlay.active {
    pointer-events: auto;
    opacity: 1;
  }
  #workScrim {
    position: fixed;
    inset: 0;
    background: rgba(192, 184, 212, 0.40);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 501;
    opacity: 0;
    transition: opacity 0.6s ease;
  }
  #workOverlay.active #workScrim {
    opacity: 1;
  }
  #workClose {
    position: fixed;
    top: 28px;
    left: 28px;
    z-index: 600;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #fff;
    border: 1px solid rgba(0,0,0,0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 18px;
    font-weight: 300;
    color: #333;
    opacity: 0;
    transform: scale(0.8) rotate(-90deg);
    transition: opacity 0.35s ease 0.3s, transform 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.3s, background 0.2s ease, box-shadow 0.2s ease;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  }
  #workOverlay.active #workClose {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
  #workClose:hover {
    background: #f5f5f5;
    box-shadow: 0 4px 20px rgba(0,0,0,0.12);
  }
  #workScroll {
    position: fixed;
    inset: 0;
    z-index: 550;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
  }
  #workScroll::-webkit-scrollbar {
    width: 4px;
  }
  #workScroll::-webkit-scrollbar-track {
    background: transparent;
  }
  #workScroll::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.15);
    border-radius: 4px;
  }
  #workContent {
    max-width: 960px;
    margin: 0 auto;
    padding: 120px 40px 100px;
    display: flex;
    flex-direction: column;
    gap: 48px;
    background: transparent;
  }
  /* ── Card shell ── */
  .work-card {
    background: #ffffff;
    border-radius: 20px;
    padding: 36px 40px;
    box-shadow: 0 2px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04);
  }

  .work-header {
    opacity: 0;
    transform: translateY(40px);
    transition: opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s;
  }
  #workOverlay.active .work-header {
    opacity: 1;
    transform: translateY(0);
  }
  .work-brand {
    font-family: 'Satoshi', 'Inter', -apple-system, sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    margin-bottom: 10px;
  }
  .work-role {
    font-family: 'Satoshi', 'Inter', -apple-system, sans-serif;
    font-size: 34px;
    font-weight: 700;
    color: #111;
    line-height: 1.15;
    letter-spacing: -0.5px;
  }
  .work-period {
    font-family: 'Satoshi', 'Inter', -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 400;
    color: #999;
    margin-top: 8px;
  }
  .work-website-btn {
    display: inline-flex;
    align-items: center;
    margin-top: 24px;
    padding: 10px 20px;
    border-radius: 100px;
    border: 1.5px solid var(--brand);
    color: var(--brand);
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.3px;
    text-decoration: none;
    background: transparent;
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  }
  .work-website-btn:hover {
    background: var(--brand);
    color: #fff;
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(0,0,0,0.12);
  }
  .work-divider {
    width: 48px;
    height: 3px;
    border-radius: 2px;
    margin-top: 22px;
    opacity: 0;
    transform: scaleX(0);
    transform-origin: left;
    transition: opacity 0.5s ease 0.35s, transform 0.5s ease 0.35s;
  }
  #workOverlay.active .work-divider {
    opacity: 1;
    transform: scaleX(1);
  }
  .work-bullets {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 13px;
  }
  .work-bullets li {
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 15px;
    font-weight: 400;
    color: #444;
    line-height: 1.65;
    padding-left: 20px;
    position: relative;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.4s ease, transform 0.4s ease;
  }
  #workOverlay.active .work-bullets li {
    opacity: 1;
    transform: translateY(0);
  }
  .work-bullets li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 10px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }
  .work-section {
    opacity: 0;
    transform: translateY(40px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  #workOverlay.active .work-section {
    opacity: 1;
    transform: translateY(0);
  }
  .work-section-title {
    font-family: 'Satoshi', 'Inter', -apple-system, sans-serif;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #bbb;
    margin-bottom: 18px;
  }
  .work-visuals-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 48px;
  }
  .work-visual-item {
    display: flex;
    flex-direction: column;
    opacity: 0;
    transform: translateY(30px) scale(0.96);
    transition: opacity 0.5s ease, transform 0.5s ease;
  }
  #workOverlay.active .work-visual-item {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  .work-visual-img {
    width: 100%;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 1px 6px rgba(0,0,0,0.05);
    transition: box-shadow 0.3s ease, transform 0.3s ease;
    cursor: default;
  }
  .work-visual-img:hover {
    box-shadow: 0 6px 24px rgba(0,0,0,0.09);
    transform: translateY(-2px);
  }
  .work-visual-img img {
    width: 100%;
    height: auto;
    object-fit: cover;
    display: block;
  }
  .work-visual-caption {
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #555;
    margin-top: 12px;
  }
  .work-back-hint {
    text-align: center;
    padding: 32px 0 16px;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.5s ease 0.6s, transform 0.5s ease 0.6s;
  }
  #workOverlay.active .work-back-hint {
    opacity: 1;
    transform: translateY(0);
  }
  .work-back-hint span {
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 12px;
    color: rgba(255,255,255,0.6);
    letter-spacing: 1px;
  }
`;
document.head.appendChild(overlayStyles);

const workOverlay = document.createElement('div');
workOverlay.id = 'workOverlay';
workOverlay.innerHTML = `
  <div id="workScrim"></div>
  <button id="workClose">✕</button>
  <div id="workScroll">
    <div id="workContent"></div>
  </div>
`;
document.body.appendChild(workOverlay);

function populateWork(buildingKey) {
  const data = brandData[buildingKey];
  if (!data) return;
  const content = document.getElementById('workContent');
  const bulletDelayStart = 0.4;
  const bulletsHtml = data.bullets.map((b, i) =>
    `<li style="transition-delay:${(bulletDelayStart + i * 0.08).toFixed(2)}s;"><style>.work-bullets li:nth-child(${i + 1})::before { background: ${data.color}; }</style>${b}</li>`
  ).join('');
  const visualsHtml = data.visuals.map((v, i) =>
    `<div class="work-visual-item" style="transition-delay:${(0.5 + i * 0.1).toFixed(2)}s;">
      <div class="work-visual-img"><img src="${v.img}" alt="${v.label}" /></div>
      <div class="work-visual-caption">${v.label}</div>
    </div>`
  ).join('');

  const btnHtml = data.resume
    ? `<a href="${data.resume}" target="_blank" rel="noopener noreferrer" class="work-website-btn" style="--brand:${data.color};">
        Download Resume ↓
      </a>`
    : `<a href="${data.website || '#'}" target="_blank" rel="noopener noreferrer" class="work-website-btn" style="--brand:${data.color};">
        View Website ↗
      </a>`;

  content.innerHTML = `
    <div class="work-card work-header">
      <div class="work-brand" style="color:${data.color};">${data.brand}</div>
      <div class="work-role">${data.role}</div>
      <div class="work-period">${data.period}</div>
      <div class="work-divider" style="background:${data.color};"></div>
      ${btnHtml}
    </div>
    <div class="work-card work-section" style="transition-delay: 0.3s;">
      <div class="work-section-title">What I Did</div>
      <ul class="work-bullets">${bulletsHtml}</ul>
    </div>
    <div class="work-card work-section" style="transition-delay: 0.45s;">
      <div class="work-section-title">Selected Work</div>
      <div class="work-visuals-grid">${visualsHtml}</div>
    </div>
  `;
}

// Camera animation state
let cameraAnim = null;
const savedCameraState = { pos: new THREE.Vector3(), target: new THREE.Vector3() };
const zoomedOutPos = new THREE.Vector3(-30, 34, 42);
const zoomedOutTarget = new THREE.Vector3(2, 0, 1);
let overlayActive = false;

// Follow-cam — tracks the skater during a journey
let cameraFollowMode = false;
const _followOffset = new THREE.Vector3(2.5, 6.5, 11); // same angle as default view, ~12 units from skater
const _skaterWP = new THREE.Vector3();

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function animateCamera(fromPos, toPos, fromTarget, toTarget, duration, onComplete) {
  const start = performance.now();
  cameraAnim = { fromPos: fromPos.clone(), toPos: toPos.clone(), fromTarget: fromTarget.clone(), toTarget: toTarget.clone(), duration, start, onComplete };
}

function openWork(buildingKey) {
  if (overlayActive) return;
  overlayActive = true;
  cameraFollowMode = false;

  // Save current camera only if not already saved
  if (!cameraStateSaved) {
    savedCameraState.pos.copy(camera.position);
    savedCameraState.target.copy(controls.target);
    cameraStateSaved = true;
  }

  // Populate content
  populateWork(buildingKey);

  // Disable controls
  controls.enabled = false;

  // Hide all tooltips, logo, camera controls
  document.querySelectorAll('.building-tooltip').forEach(t => t.style.opacity = '0');
  document.getElementById('logoOverlay').style.opacity = '0';
  document.getElementById('logoOverlay').style.transition = 'opacity 0.4s ease';
  document.getElementById('cameraControls').classList.add('hidden');

  // Camera zoom out and spin
  const spinTarget = new THREE.Vector3(-30, 34, 42);
  animateCamera(camera.position, spinTarget, controls.target, zoomedOutTarget, 1200, () => {
    // Show overlay
    workOverlay.classList.add('active');
    document.getElementById('workScroll').scrollTop = 0;
  });
}

let cameraStateSaved = false;

function closeWork() {
  if (!overlayActive) return;

  // Hide overlay first
  workOverlay.classList.remove('active');

  setTimeout(() => {
    // Zoom camera back
    animateCamera(camera.position, savedCameraState.pos, controls.target, savedCameraState.target, 1000, () => {
      controls.enabled = true;
      overlayActive = false;
      cameraStateSaved = false;

      // Show tooltips, logo, camera controls again
      document.querySelectorAll('.building-tooltip').forEach(t => t.style.opacity = '1');
      document.getElementById('logoOverlay').style.opacity = '1';
      document.getElementById('cameraControls').classList.remove('hidden');

      // Reset skater back to last door position
      resetSkater();
    });
  }, 400);
}

document.getElementById('workClose').addEventListener('click', closeWork);

// Click on buildings or tooltips — now triggers skater journey
function handleBuildingClick(buildingKey) {
  if (overlayActive) return;
  if (skaterState === 'skating' || skaterState === 'trick' || skaterState === 'entering') return;

  // Save camera before skater starts (used to restore after overlay closes)
  if (!cameraStateSaved) {
    savedCameraState.pos.copy(camera.position);
    savedCameraState.target.copy(controls.target);
    cameraStateSaved = true;
  }

  // Zoom camera in toward skater so the journey is visible
  cameraFollowMode = false;
  skater.getWorldPosition(_skaterWP);
  const followStartPos = _skaterWP.clone().add(_followOffset);
  animateCamera(camera.position, followStartPos, controls.target, _skaterWP.clone(), 900, () => {
    cameraFollowMode = true;
  });

  startSkaterJourney(buildingKey);
}

renderer.domElement.addEventListener('click', (event) => {
  if (overlayActive) return;
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const buildingNames = ['buildingHQ', 'buildingStudio', 'buildingLab', 'buildingTower', 'buildingGallery', 'skaterHouse'];
  const allBuildingMeshes = getBuildingMeshes(...buildingNames);
  const intersects = raycaster.intersectObjects(allBuildingMeshes, false);

  if (intersects.length > 0) {
    const hit = intersects[0].object;
    for (const bName of buildingNames) {
      const group = island.getObjectByName(bName);
      if (group) {
        let found = false;
        group.traverse(c => { if (c === hit) found = true; });
        if (found) { handleBuildingClick(bName); return; }
      }
    }
  }
});

// Tooltip click handlers
const tooltipBuildingMap = {
  'tooltipHQ': 'buildingHQ',
  'tooltipStudio': 'buildingStudio',
  'tooltipLab': 'buildingLab',
  'tooltipTower': 'buildingTower',
  'tooltipGallery': 'buildingGallery',
  'tooltipHouse': 'skaterHouse',
};
Object.entries(tooltipBuildingMap).forEach(([tooltipId, buildingKey]) => {
  const el = document.getElementById(tooltipId);
  if (el) {
    el.querySelector('.tooltip-inner').addEventListener('click', (e) => {
      e.stopPropagation();
      handleBuildingClick(buildingKey);
    });
  }
});

renderer.domElement.addEventListener('mousemove', (event) => {
  if (overlayActive) { renderer.domElement.style.cursor = 'default'; return; }
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const allBuildingMeshes = getBuildingMeshes('buildingHQ', 'buildingStudio', 'buildingLab', 'buildingTower', 'buildingGallery', 'skaterHouse');
  const intersects = raycaster.intersectObjects(allBuildingMeshes, false);

  renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
});

const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Solway:wght@700&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

// Load Satoshi font
const satoshiLink = document.createElement('link');
satoshiLink.href = 'https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap';
satoshiLink.rel = 'stylesheet';
document.head.appendChild(satoshiLink);

// Animation
let time = 0;
function animate() {
  time += 0.008;

  const delta = Math.min(0.033, 0.008 * 2); // approx frame delta
  island.position.y = Math.sin(time) * 0.12;
  island.rotation.y = Math.sin(time * 0.3) * 0.008;

  // Gently rise and fall the water — island appears to float on it
  if (waterMesh) waterMesh.position.y = -4.0 + Math.sin(time * 0.45) * 0.10;

  // Dog tail wag
  if (dogTail) {
    dogTail.rotation.z = -0.8 + Math.sin(time * 8) * 0.35;
  }

  // Update skater
  updateSkater(delta);

  // Camera animation tick
  if (cameraAnim) {
    const elapsed = performance.now() - cameraAnim.start;
    const t = Math.min(elapsed / cameraAnim.duration, 1);
    const e = easeInOutCubic(t);

    camera.position.lerpVectors(cameraAnim.fromPos, cameraAnim.toPos, e);
    controls.target.lerpVectors(cameraAnim.fromTarget, cameraAnim.toTarget, e);

    if (t >= 1) {
      const cb = cameraAnim.onComplete;
      cameraAnim = null;
      if (cb) cb();
    }
  }

  // Follow-cam: lerp position and target toward skater each frame
  if (cameraFollowMode && !cameraAnim && !overlayActive) {
    skater.getWorldPosition(_skaterWP);
    camera.position.lerp(_skaterWP.clone().add(_followOffset), Math.min(4.0 * delta, 0.15));
    controls.target.lerp(new THREE.Vector3(_skaterWP.x, _skaterWP.y + 0.5, _skaterWP.z), Math.min(5.0 * delta, 0.18));
  }

  // Slow auto-rotate when overlay is active
  if (overlayActive && !cameraAnim) {
    const angle = time * 0.15;
    const radius = 44;
    camera.position.x = Math.sin(angle) * radius;
    camera.position.z = Math.cos(angle) * radius;
    camera.position.y = 34;
    controls.target.copy(zoomedOutTarget);
  }

  // Always keep tooltip pinned to buildings
  updateTooltipPosition();

  scene.children.forEach(child => {
    if (child.name && child.name.startsWith('cloud')) {
      child.position.x += Math.sin(time + child.position.z) * 0.002;
      child.position.y += Math.cos(time * 0.7 + child.position.x) * 0.001;
    }
  });

  controls.update();
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});