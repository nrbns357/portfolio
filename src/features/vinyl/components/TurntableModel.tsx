import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { VinylItem } from '../types';

interface TurntableModelProps {
  isPlaying: boolean;
  needleDown: boolean;
  labelTextureUrl?: string;
  scene?: THREE.Scene;
  camera?: THREE.Camera;
  renderer?: THREE.WebGLRenderer;
  records?: VinylItem[];
  currentId?: string;
  onSelect?: (vinyl: VinylItem) => void;
  progress?: number;
  dustCoverOpen?: boolean;
  onDustCoverToggle?: () => void;
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

// Tonearm animation states
type ArmPhase = 'rest' | 'lifting' | 'swinging' | 'dropping' | 'playing' | 'returning';

export const TurntableModel = forwardRef((props: TurntableModelProps, ref) => {
  const groupRef = useRef<THREE.Group>(new THREE.Group());
  const platterRef = useRef<THREE.Group>(new THREE.Group());
  const armRef = useRef<THREE.Group>(new THREE.Group());
  const dustCoverRef = useRef<THREE.Group>(new THREE.Group());
  const labelMatRef = useRef<THREE.MeshStandardMaterial>(new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.9 }));
  const recordsGroupRef = useRef<THREE.Group>(new THREE.Group());
  const leftSpeakerRef = useRef<THREE.Group>(new THREE.Group());
  const rightSpeakerRef = useRef<THREE.Group>(new THREE.Group());


  // Tonearm state machine
  const armPhaseRef = useRef<ArmPhase>('rest');
  const armHeightRef = useRef(0); // 0 = down, 1 = lifted
  const wasPlayingRef = useRef(false);
  const dustCoverAngleRef = useRef(-1.2); // Current angle (open)
  const timeRef = useRef(0);

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
    platterRef.current.clear();
    armRef.current.clear();
    dustCoverRef.current.clear();

    // Helper to create a procedural wood texture map
    const createWoodTexture = (baseColor: string, grainColor: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = grainColor;
      
      // Procedural vertical wood grains
      for (let i = 0; i < 200; i++) {
        ctx.beginPath();
        const x = Math.random() * 512;
        const width = Math.random() * 3 + 1;
        ctx.globalAlpha = Math.random() * 0.15 + 0.05;
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(
          x + (Math.random() - 0.5) * 60, 170,
          x + (Math.random() - 0.5) * 60, 340,
          x + (Math.random() - 0.5) * 30, 512
        );
        ctx.lineWidth = width;
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    const walnutTex = createWoodTexture('#8B5E3C', '#3A2010');
    const walnutDarkTex = createWoodTexture('#6B4226', '#1A0A05');

    // ============ MATERIALS ============
    // Walnut wood with texture
    const walnutMat = new THREE.MeshStandardMaterial({ map: walnutTex, roughness: 0.85, metalness: 0.05 });
    const walnutDarkMat = new THREE.MeshStandardMaterial({ map: walnutDarkTex, roughness: 0.9, metalness: 0.05 });
    
    // Rest of the materials
    const darkWoodShelfMat = new THREE.MeshStandardMaterial({ color: 0x110804, roughness: 0.95 });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
    const blackPlateMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.95 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0xd0d0d0, metalness: 0.85, roughness: 0.15 });
    const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7, roughness: 0.3 });
    
    // Realistic Vinyl: Matte black with slight metalness so the grooves shine
    const vinylMat = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.35, metalness: 0.8 });
    
    // Realistic Dust Cover (Glass/Acrylic)
    const glassMat = new THREE.MeshPhysicalMaterial({ 
      color: 0xffffff, 
      transmission: 0.9, 
      opacity: 1, 
      metalness: 0.1, 
      roughness: 0.02, 
      ior: 1.5, 
      thickness: 0.2, 
      clearcoat: 1.0, 
      clearcoatRoughness: 0.05, 
      side: THREE.DoubleSide, 
      transparent: true 
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
    armPivot.rotation.y = 1.35; // Rest position
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
    leftSpeakerRef.current = leftSpeaker;
    rightSpeakerRef.current = rightSpeaker;
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

    const shelfWoodMat = new THREE.MeshStandardMaterial({ map: walnutTex, roughness: 0.85, metalness: 0.05 });
    const shelfDarkMat = new THREE.MeshStandardMaterial({ map: walnutDarkTex, roughness: 0.9, metalness: 0.05 });

    // Dimensions
    const cols = 3;
    const rows = 3;
    const coverSize = 3.2;
    const gapX = 0.5;
    const rowHeight = 3.8;
    const ledgeHeight = 0.8;
    const tiltAngle = 0.22; // Leaning backwards
    const totalW = cols * coverSize + (cols - 1) * gapX + 1.0;
    const totalH = rows * rowHeight + 1.5;

    // Back panel – leans backwards (top goes in, bottom goes out)
    const backGeo = new THREE.BoxGeometry(totalW, totalH, 0.35);
    const backPanel = new THREE.Mesh(backGeo, shelfWoodMat);
    backPanel.position.set(0, totalH / 2, -1.0);
    backPanel.rotation.x = -tiltAngle;
    backPanel.castShadow = true;
    backPanel.receiveShadow = true;
    shelfGroup.add(backPanel);

    // Left and Right Side Panels (A-frame / Tapered design)
    const sideShape = new THREE.Shape();
    // Drawn on XY plane, later rotated to YZ plane
    // X will become +Z (front)
    sideShape.moveTo(-1.2, 0);        // bottom back
    sideShape.lineTo(2.2, 0);         // bottom front
    sideShape.lineTo(0.5, totalH);    // top front (leans back)
    sideShape.lineTo(-2.2, totalH);   // top back (leans back)
    sideShape.lineTo(-1.2, 0);

    const sideGeo = new THREE.ExtrudeGeometry(sideShape, { depth: 0.35, bevelEnabled: false });

    // Left side
    const leftSide = new THREE.Mesh(sideGeo, shelfDarkMat);
    leftSide.rotation.y = -Math.PI / 2; // +X of shape becomes +Z
    leftSide.position.set(-totalW / 2 - 0.35, 0, 0);
    leftSide.castShadow = true;
    shelfGroup.add(leftSide);

    // Right side
    const rightSide = new THREE.Mesh(sideGeo, shelfDarkMat);
    rightSide.rotation.y = -Math.PI / 2;
    rightSide.position.set(totalW / 2, 0, 0);
    rightSide.castShadow = true;
    shelfGroup.add(rightSide);

    // Create 3 row ledges (horizontal shelves)
    for (let row = 0; row < rows; row++) {
      const y = row * rowHeight + 0.5;
      // Center of back panel is at y = totalH / 2, z = -1.0. 
      // Compute Z position of back panel surface at this Y height:
      const backZ = -1.0 - (y - totalH / 2) * Math.tan(tiltAngle);
      
      const shelfDepth = 1.6;

      // Shelf board (horizontal)
      const boardGeo = new THREE.BoxGeometry(totalW, 0.2, shelfDepth);
      const board = new THREE.Mesh(boardGeo, shelfWoodMat);
      board.position.set(0, y, backZ + shelfDepth / 2);
      board.receiveShadow = true;
      shelfGroup.add(board);

      // Front lip
      const lipGeo = new THREE.BoxGeometry(totalW, ledgeHeight, 0.2);
      const lip = new THREE.Mesh(lipGeo, shelfDarkMat);
      lip.position.set(0, y + ledgeHeight / 2, backZ + shelfDepth - 0.1);
      shelfGroup.add(lip);
    }

    shelfGroup.add(recordsGroupRef.current);



  }, []);

  // ============ DYNAMIC RECORDS ON SHELF ============
  useEffect(() => {
    const group = recordsGroupRef.current;
    group.clear();

    if (!props.records || props.records.length === 0) return;

    const cols = 3;
    const coverSize = 3.2;        
    const gapX = 0.5;             
    const rowHeight = 3.8;        
    const ledgeHeight = 0.8;      
    const tiltAngle = 0.22;       
    const totalH = 3 * 3.8 + 1.5;

    props.records.forEach((record, idx) => {
      // position from bottom-right (or top-left) up to 9
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      
      const x = (col - 1) * (coverSize + gapX);
      const y = row * rowHeight + 0.5 + ledgeHeight / 2 + coverSize / 2;
      
      const backZ = -1.0 - ((row * rowHeight + 0.5) - totalH / 2) * Math.tan(tiltAngle);
      const shelfDepth = 1.6;
      const z = backZ + shelfDepth - 0.5; // lean against the back

      const coverGroup = new THREE.Group();

      coverGroup.position.set(x, y, z);
      coverGroup.rotation.x = -tiltAngle + 0.05;

      const coverBack = new THREE.Mesh(
        new THREE.BoxGeometry(coverSize, coverSize, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 })
      );
      // Give it user data for raycasting
      coverBack.userData = { recordId: record.id };
      coverGroup.add(coverBack);

      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(record.thumbUrl, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        
        const coverFront = new THREE.Mesh(
          new THREE.PlaneGeometry(coverSize * 0.95, coverSize * 0.95),
          new THREE.MeshStandardMaterial({ 
            map: texture, 
            roughness: 0.8,
            emissive: props.currentId === record.id ? new THREE.Color(0x333333) : new THREE.Color(0x000000)
          })
        );
        coverFront.position.z = 0.035;
        coverFront.userData = { recordId: record.id };
        coverGroup.add(coverFront);
      });

      group.add(coverGroup);
    });
  }, [props.records, props.currentId]);

  // ============ RAYCASTING INTERACTION (Records + Dust Cover) ============
  useEffect(() => {
    if (!props.camera || !props.renderer) return;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let startX = 0, startY = 0;

    const domElement = props.renderer.domElement;

    const handlePointerDown = (e: PointerEvent) => {
      startX = e.clientX;
      startY = e.clientY;
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5) return;

      const rect = domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, props.camera!);

      // Check dust cover first
      const dustIntersects = raycaster.intersectObjects(dustCoverRef.current.children, true);
      if (dustIntersects.length > 0 && props.onDustCoverToggle) {
        props.onDustCoverToggle();
        return;
      }

      // Check records on shelf
      const group = recordsGroupRef.current;
      const intersects = raycaster.intersectObjects(group.children, true);
      
      if (intersects.length > 0) {
        let object: any = intersects[0].object;
        while(object && !object.userData?.recordId) {
          object = object.parent;
        }
        if (object && object.userData?.recordId) {
          const record = props.records?.find(r => r.id === object.userData.recordId);
          if (record && props.onSelect) props.onSelect(record);
        }
      }
    };

    // Use cursor-pointer on hover
    const handlePointerMove = (e: PointerEvent) => {
      const rect = domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, props.camera!);
      
      const dustHover = raycaster.intersectObjects(dustCoverRef.current.children, true);
      const group = recordsGroupRef.current;
      const recordHover = raycaster.intersectObjects(group.children, true);
      
      if (dustHover.length > 0 || (recordHover.length > 0 && recordHover.some(i => i.object.userData?.recordId || i.object.parent?.userData?.recordId))) {
        domElement.style.cursor = 'pointer';
      } else {
        domElement.style.cursor = 'move';
      }
    };

    domElement.addEventListener('pointerdown', handlePointerDown);
    domElement.addEventListener('pointerup', handlePointerUp);
    domElement.addEventListener('pointermove', handlePointerMove);

    return () => {
      domElement.removeEventListener('pointerdown', handlePointerDown);
      domElement.removeEventListener('pointerup', handlePointerUp);
      domElement.removeEventListener('pointermove', handlePointerMove);
      domElement.style.cursor = 'move';
    };
  }, [props.camera, props.renderer, props.records, props.onSelect, props.onDustCoverToggle]);

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

  // ============ ANIMATION (Tonearm State Machine + Effects) ============
  useImperativeHandle(ref, () => ({
    update(delta: number) {
      timeRef.current += delta;
      const ARM_REST = 1.35;
      const ARM_PLAY_START = 0.95;
      const ARM_PLAY_END = 0.45;
      const LIFT_SPEED = 3.0;
      const SWING_SPEED = 3.0;
      const phase = armPhaseRef.current;

      // Detect play/stop transitions
      if (props.isPlaying && !wasPlayingRef.current) {
        // Just started playing → lift the arm first
        armPhaseRef.current = 'lifting';
      } else if (!props.isPlaying && wasPlayingRef.current) {
        // Just stopped → lift then return
        armPhaseRef.current = 'lifting';
      }
      wasPlayingRef.current = props.isPlaying;

      // State machine
      switch (armPhaseRef.current) {
        case 'rest':
          armRef.current.rotation.y += (ARM_REST - armRef.current.rotation.y) * 4 * delta;
          armHeightRef.current += (0 - armHeightRef.current) * 5 * delta;
          break;

        case 'lifting':
          armHeightRef.current += (1 - armHeightRef.current) * LIFT_SPEED * delta;
          if (armHeightRef.current > 0.9) {
            armHeightRef.current = 1;
            armPhaseRef.current = props.isPlaying ? 'swinging' : 'returning';
          }
          break;

        case 'swinging': {
          const target = ARM_PLAY_START - (props.progress || 0) * (ARM_PLAY_START - ARM_PLAY_END);
          armRef.current.rotation.y += (target - armRef.current.rotation.y) * SWING_SPEED * delta;
          if (Math.abs(armRef.current.rotation.y - target) < 0.05) {
            armPhaseRef.current = 'dropping';
          }
          break;
        }

        case 'dropping':
          armHeightRef.current += (0 - armHeightRef.current) * LIFT_SPEED * delta;
          if (armHeightRef.current < 0.05) {
            armHeightRef.current = 0;
            armPhaseRef.current = 'playing';
          }
          break;

        case 'playing': {
          const playTarget = ARM_PLAY_START - (props.progress || 0) * (ARM_PLAY_START - ARM_PLAY_END);
          armRef.current.rotation.y += (playTarget - armRef.current.rotation.y) * 2 * delta;
          break;
        }

        case 'returning':
          armRef.current.rotation.y += (ARM_REST - armRef.current.rotation.y) * SWING_SPEED * delta;
          if (Math.abs(armRef.current.rotation.y - ARM_REST) < 0.03) {
            armPhaseRef.current = 'rest';
          }
          break;
      }

      // Apply arm height offset (lift the arm group slightly)
      armRef.current.position.y = 0.1 + armHeightRef.current * 0.3;

      // Spin platter
      if (props.isPlaying) {
        platterRef.current.rotation.y -= delta * 1.5;
      }

      // ---- Dust Cover Animation ----
      const targetCoverAngle = (props.dustCoverOpen !== false) ? -1.2 : -0.02;
      dustCoverAngleRef.current += (targetCoverAngle - dustCoverAngleRef.current) * 3 * delta;
      dustCoverRef.current.rotation.x = dustCoverAngleRef.current;

      // ---- Speaker Vibration (bass pulse) ----
      if (props.isPlaying) {
        const vibration = Math.sin(timeRef.current * 25) * 0.015;
        const vibration2 = Math.sin(timeRef.current * 30 + 1.0) * 0.012;
        leftSpeakerRef.current.position.z = vibration;
        rightSpeakerRef.current.position.z = vibration2;
        // Subtle scale pulse
        const pulse = 1 + Math.sin(timeRef.current * 8) * 0.003;
        leftSpeakerRef.current.scale.setScalar(pulse);
        rightSpeakerRef.current.scale.setScalar(pulse);
      } else {
        leftSpeakerRef.current.position.z += (0 - leftSpeakerRef.current.position.z) * 5 * delta;
        rightSpeakerRef.current.position.z += (0 - rightSpeakerRef.current.position.z) * 5 * delta;
        leftSpeakerRef.current.scale.setScalar(1);
        rightSpeakerRef.current.scale.setScalar(1);
      }


    }
  }));

  return null;
});
