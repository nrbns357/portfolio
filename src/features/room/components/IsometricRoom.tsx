import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import * as THREE from 'three';

interface IsometricRoomProps {
  scene?: THREE.Scene;
  camera?: THREE.Camera;
  renderer?: THREE.WebGLRenderer;
  onNavigate?: (path: string) => void;
}

// ─── Helpers ───
function createRoundedBox(w: number, h: number, d: number, r: number = 0.1) {
  const shape = new THREE.Shape();
  const hw = w / 2, hh = h / 2;
  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
  geo.translate(0, 0, -d / 2);
  return geo;
}

function createWoodTexture(base: string, grain: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = grain;
  for (let i = 0; i < 180; i++) {
    ctx.beginPath();
    const x = Math.random() * 512;
    ctx.globalAlpha = Math.random() * 0.12 + 0.04;
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + (Math.random() - 0.5) * 50, 170, x + (Math.random() - 0.5) * 50, 340, x + (Math.random() - 0.5) * 25, 512);
    ctx.lineWidth = Math.random() * 2.5 + 0.5;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createHexWallTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0c0e1a';
  ctx.fillRect(0, 0, 512, 512);

  const hexR = 22;
  const hexH = hexR * Math.sqrt(3);
  ctx.strokeStyle = '#1a1e38';
  ctx.lineWidth = 1.2;

  for (let row = -1; row < 16; row++) {
    for (let col = -1; col < 16; col++) {
      const x = col * hexR * 1.5;
      const y = row * hexH + (col % 2 === 0 ? 0 : hexH / 2);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + Math.PI / 6;
        const px = x + hexR * Math.cos(angle);
        const py = y + hexR * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createConcreteTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#1a1a1e';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle = `rgba(${150 + Math.random() * 60}, ${150 + Math.random() * 60}, ${150 + Math.random() * 60}, ${Math.random() * 0.06})`;
    ctx.fillRect(x, y, Math.random() * 3, Math.random() * 3);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createCodeScreenTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 320;
  const ctx = c.getContext('2d')!;
  // VS Code-like dark background
  ctx.fillStyle = '#1e1e2e';
  ctx.fillRect(0, 0, 512, 320);
  // Side bar
  ctx.fillStyle = '#181825';
  ctx.fillRect(0, 0, 40, 320);
  // Top bar
  ctx.fillStyle = '#11111b';
  ctx.fillRect(0, 0, 512, 22);
  // Tab
  ctx.fillStyle = '#1e1e2e';
  ctx.fillRect(42, 0, 80, 22);
  ctx.fillStyle = '#cdd6f4';
  ctx.font = '9px monospace';
  ctx.fillText('index.tsx', 50, 15);

  // Code lines
  const colors = ['#89b4fa', '#a6e3a1', '#f38ba8', '#cdd6f4', '#fab387', '#94e2d5', '#b4befe'];
  const keywords = ['const ', 'return ', 'import ', 'export ', 'function ', '  if (', '  const '];
  for (let i = 0; i < 22; i++) {
    const y = 30 + i * 13;
    ctx.fillStyle = '#45475a';
    ctx.font = '9px monospace';
    ctx.fillText(`${i + 1}`, 46, y);

    // Random code tokens
    let x = 66;
    const tokens = 2 + Math.floor(Math.random() * 4);
    if (i < keywords.length) {
      ctx.fillStyle = '#cba6f7';
      ctx.fillText(keywords[i], x, y);
      x += keywords[i].length * 5.5;
    }
    for (let t = 0; t < tokens; t++) {
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      const len = 3 + Math.floor(Math.random() * 8);
      const word = String.fromCharCode(...Array.from({ length: len }, () => 97 + Math.floor(Math.random() * 26)));
      ctx.fillText(word, x, y);
      x += len * 5.5 + 4;
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ─── Main Component ───
export const IsometricRoom = forwardRef((props: IsometricRoomProps, ref) => {
  const groupRef = useRef<THREE.Group>(new THREE.Group());
  const monitorScreenRef = useRef<THREE.Mesh | null>(null);
  const lpPlatterRef = useRef<THREE.Group>(new THREE.Group());
  const timeRef = useRef(0);
  const interactablesRef = useRef<THREE.Object3D[]>([]);
  const hoveredRef = useRef<THREE.Object3D | null>(null);

  useEffect(() => {
    const group = groupRef.current;
    group.clear();
    interactablesRef.current = [];

    // ─── TEXTURES & MATERIALS ───
    const walnutTex = createWoodTexture('#6B4226', '#2A1508');
    const hexTex = createHexWallTexture();
    const concreteTex = createConcreteTexture();
    const codeScreenTex = createCodeScreenTexture();

    const matteBlack = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 });
    const walnutMat = new THREE.MeshStandardMaterial({ map: walnutTex, roughness: 0.82, metalness: 0.05 });
    const metalChrome = new THREE.MeshStandardMaterial({ color: 0xbbbbbb, metalness: 0.9, roughness: 0.1 });
    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.3 });

    // ─── FLOOR ───
    const floorGeo = new THREE.PlaneGeometry(24, 24);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x141418, roughness: 0.6, metalness: 0.3 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    group.add(floor);

    // ─── LEFT WALL (Navy + Hex pattern) ───
    const leftWallGeo = new THREE.PlaneGeometry(24, 14);
    const leftWallMat = new THREE.MeshStandardMaterial({ map: hexTex, roughness: 0.85 });
    const leftWall = new THREE.Mesh(leftWallGeo, leftWallMat);
    leftWall.position.set(0, 7, -12);
    leftWall.receiveShadow = true;
    group.add(leftWall);

    // ─── RIGHT WALL (Concrete) ───
    const rightWallGeo = new THREE.PlaneGeometry(24, 14);
    const rightWallMat = new THREE.MeshStandardMaterial({ map: concreteTex, roughness: 0.95 });
    const rightWall = new THREE.Mesh(rightWallGeo, rightWallMat);
    rightWall.rotation.y = Math.PI / 2;
    rightWall.position.set(-12, 7, 0);
    rightWall.receiveShadow = true;
    group.add(rightWall);

    // ─── Neon strip on wall edge ───
    const neonStripGeo = new THREE.BoxGeometry(0.06, 13, 0.06);
    const neonStripMat = new THREE.MeshBasicMaterial({ color: 0xff44aa });
    const neonStrip = new THREE.Mesh(neonStripGeo, neonStripMat);
    neonStrip.position.set(-12, 7, -12);
    group.add(neonStrip);

    // ─── L-SHAPED DESK ───
    const deskGroup = new THREE.Group();
    deskGroup.position.set(-2, 0, -4);
    group.add(deskGroup);

    // Main desk top (long edge along left wall)
    const deskTop1 = new THREE.Mesh(new THREE.BoxGeometry(14, 0.18, 4.5), matteBlack);
    deskTop1.position.set(0, 3.5, 0);
    deskTop1.castShadow = true;
    deskTop1.receiveShadow = true;
    deskGroup.add(deskTop1);

    // L extension (along right wall)
    const deskTop2 = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.18, 6), matteBlack);
    deskTop2.position.set(-4.75, 3.5, 5.25);
    deskTop2.castShadow = true;
    deskGroup.add(deskTop2);

    // Desk legs (walnut)
    const legGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.5, 8);
    [
      [-6.8, -1.8], [6.8, -1.8], [6.8, 1.8], [-6.8, 1.8],
      [-6.8, 5.25 + 2.8], [-6.8, 5.25 - 2.8],
    ].forEach(([x, z]) => {
      const leg = new THREE.Mesh(legGeo, walnutMat);
      leg.position.set(x, 1.75, z);
      leg.castShadow = true;
      deskGroup.add(leg);
    });

    // Neon LED strip under desk
    const underGlow = new THREE.Mesh(
      new THREE.BoxGeometry(13, 0.04, 0.04),
      new THREE.MeshBasicMaterial({ color: 0xff44cc })
    );
    underGlow.position.set(0, 3.38, 2.1);
    deskGroup.add(underGlow);

    const underGlow2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.04, 5.5),
      new THREE.MeshBasicMaterial({ color: 0x8855ff })
    );
    underGlow2.position.set(-6.9, 3.38, 5.0);
    deskGroup.add(underGlow2);

    // ─── MOUSE PAD (large desk mat) ───
    const deskPad = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.03, 3),
      new THREE.MeshStandardMaterial({ color: 0x1a1a24, roughness: 0.95 })
    );
    deskPad.position.set(1, 3.6, 0);
    deskGroup.add(deskPad);

    // ─── KEYBOARD ───
    const keyboard = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 0.12, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 })
    );
    keyboard.position.set(0.5, 3.66, 0.5);
    deskGroup.add(keyboard);

    // Keycap rows
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 12; c++) {
        const key = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 0.06, 0.16),
          new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8 })
        );
        key.position.set(-0.7 + c * 0.21, 3.72, 0.2 + r * 0.19);
        deskGroup.add(key);
      }
    }

    // ─── MOUSE ───
    const mouse = new THREE.Mesh(
      createRoundedBox(0.4, 0.6, 0.2, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 })
    );
    mouse.rotation.x = Math.PI / 2;
    mouse.position.set(3.5, 3.65, 0.5);
    deskGroup.add(mouse);

    // ─── ULTRAWIDE MONITOR ───
    const monitorGroup = new THREE.Group();
    monitorGroup.position.set(1, 3.6, -1.2);
    deskGroup.add(monitorGroup);
    monitorGroup.userData = { interactable: true, path: '/projects' };
    interactablesRef.current.push(monitorGroup);

    // Stand
    const monitorStandPole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.2, 12), metalChrome);
    monitorStandPole.position.set(0, 1.1, 0);
    monitorGroup.add(monitorStandPole);
    const monitorStandBase = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.08, 24), darkMetal);
    monitorStandBase.position.set(0, 0, 0);
    monitorGroup.add(monitorStandBase);

    // Screen body
    const screenBody = new THREE.Mesh(
      new THREE.BoxGeometry(7.5, 3.2, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })
    );
    screenBody.position.set(0, 3.8, 0);
    screenBody.castShadow = true;
    monitorGroup.add(screenBody);

    // Screen display
    const screenDisplay = new THREE.Mesh(
      new THREE.PlaneGeometry(7.2, 3.0),
      new THREE.MeshStandardMaterial({ map: codeScreenTex, roughness: 0.3, emissive: 0x111122, emissiveIntensity: 0.8 })
    );
    screenDisplay.position.set(0, 3.8, 0.08);
    monitorScreenRef.current = screenDisplay;
    monitorGroup.add(screenDisplay);

    // ─── VERTICAL SUB MONITOR ───
    const subMonitor = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 3.8, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })
    );
    subMonitor.position.set(5.5, 5.5, -1.2);
    deskGroup.add(subMonitor);

    const subScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(3.5, 2.0),
      new THREE.MeshStandardMaterial({ map: codeScreenTex, roughness: 0.3, emissive: 0x111122, emissiveIntensity: 0.6 })
    );
    subScreen.rotation.y = -Math.PI / 2;
    subScreen.position.set(5.44, 5.5, -1.2);
    deskGroup.add(subScreen);

    // ─── DESK LAMP ───
    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.15, 16), darkMetal);
    lampBase.position.set(6, 3.6, -1.2);
    deskGroup.add(lampBase);
    const lampArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3, 8), metalChrome);
    lampArm.position.set(6, 5.1, -1.2);
    lampArm.rotation.z = 0.15;
    deskGroup.add(lampArm);
    const lampHead = new THREE.Mesh(
      new THREE.ConeGeometry(0.5, 0.8, 12),
      new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 })
    );
    lampHead.position.set(6.2, 6.5, -1.2);
    lampHead.rotation.z = Math.PI + 0.15;
    deskGroup.add(lampHead);

    // ─── CHAIR ───
    const chairGroup = new THREE.Group();
    chairGroup.position.set(0, 0, 3);
    group.add(chairGroup);

    // Seat
    const seat = new THREE.Mesh(createRoundedBox(2.5, 2.2, 0.3, 0.15), matteBlack);
    seat.rotation.x = Math.PI / 2;
    seat.position.set(0, 2.3, 0);
    chairGroup.add(seat);
    // Backrest
    const backrest = new THREE.Mesh(createRoundedBox(2.5, 3, 0.2, 0.15), matteBlack);
    backrest.position.set(0, 4.0, 1.1);
    backrest.rotation.x = 0.1;
    chairGroup.add(backrest);
    // Chair base star
    const chairPole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2, 8), metalChrome);
    chairPole.position.set(0, 1.1, 0);
    chairGroup.add(chairPole);
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 * i) / 5;
      const armGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6);
      const arm = new THREE.Mesh(armGeo, metalChrome);
      arm.rotation.z = Math.PI / 2;
      arm.rotation.y = angle;
      arm.position.set(Math.cos(angle) * 0.5, 0.15, Math.sin(angle) * 0.5);
      chairGroup.add(arm);
      // Wheel
      const wheel = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), darkMetal);
      wheel.position.set(Math.cos(angle) * 1.0, 0.08, Math.sin(angle) * 1.0);
      chairGroup.add(wheel);
    }

    // ─── LP STATION (desk right corner) ───
    const lpGroup = new THREE.Group();
    lpGroup.position.set(-5.5, 3.6, 1.5);
    deskGroup.add(lpGroup);
    lpGroup.userData = { interactable: true, path: '/LP' };
    interactablesRef.current.push(lpGroup);

    // LP Player body
    const lpBody = new THREE.Mesh(createRoundedBox(3, 2.2, 0.35, 0.08), walnutMat);
    lpBody.rotation.x = Math.PI / 2;
    lpBody.position.y = 0.2;
    lpBody.castShadow = true;
    lpGroup.add(lpBody);

    // LP Platter
    const platter = lpPlatterRef.current;
    platter.clear(); // Added clear() to fix Strict Mode remount missing/duplicate LP issue
    platter.position.set(-0.2, 0.4, -0.1);
    lpGroup.add(platter);

    const lpDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.85, 0.03, 32),
      new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.3, metalness: 0.8 })
    );
    platter.add(lpDisc);

    // LP grooves
    const grooveMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.2, metalness: 0.9, side: THREE.DoubleSide });
    const grooves = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.82, 48, 12), grooveMat);
    grooves.rotation.x = -Math.PI / 2;
    grooves.position.y = 0.02;
    platter.add(grooves);

    // Label
    const lpLabel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 0.035, 24),
      new THREE.MeshStandardMaterial({ color: 0xee4433, roughness: 0.8 })
    );
    lpLabel.position.y = 0.02;
    platter.add(lpLabel);

    // Tonearm
    const tonearm = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.5, 6), metalChrome);
    tonearm.rotation.z = Math.PI / 2;
    tonearm.position.set(0.8, 0.45, -0.7);
    tonearm.rotation.y = 0.4;
    lpGroup.add(tonearm);

    // ─── LP RACK (next to player) ───
    const rackGroup = new THREE.Group();
    rackGroup.position.set(-5.5, 3.6, 4);
    deskGroup.add(rackGroup);

    for (let i = 0; i < 5; i++) {
      const cover = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 1.5, 0.06),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color().setHSL(i * 0.15, 0.6, 0.3),
          roughness: 0.8
        })
      );
      cover.position.set(i * 0.12, 0.8, -i * 0.06);
      cover.rotation.y = -0.2;
      rackGroup.add(cover);
    }

    // ─── PLANT ───
    const potGeo = new THREE.CylinderGeometry(0.35, 0.28, 0.6, 12);
    const potMat = new THREE.MeshStandardMaterial({ color: 0xcc8855, roughness: 0.9 });
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.set(7.5, 3.6 + 0.3, -3);
    deskGroup.add(pot);

    // Soil
    const soil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.33, 0.33, 0.05, 12),
      new THREE.MeshStandardMaterial({ color: 0x3a2a15, roughness: 1 })
    );
    soil.position.set(7.5, 3.6 + 0.6, -3);
    deskGroup.add(soil);

    // Leaves (simple spheres)
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2d6a3f, roughness: 0.8 });
    [
      [0, 0.9, 0], [-0.15, 0.75, 0.12], [0.15, 0.8, -0.1], [0, 1.1, 0.05]
    ].forEach(([x, y, z]) => {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), leafMat);
      leaf.position.set(7.5 + x!, 3.6 + y!, -3 + z!);
      deskGroup.add(leaf);
    });

    // ─── WALL SHELVES ───
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x2a2a33, roughness: 0.8 });
    
    // Shelf 1 (on left wall)
    const shelf1 = new THREE.Mesh(new THREE.BoxGeometry(5, 0.15, 1.2), shelfMat);
    shelf1.position.set(3, 8, -11.4);
    shelf1.castShadow = true;
    group.add(shelf1);

    // Books on shelf
    const bookColors = [0x8b0000, 0x1a3a5c, 0x2d6a3f, 0x4a3060, 0xcc7722];
    for (let i = 0; i < 5; i++) {
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 1.0 + Math.random() * 0.5, 0.8),
        new THREE.MeshStandardMaterial({ color: bookColors[i], roughness: 0.9 })
      );
      book.position.set(1.5 + i * 0.45, 8.6 + (Math.random() * 0.2), -11.2);
      group.add(book);
    }

    // Figurines on shelf
    const figMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.6 });
    const fig = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8), figMat);
    fig.position.set(4.5, 8.5, -11.2);
    group.add(fig);
    const figHead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), figMat);
    figHead.position.set(4.5, 9.1, -11.2);
    group.add(figHead);

    // ─── BASS GUITAR on stand (leaning against right wall) ───
    const bassGroup = new THREE.Group();
    bassGroup.position.set(-10.5, 0, 4);
    bassGroup.rotation.y = 0.3;
    group.add(bassGroup);
    bassGroup.userData = { interactable: true, path: '/bass-guitar' };
    interactablesRef.current.push(bassGroup);

    // Guitar body
    const bodyShape = new THREE.Shape();
    bodyShape.ellipse(0, 0, 0.9, 1.3, 0, Math.PI * 2, false, 0);
    const guitarBody = new THREE.Mesh(
      new THREE.ExtrudeGeometry(bodyShape, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05 }),
      new THREE.MeshStandardMaterial({ color: 0x8B0000, roughness: 0.6, metalness: 0.2 })
    );
    guitarBody.position.set(0, 2.5, 0);
    guitarBody.rotation.x = 0.15;
    bassGroup.add(guitarBody);

    // Neck
    const neck = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 4.5, 0.15),
      walnutMat
    );
    neck.position.set(0, 5.5, 0.15);
    neck.rotation.x = 0.15;
    bassGroup.add(neck);

    // Headstock
    const headstock = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 1.2, 0.12),
      walnutMat
    );
    headstock.position.set(0, 8, 0.2);
    bassGroup.add(headstock);

    // Strings
    for (let i = 0; i < 4; i++) {
      const stringGeo = new THREE.CylinderGeometry(0.008, 0.008, 6, 4);
      const stringMesh = new THREE.Mesh(stringGeo, metalChrome);
      stringMesh.position.set(-0.1 + i * 0.065, 5, 0.28);
      stringMesh.rotation.x = 0.15;
      bassGroup.add(stringMesh);
    }

    // Guitar stand
    const standPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.5, 6), darkMetal);
    standPole.position.set(0, 1.75, 0.5);
    bassGroup.add(standPole);

    // ─── Neon shelf LED behind shelf ───
    const shelfNeon = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 0.04, 0.04),
      new THREE.MeshBasicMaterial({ color: 0x8855ff })
    );
    shelfNeon.position.set(3, 7.9, -11.8);
    group.add(shelfNeon);

    // Neon glow light behind shelf
    const shelfGlow = new THREE.PointLight(0x8855ff, 3, 6);
    shelfGlow.position.set(3, 8, -11.5);
    group.add(shelfGlow);

  }, []);

  // ─── SCENE MOUNT ───
  useEffect(() => {
    if (props.scene) {
      props.scene.add(groupRef.current);
    }
    return () => {
      if (props.scene) {
        props.scene.remove(groupRef.current);
      }
    };
  }, [props.scene]);

  // ─── RAYCASTING (Hover + Click) ───
  useEffect(() => {
    if (!props.camera || !props.renderer) return;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const domElement = props.renderer.domElement;
    let startX = 0, startY = 0;

    const getInteractable = (object: THREE.Object3D | null): THREE.Object3D | null => {
      let current = object;
      while (current) {
        if (current.userData?.interactable) return current;
        current = current.parent;
      }
      return null;
    };

    const handlePointerDown = (e: PointerEvent) => { startX = e.clientX; startY = e.clientY; };

    const handlePointerUp = (e: PointerEvent) => {
      if (Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5) return;
      const rect = domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, props.camera!);

      // Raycast against all children of the group
      const intersects = raycaster.intersectObjects(groupRef.current.children, true);
      if (intersects.length > 0) {
        const hit = getInteractable(intersects[0].object);
        if (hit && hit.userData.path && props.onNavigate) {
          props.onNavigate(hit.userData.path);
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, props.camera!);

      const intersects = raycaster.intersectObjects(groupRef.current.children, true);
      const hit = intersects.length > 0 ? getInteractable(intersects[0].object) : null;

      if (hit !== hoveredRef.current) {
        // Reset previous hover
        if (hoveredRef.current) {
          hoveredRef.current.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              const mat = mesh.material as THREE.MeshStandardMaterial;
              if (mat.emissive) mat.emissiveIntensity = mat.userData?.originalEmissive ?? 0;
            }
          });
        }
        // Apply new hover glow
        if (hit) {
          hit.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              const mat = mesh.material as THREE.MeshStandardMaterial;
              if (mat.emissive) {
                if (mat.userData?.originalEmissive === undefined) {
                  mat.userData = { ...(mat.userData || {}), originalEmissive: mat.emissiveIntensity };
                }
                mat.emissive.set(0x8855ff);
                mat.emissiveIntensity = 0.3;
              }
            }
          });
          domElement.style.cursor = 'pointer';
        } else {
          domElement.style.cursor = 'default';
        }
        hoveredRef.current = hit;
      }
    };

    domElement.addEventListener('pointerdown', handlePointerDown);
    domElement.addEventListener('pointerup', handlePointerUp);
    domElement.addEventListener('pointermove', handlePointerMove);
    return () => {
      domElement.removeEventListener('pointerdown', handlePointerDown);
      domElement.removeEventListener('pointerup', handlePointerUp);
      domElement.removeEventListener('pointermove', handlePointerMove);
    };
  }, [props.camera, props.renderer, props.onNavigate]);

  // ─── ANIMATION ───
  useImperativeHandle(ref, () => ({
    update(delta: number) {
      timeRef.current += delta;
      // LP spin
      lpPlatterRef.current.rotation.y -= delta * 0.8;

      // Monitor screen subtle flicker
      if (monitorScreenRef.current) {
        const mat = monitorScreenRef.current.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 0.8 + Math.sin(timeRef.current * 4) * 0.05;
      }
    }
  }));

  return null;
});
