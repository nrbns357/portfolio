import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import * as THREE from 'three';

interface TurntableModelProps {
  isPlaying: boolean;
  needleDown: boolean;
  labelTextureUrl?: string;
  scene?: THREE.Scene;
}

// Helper: create a rounded box shape using ExtrudeGeometry
function createRoundedBoxGeo(w: number, h: number, d: number, r: number, segs: number = 4) {
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

  const extrudeSettings = { depth: d, bevelEnabled: false, curveSegments: segs };
  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  // Center depth
  geo.translate(0, 0, -d / 2);
  return geo;
}

export const TurntableModel = forwardRef((props: TurntableModelProps, ref) => {
  const groupRef = useRef<THREE.Group>(new THREE.Group());
  const platterRef = useRef<THREE.Group>(new THREE.Group());
  const armRef = useRef<THREE.Group>(new THREE.Group());
  const dustCoverRef = useRef<THREE.Group>(new THREE.Group());
  const labelMatRef = useRef<THREE.MeshStandardMaterial>(new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.9 }));

  // Dynamic texture loading for the Vinyl Label
  useEffect(() => {
    if (props.labelTextureUrl) {
      new THREE.TextureLoader().load(props.labelTextureUrl, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        labelMatRef.current.map = texture;
        labelMatRef.current.needsUpdate = true;
      });
    } else {
      labelMatRef.current.map = null;
      labelMatRef.current.needsUpdate = true;
    }
  }, [props.labelTextureUrl]);

  useEffect(() => {
    const group = groupRef.current;
    group.clear();

    // ============ MATERIALS ============
    // Walnut wood - warm brown like the reference photo  
    const walnutMat = new THREE.MeshStandardMaterial({ color: 0x8B5E3C, roughness: 0.75, metalness: 0.0 });
    const walnutDarkMat = new THREE.MeshStandardMaterial({ color: 0x6B4226, roughness: 0.8 });
    const darkWoodShelfMat = new THREE.MeshStandardMaterial({ color: 0x110804, roughness: 0.95 });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
    const blackPlateMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.95 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0xd0d0d0, metalness: 0.85, roughness: 0.15 });
    const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7, roughness: 0.3 });
    const vinylMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.15, metalness: 0.9 });
    const glassMat = new THREE.MeshStandardMaterial({ 
      color: 0xffffff, transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide 
    });
    const speakerClothMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 1.0 });

    const baseGroup = new THREE.Group();
    group.add(baseGroup);

    // ============ 1. MAIN BODY ============
    // Rounded rectangular walnut body – use extruded rounded rect
    const bodyGeo = createRoundedBoxGeo(12.5, 8.5, 1.2, 0.3);
    const body = new THREE.Mesh(bodyGeo, walnutMat);
    body.rotation.x = Math.PI / 2; // lay flat
    body.position.y = -0.6;
    body.castShadow = true;
    body.receiveShadow = true;
    baseGroup.add(body);

    // Top plate – flat black surface recessed into the wood body
    const topPlate = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.08, 7.8), blackPlateMat);
    topPlate.position.y = 0.02;
    topPlate.receiveShadow = true;
    baseGroup.add(topPlate);

    // Front Panel – darker strip along front edge with controls  
    const frontPanel = new THREE.Mesh(new THREE.BoxGeometry(12.5, 0.6, 0.15), walnutDarkMat);
    frontPanel.position.set(0, -0.4, 4.35);
    baseGroup.add(frontPanel);

    // Small rubber feet  
    const footGeo = new THREE.CylinderGeometry(0.25, 0.2, 0.15, 16);
    const footMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });
    [[-5.5, -3.8], [5.5, -3.8], [-5.5, 3.8], [5.5, 3.8]].forEach(([x, z]) => {
      const foot = new THREE.Mesh(footGeo, footMat);
      foot.position.set(x, -1.25, z);
      baseGroup.add(foot);
    });

    // Front panel buttons/knobs
    // Power button (small square)
    const pwrBtn = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.1), blackMat);
    pwrBtn.position.set(-4.5, -0.35, 4.44);
    baseGroup.add(pwrBtn);
    // Volume knob
    const volKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 16), darkMetalMat);
    volKnob.rotation.x = Math.PI / 2;
    volKnob.position.set(-3.5, -0.35, 4.44);
    baseGroup.add(volKnob);
    // Speed select (33/45)
    const speedSel = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.1), blackMat);
    speedSel.position.set(4.5, -0.35, 4.44);
    baseGroup.add(speedSel);
    // Headphone jack
    const hpJack = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 12), darkMetalMat);
    hpJack.rotation.x = Math.PI / 2;
    hpJack.position.set(3.5, -0.55, 4.44);
    baseGroup.add(hpJack);


    // ============ 2. PLATTER & VINYL ============
    const platter = platterRef.current;
    platter.position.set(-0.8, 0, -0.2);
    baseGroup.add(platter);

    // Black platter base
    const platterBase = new THREE.Mesh(
      new THREE.CylinderGeometry(3.7, 3.7, 0.12, 64), blackMat
    );
    platterBase.position.y = 0.12;
    platter.add(platterBase);

    // Vinyl Record
    const record = new THREE.Mesh(
      new THREE.CylinderGeometry(3.6, 3.6, 0.04, 64), vinylMat
    );
    record.position.y = 0.2;
    platter.add(record);

    // Grooves – concentric ring illusion
    const grooveMat = new THREE.MeshStandardMaterial({ 
      color: 0x030303, roughness: 0.3, metalness: 0.95, side: THREE.DoubleSide 
    });
    const grooves = new THREE.Mesh(new THREE.RingGeometry(1.4, 3.55, 64, 40), grooveMat);
    grooves.rotation.x = -Math.PI / 2;
    grooves.position.y = 0.225;
    platter.add(grooves);

    // Center Label
    const label = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 0.05, 64), labelMatRef.current
    );
    label.position.y = 0.225;
    platter.add(label);

    // Center Spindle
    const spindle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.5, 12), metalMat
    );
    spindle.position.y = 0.3;
    platter.add(spindle);


    // ============ 3. TONEARM (realistic slim design) ============
    const armPivot = armRef.current;
    armPivot.position.set(4.2, 0.1, -2.8); // Back-right corner
    armPivot.rotation.y = 1.0; // Rest position
    baseGroup.add(armPivot);

    // Small circular pivot mount
    const pivotMount = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 0.15, 24), blackMat
    );
    pivotMount.position.y = 0.08;
    armPivot.add(pivotMount);

    // Thin vertical post rising from pivot
    const armPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 1.0, 12), metalMat
    );
    armPost.position.y = 0.6;
    armPivot.add(armPost);

    // Horizontal arm tube (thin, realistic) 
    const armTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 5.2, 8), metalMat
    );
    armTube.rotation.z = Math.PI / 2;
    armTube.position.set(-2.0, 1.05, 0);
    armPivot.add(armTube);

    // Slight bend near headshell (angled section for S-shape illusion)
    const armBend = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8), metalMat
    );
    armBend.rotation.z = Math.PI / 2 + 0.15; // slight downward angle
    armBend.position.set(-4.8, 0.95, 0);
    armPivot.add(armBend);

    // Headshell / cartridge  
    const headshell = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.15, 0.25), blackMat
    );
    headshell.position.set(-5.2, 0.85, 0);
    armPivot.add(headshell);

    // Stylus (tiny needle)
    const stylus = new THREE.Mesh(
      new THREE.ConeGeometry(0.02, 0.2, 8), metalMat
    );
    stylus.position.set(-5.3, 0.7, 0);
    stylus.rotation.z = Math.PI; // point down
    armPivot.add(stylus);

    // Counterweight (back end)
    const cw = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 0.5, 24), darkMetalMat
    );
    cw.rotation.z = Math.PI / 2;
    cw.position.set(0.9, 1.05, 0);
    armPivot.add(cw);

    // Arm rest clip
    const armRestPost = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.6, 0.08), metalMat
    );
    armRestPost.position.set(3.8, 0.35, 1.8);
    baseGroup.add(armRestPost);
    
    const armRestU = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.08, 0.15), metalMat
    );
    armRestU.position.set(3.8, 0.65, 1.8);
    baseGroup.add(armRestU);


    // ============ 4. DUST COVER (transparent acrylic, open) ============
    const dustCover = dustCoverRef.current;
    // Hinge at the back edge of the body
    dustCover.position.set(0, 0.05, -4.25);
    dustCover.rotation.x = -1.2; // Open angle (~70 degrees back)
    baseGroup.add(dustCover);

    // Top panel
    const coverTop = new THREE.Mesh(
      new THREE.BoxGeometry(12.4, 0.08, 8.4), glassMat
    );
    coverTop.position.set(0, 4.2, 4.2);
    dustCover.add(coverTop);

    // Left panel
    const coverLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 4.2, 8.4), glassMat
    );
    coverLeft.position.set(-6.15, 2.1, 4.2);
    dustCover.add(coverLeft);

    // Right panel
    const coverRight = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 4.2, 8.4), glassMat
    );
    coverRight.position.set(6.15, 2.1, 4.2);
    dustCover.add(coverRight);

    // Front panel
    const coverFront = new THREE.Mesh(
      new THREE.BoxGeometry(12.4, 4.2, 0.08), glassMat
    );
    coverFront.position.set(0, 2.1, 8.4);
    dustCover.add(coverFront);


    // ============ 5. SPEAKERS (left & right, walnut box design) ============
    const createSpeaker = (xPos: number) => {
      const spkGroup = new THREE.Group();
      spkGroup.position.set(xPos, -0.5, 0);

      // Wooden cabinet
      const cabinet = new THREE.Mesh(
        createRoundedBoxGeo(3.5, 4.5, 4.5, 0.2), walnutMat
      );
      cabinet.rotation.x = Math.PI / 2;
      cabinet.position.y = 1.8;
      cabinet.castShadow = true;
      spkGroup.add(cabinet);

      // Front grille cloth
      const grille = new THREE.Mesh(
        new THREE.PlaneGeometry(3.2, 4.2), speakerClothMat
      );
      grille.position.set(0, 1.8, 2.26);
      spkGroup.add(grille);

      // Woofer cone (visible through cloth as shadow)
      const woofer = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 1.0, 0.15, 32), blackMat
      );
      woofer.rotation.x = Math.PI / 2;
      woofer.position.set(0, 1.2, 2.3);
      spkGroup.add(woofer);

      // Tweeter
      const tweeter = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 16, 16), darkMetalMat
      );
      tweeter.position.set(0, 2.8, 2.3);
      spkGroup.add(tweeter);

      return spkGroup;
    };

    const leftSpeaker = createSpeaker(-10);
    const rightSpeaker = createSpeaker(10);
    baseGroup.add(leftSpeaker);
    baseGroup.add(rightSpeaker);


    // ============ 6. 3D LP DISPLAY SHELF (angled 3×3 magazine-rack style) ============
    const shelfGroup = new THREE.Group();
    // Place behind and to the right of the turntable, far enough not to overlap
    shelfGroup.position.set(16, -1.3, -10);
    shelfGroup.rotation.y = -0.5; // angle toward camera (facing left)
    group.add(shelfGroup);

    // Dedicated light for the shelf so album covers are visible
    const shelfLight = new THREE.PointLight(0xffe8d0, 30, 25);
    shelfLight.position.set(16, 8, -5);
    group.add(shelfLight);

    const shelfWoodMat = new THREE.MeshStandardMaterial({ color: 0x5C3A1E, roughness: 0.75 });
    const shelfDarkMat = new THREE.MeshStandardMaterial({ color: 0x3D2512, roughness: 0.8 });

    // Dimensions
    const cols = 3;
    const rows = 3;
    const coverSize = 3.2;        // album cover square size
    const gapX = 0.5;             // horizontal gap between covers
    const rowHeight = 3.8;        // vertical spacing between rows
    const ledgeHeight = 0.8;      // front lip height
    const tiltAngle = 0.35;       // how much the back tilts (radians)
    const totalW = cols * coverSize + (cols - 1) * gapX + 1.0; // +padding
    const totalH = rows * rowHeight + 1.0;

    // Back panel – a tall tilted slab 
    const backGeo = new THREE.BoxGeometry(totalW, totalH, 0.35);
    const backPanel = new THREE.Mesh(backGeo, shelfWoodMat);
    backPanel.position.set(0, totalH / 2, -0.5);
    backPanel.rotation.x = tiltAngle;
    backPanel.castShadow = true;
    backPanel.receiveShadow = true;
    shelfGroup.add(backPanel);

    // Side panels (triangular profile – thicker at bottom)
    const sideShape = new THREE.Shape();
    sideShape.moveTo(0, 0);
    sideShape.lineTo(3.5, 0);         // bottom depth
    sideShape.lineTo(0.5, totalH);     // top (thinner)
    sideShape.lineTo(0, totalH);       // back edge
    sideShape.lineTo(0, 0);

    const sideGeo = new THREE.ExtrudeGeometry(sideShape, { depth: 0.25, bevelEnabled: false });

    const leftSide = new THREE.Mesh(sideGeo, shelfDarkMat);
    leftSide.position.set(-totalW / 2 - 0.13, 0, -0.5);
    leftSide.castShadow = true;
    shelfGroup.add(leftSide);

    const rightSide = new THREE.Mesh(sideGeo, shelfDarkMat);
    rightSide.position.set(totalW / 2 - 0.13, 0, -0.5);
    rightSide.castShadow = true;
    shelfGroup.add(rightSide);

    // Create 3 row ledges (horizontal lip that holds records)
    for (let row = 0; row < rows; row++) {
      const y = row * rowHeight + 0.3;
      // The ledge depth depends on the tilt – lower rows stick out further
      const depth = 3.5 - (row * 0.8);

      // Shelf board (horizontal)
      const boardGeo = new THREE.BoxGeometry(totalW, 0.2, depth);
      const board = new THREE.Mesh(boardGeo, shelfWoodMat);
      board.position.set(0, y, depth / 2 - 0.5);
      board.receiveShadow = true;
      shelfGroup.add(board);

      // Front lip
      const lipGeo = new THREE.BoxGeometry(totalW, ledgeHeight, 0.2);
      const lip = new THREE.Mesh(lipGeo, shelfDarkMat);
      lip.position.set(0, y + ledgeHeight / 2, depth - 0.4);
      shelfGroup.add(lip);
    }

    // Procedural album cover textures using Canvas
    const albumStyles: Array<{ bg: string; accent: string; pattern: string }> = [
      { bg: '#1a1a1a', accent: '#ffffff', pattern: 'stripes' },
      { bg: '#8B0000', accent: '#FFD700', pattern: 'circle' },
      { bg: '#f5f0e8', accent: '#333333', pattern: 'grid' },
      { bg: '#1a3a5c', accent: '#e0c97f', pattern: 'diagonal' },
      { bg: '#2d1b0e', accent: '#ff6b35', pattern: 'text' },
      { bg: '#e63946', accent: '#f1faee', pattern: 'minimal' },
      { bg: '#264653', accent: '#e9c46a', pattern: 'circle' },
      { bg: '#606c38', accent: '#fefae0', pattern: 'stripes' },
      { bg: '#023047', accent: '#fb8500', pattern: 'diagonal' },
    ];

    const createAlbumTexture = (style: typeof albumStyles[0]): THREE.CanvasTexture => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;

      // Background
      ctx.fillStyle = style.bg;
      ctx.fillRect(0, 0, 256, 256);

      ctx.fillStyle = style.accent;
      ctx.strokeStyle = style.accent;
      ctx.lineWidth = 2;

      switch (style.pattern) {
        case 'stripes':
          for (let i = 0; i < 12; i++) {
            const w = 8 + Math.random() * 12;
            const x = 20 + i * 18;
            ctx.fillRect(x, 40, w, 176);
          }
          break;
        case 'circle':
          ctx.beginPath();
          ctx.arc(128, 128, 70 + Math.random() * 30, 0, Math.PI * 2);
          ctx.fill();
          // Inner ring
          ctx.fillStyle = style.bg;
          ctx.beginPath();
          ctx.arc(128, 128, 30, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'grid':
          for (let x = 0; x < 8; x++) {
            for (let y = 0; y < 8; y++) {
              if ((x + y) % 2 === 0) {
                ctx.fillRect(x * 32, y * 32, 30, 30);
              }
            }
          }
          break;
        case 'diagonal':
          for (let i = -10; i < 20; i++) {
            ctx.save();
            ctx.translate(128, 128);
            ctx.rotate(Math.PI / 4);
            ctx.fillRect(-200, i * 18, 400, 8);
            ctx.restore();
          }
          break;
        case 'text':
          ctx.font = 'bold 42px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('VINYL', 128, 110);
          ctx.font = '24px sans-serif';
          ctx.fillText('COLLECTION', 128, 150);
          break;
        case 'minimal':
          ctx.fillRect(60, 100, 136, 4);
          ctx.font = '18px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('ALBUM', 128, 90);
          ctx.fillText('TITLE', 128, 135);
          break;
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    // Place 9 album covers in the 3×3 grid
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        const style = albumStyles[idx % albumStyles.length];

        // X position centered
        const x = (col - 1) * (coverSize + gapX);
        const y = row * rowHeight + 0.3 + ledgeHeight + coverSize / 2 - 0.1;
        const depth = 3.5 - (row * 0.8);
        const z = depth - 0.6; // lean against the back

        // Album cover leaning against the back
        const coverGroup = new THREE.Group();
        coverGroup.position.set(x, y, z);
        coverGroup.rotation.x = -tiltAngle + 0.05; // lean back to match shelf angle

        // Back of the cover (cardboard)
        const coverBack = new THREE.Mesh(
          new THREE.BoxGeometry(coverSize, coverSize, 0.06),
          new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 })
        );
        coverGroup.add(coverBack);

        // Front artwork
        const albumTex = createAlbumTexture(style);
        const coverFront = new THREE.Mesh(
          new THREE.PlaneGeometry(coverSize * 0.95, coverSize * 0.95),
          new THREE.MeshStandardMaterial({ map: albumTex, roughness: 0.8 })
        );
        coverFront.position.z = 0.035;
        coverGroup.add(coverFront);

        shelfGroup.add(coverGroup);
      }
    }

    // "Now Playing" display – album cover leaning next to turntable
    const displayStand = new THREE.Group();
    displayStand.position.set(9.5, -0.8, -2);
    displayStand.rotation.y = -0.3;
    displayStand.rotation.x = -0.15;

    const displayBack = new THREE.Mesh(new THREE.BoxGeometry(3.5, 3.5, 0.08), blackMat);
    displayBack.position.y = 1.75;
    displayStand.add(displayBack);

    const displayFace = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 3.3), labelMatRef.current);
    displayFace.position.set(0, 1.75, 0.05);
    displayStand.add(displayFace);

    group.add(displayStand);

  }, []);

  // ============ SCENE MOUNT ============
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

  // ============ ANIMATION ============
  useImperativeHandle(ref, () => ({
    update(delta: number) {
      if (props.isPlaying) {
        // Spin the record at 33 1/3 RPM feeling
        platterRef.current.rotation.y -= delta * 1.5;
        // Tonearm sweeps slowly toward the record
        if (props.needleDown) {
          armRef.current.rotation.y += (0.35 - armRef.current.rotation.y) * 4 * delta;
        }
      } else {
        // Return arm to rest position smoothly
        armRef.current.rotation.y += (1.0 - armRef.current.rotation.y) * 4 * delta;
      }
    }
  }));

  return null;
});
