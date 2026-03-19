"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"

export default function LPProjectPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    let animationFrameId: number
    let renderer: THREE.WebGLRenderer
    let controls: any

    // We will store reference variables for animation
    let tonearmAssembly: THREE.Group
    let platterGroup: THREE.Group
    let isPlayingState = false // Internal ref for render loop

    const initThreeJS = async () => {
      try {
        const width = containerRef.current!.clientWidth || window.innerWidth
        const height = containerRef.current!.clientHeight || window.innerHeight

        const scene = new THREE.Scene()
        scene.background = new THREE.Color("#1a1a1a")

        const aspect = width / height
        const d = 9
        const camera = new THREE.OrthographicCamera(
          -d * aspect,
          d * aspect,
          d,
          -d,
          0.1,
          1000,
        )
        camera.position.set(20, 20, 20)
        camera.lookAt(0, 0, 0)

        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.2
        renderer.outputColorSpace = THREE.SRGBColorSpace

        containerRef.current!.appendChild(renderer.domElement)

        const { OrbitControls } =
          await import("three/addons/controls/OrbitControls.js").catch(
            () => import("three/examples/jsm/controls/OrbitControls.js"),
          )

        controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.05
        controls.enableZoom = true
        controls.maxPolarAngle = Math.PI / 2 - 0.1

        // --- Lighting ---
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
        scene.add(ambientLight)

        const mainLight = new THREE.DirectionalLight(0xffeedd, 5.0)
        mainLight.position.set(15, 25, 15)
        mainLight.castShadow = true
        mainLight.shadow.mapSize.width = 2048
        mainLight.shadow.mapSize.height = 2048
        mainLight.shadow.camera.near = 0.5
        mainLight.shadow.camera.far = 60
        mainLight.shadow.camera.left = -15
        mainLight.shadow.camera.right = 15
        mainLight.shadow.camera.top = 15
        mainLight.shadow.camera.bottom = -15
        mainLight.shadow.bias = -0.0005
        scene.add(mainLight)

        const fillLight = new THREE.DirectionalLight(0xaaccff, 2.0)
        fillLight.position.set(-15, 10, -15)
        scene.add(fillLight)

        // --- Realistic Materials ---
        const brushedAluminumMaterial = new THREE.MeshStandardMaterial({
          color: 0xdddddd,
          roughness: 0.3,
          metalness: 0.85,
        })

        const matteBlackMaterial = new THREE.MeshStandardMaterial({
          color: 0x141414,
          roughness: 0.8,
          metalness: 0.3,
        })

        const rubberMaterial = new THREE.MeshStandardMaterial({
          color: 0x111111,
          roughness: 0.95,
          metalness: 0.05,
        })

        // Procedural Wood
        const createWoodTexture = () => {
          const canvas = document.createElement("canvas")
          canvas.width = 1024
          canvas.height = 1024
          const ctx = canvas.getContext("2d")
          if (!ctx) return null
          const gradient = ctx.createLinearGradient(0, 0, 1024, 1024)
          gradient.addColorStop(0, "#54301A")
          gradient.addColorStop(0.5, "#452512")
          gradient.addColorStop(1, "#331A0B")
          ctx.fillStyle = gradient
          ctx.fillRect(0, 0, 1024, 1024)
          ctx.globalAlpha = 0.1
          for (let i = 0; i < 300; i++) {
            ctx.beginPath()
            let x = Math.random() * 1024
            let y = 0
            ctx.moveTo(x, y)
            const freq = 40 + Math.random() * 60
            while (y <= 1024) {
              x += (Math.random() - 0.5) * 4
              y += 10
              ctx.lineTo(x + 20 * Math.sin(y / freq), y)
            }
            ctx.strokeStyle = "#0f0502"
            ctx.stroke()
          }
          const texture = new THREE.CanvasTexture(canvas)
          texture.colorSpace = THREE.SRGBColorSpace
          return texture
        }

        const woodMaterial = new THREE.MeshStandardMaterial({
          map: createWoodTexture(),
          roughness: 0.6,
          metalness: 0.2,
        })

        // --- Geometry ---
        const turntableGroup = new THREE.Group()
        turntableGroup.position.set(0, -0.5, 0)
        scene.add(turntableGroup)

        // 1. Wood Base
        const baseWidth = 11,
          baseDepth = 8,
          baseHeight = 0.8,
          radius = 0.4
        const shape = new THREE.Shape()
        const bx = -baseWidth / 2,
          by = -baseDepth / 2
        shape.moveTo(bx, by + radius)
        shape.lineTo(bx, by + baseDepth - radius)
        shape.quadraticCurveTo(bx, by + baseDepth, bx + radius, by + baseDepth)
        shape.lineTo(bx + baseWidth - radius, by + baseDepth)
        shape.quadraticCurveTo(
          bx + baseWidth,
          by + baseDepth,
          bx + baseWidth,
          by + baseDepth - radius,
        )
        shape.lineTo(bx + baseWidth, by + radius)
        shape.quadraticCurveTo(bx + baseWidth, by, bx + baseWidth - radius, by)
        shape.lineTo(bx + radius, by)
        shape.quadraticCurveTo(bx, by, bx, by + radius)

        const baseGeo = new THREE.ExtrudeGeometry(shape, {
          depth: baseHeight,
          bevelEnabled: true,
          bevelSegments: 4,
          steps: 1,
          bevelSize: 0.04,
          bevelThickness: 0.04,
        })
        baseGeo.rotateX(-Math.PI / 2)
        const baseMesh = new THREE.Mesh(baseGeo, woodMaterial)
        baseMesh.castShadow = true
        baseMesh.receiveShadow = true
        turntableGroup.add(baseMesh)

        // 2. Platter Group (Spins) // Now correctly isolated for spinning
        platterGroup = new THREE.Group()
        const platterX = -1.5,
          platterZ = 0
        platterGroup.position.set(platterX, baseHeight, platterZ)
        turntableGroup.add(platterGroup)

        const platterMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(3.6, 3.6, 0.35, 64),
          matteBlackMaterial,
        )
        platterMesh.position.y = 0.175
        platterMesh.castShadow = true
        platterMesh.receiveShadow = true
        platterGroup.add(platterMesh)

        for (let i = 0; i < 40; i++) {
          const dotMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.1, 0.05),
            brushedAluminumMaterial,
          )
          const angle = (i / 40) * Math.PI * 2
          dotMesh.position.set(
            Math.cos(angle) * 3.58,
            0,
            Math.sin(angle) * 3.58,
          )
          dotMesh.rotation.y = -angle
          platterMesh.add(dotMesh)
        }

        const matMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(3.55, 3.55, 0.04, 64),
          rubberMaterial,
        )
        matMesh.position.y = 0.35 + 0.02
        matMesh.receiveShadow = true
        platterGroup.add(matMesh)

        // Record
        const recordMaterial = new THREE.MeshStandardMaterial({
          color: 0x070707,
          roughness: 0.2,
          metalness: 0.5,
        })
        const recordMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(3.4, 3.4, 0.02, 64),
          recordMaterial,
        )
        recordMesh.position.y = 0.39 + 0.01
        recordMesh.castShadow = true
        platterGroup.add(recordMesh)

        for (let r = 1.3; r < 3.3; r += 0.05) {
          const ring = new THREE.Mesh(
            new THREE.RingGeometry(r, r + 0.015, 64),
            new THREE.MeshStandardMaterial({
              color: 0x050505,
              roughness: 0.6,
              metalness: 0.6,
            }),
          )
          ring.rotation.x = -Math.PI / 2
          ring.position.y = 0.401
          platterGroup.add(ring)
        }

        const labelMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(1.2, 1.2, 0.02, 64),
          new THREE.MeshStandardMaterial({ color: 0xc94c3c, roughness: 0.9 }),
        )
        labelMesh.position.y = 0.402
        platterGroup.add(labelMesh)

        const spindleMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.06, 0.5, 32),
          brushedAluminumMaterial,
        )
        spindleMesh.position.set(platterX, baseHeight + 0.5, platterZ)
        spindleMesh.castShadow = true
        turntableGroup.add(spindleMesh)

        // 3. Tonearm Assembly (Group for animation)
        const armBaseX = 3.5,
          armBaseZ = -2.5

        const pivotRingMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.8, 0.8, 0.1, 32),
          brushedAluminumMaterial,
        )
        pivotRingMesh.position.set(armBaseX, baseHeight + 0.05, armBaseZ)
        pivotRingMesh.castShadow = true
        turntableGroup.add(pivotRingMesh)

        // Dynamic Tonearm Group (Pivot Point)
        tonearmAssembly = new THREE.Group()
        tonearmAssembly.position.set(armBaseX, baseHeight + 0.4, armBaseZ) // Set physical pivot
        
        // **중요**: 초기에 턴테이블 바깥쪽(대기석)에 있도록 미리 살짝 돌려놓습니다.
        tonearmAssembly.rotation.y = Math.PI / 8;
        
        turntableGroup.add(tonearmAssembly)

        const pivotMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.35, 0.8, 32),
          matteBlackMaterial,
        )
        pivotMesh.castShadow = true
        tonearmAssembly.add(pivotMesh) // Now centered within Group

        const weightMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.3, 0.5, 32),
          brushedAluminumMaterial,
        )
        weightMesh.rotation.z = Math.PI / 2
        weightMesh.rotation.y = Math.PI / 8
        weightMesh.position.set(0.7, 0.3, -0.4)
        weightMesh.castShadow = true
        weightMesh.add(
          new THREE.Mesh(
            new THREE.CylinderGeometry(0.32, 0.32, 0.1, 32),
            matteBlackMaterial,
          ),
        )
        tonearmAssembly.add(weightMesh)

        const startPt = new THREE.Vector3(0, 0.3, 0)
        const cp1 = new THREE.Vector3(-1.0, 0.3, -1.0)
        const cp2 = new THREE.Vector3(-2.0, 0.3, 1.0)
        const dx = platterX - armBaseX + 3.0
        const dz = platterZ - armBaseZ + 0.8
        const endPt = new THREE.Vector3(dx, 0.04, dz)

        const curve = new THREE.CatmullRomCurve3([startPt, cp1, cp2, endPt])
        const armMesh = new THREE.Mesh(
          new THREE.TubeGeometry(curve, 64, 0.05, 16, false),
          brushedAluminumMaterial,
        )
        armMesh.castShadow = true
        tonearmAssembly.add(armMesh)

        const headGroup = new THREE.Group()
        headGroup.position.copy(endPt)
        headGroup.rotation.y = Math.PI / 5

        const headMesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 0.1, 0.45),
          matteBlackMaterial,
        )
        headMesh.castShadow = true
        headGroup.add(headMesh)

        const fingerLift = new THREE.Mesh(
          new THREE.BoxGeometry(0.25, 0.02, 0.05),
          brushedAluminumMaterial,
        )
        fingerLift.position.set(0.15, -0.05, 0)
        headGroup.add(fingerLift)

        const stylusMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.01, 0.1, 8),
          brushedAluminumMaterial,
        )
        stylusMesh.position.set(0, -0.08, 0.15)
        stylusMesh.rotation.x = Math.PI / 8
        headGroup.add(stylusMesh)
        tonearmAssembly.add(headGroup)

        // 4. Knobs & Floor
        const createKnob = (x: number, z: number) => {
          const kGroup = new THREE.Group()
          kGroup.position.set(x, baseHeight, z)
          kGroup.add(
            new THREE.Mesh(
              new THREE.CylinderGeometry(0.32, 0.32, 0.04, 32),
              brushedAluminumMaterial,
            ).translateY(0.02),
          )
          const m = new THREE.Mesh(
            new THREE.CylinderGeometry(0.28, 0.28, 0.3, 32),
            brushedAluminumMaterial,
          )
          m.position.y = 0.15
          m.castShadow = true
          m.add(
            new THREE.Mesh(
              new THREE.CylinderGeometry(0.285, 0.285, 0.25, 64),
              new THREE.MeshStandardMaterial({
                color: 0x888888,
                wireframe: true,
                transparent: true,
                opacity: 0.3,
              }),
            ),
          )
          kGroup.add(m)
          return kGroup
        }
        turntableGroup.add(createKnob(4.2, 3.0), createKnob(2.8, 3.0))

        const plane = new THREE.Mesh(
          new THREE.PlaneGeometry(50, 50),
          new THREE.ShadowMaterial({ opacity: 0.2 }),
        )
        plane.rotation.x = -Math.PI / 2
        plane.position.y = -0.51
        plane.receiveShadow = true
        scene.add(plane)

        // --- Interaction Logic & Render Loop ---
        const raycaster = new THREE.Raycaster()
        const mouse = new THREE.Vector2()

        const getMousePosition = (event: MouseEvent) => {
          if (!containerRef.current) return
          const rect = containerRef.current.getBoundingClientRect()
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
        }

        const onClick = (event: PointerEvent) => {
          getMousePosition(event)
          raycaster.setFromCamera(mouse, camera)
          // Check if user clicked anywhere on the tonearm or its children
          const intersects = raycaster.intersectObject(tonearmAssembly, true)
          if (intersects.length > 0) {
            setIsPlaying((prev) => !prev)
          }
        }

        const onPointerMove = (event: PointerEvent) => {
          getMousePosition(event)
          raycaster.setFromCamera(mouse, camera)
          const intersects = raycaster.intersectObject(tonearmAssembly, true)

          // Change cursor to pointer when hovering over the tonearm
          if (containerRef.current) {
            if (intersects.length > 0) {
              containerRef.current.style.cursor = "pointer"
            } else {
              containerRef.current.style.cursor = "grab" // Default OrbitControls cursor
            }
          }
        }

        // Use pointerdown/pointermove for better mobile/desktop support
        window.addEventListener("pointerdown", onClick)
        window.addEventListener("pointermove", onPointerMove)

        const clock = new THREE.Clock()

        const animate = () => {
          animationFrameId = requestAnimationFrame(animate)
          const delta = clock.getDelta()
          if (controls) controls.update()


          // Animate tonearm and platter based on playing state
          if (isPlayingState) {
            platterGroup.rotation.y -= delta * 1.5; // Record spinning
            
            // Move tonearm over the record (Angle 0 means resting ON the record based on our geometry buildup)
            const targetRotationY = 0;
            tonearmAssembly.rotation.y += (targetRotationY - tonearmAssembly.rotation.y) * 5 * delta;
          } else {
            // Return tonearm back to resting position (Off the record)
            const targetRotationY = Math.PI / 8;
            tonearmAssembly.rotation.y += (targetRotationY - tonearmAssembly.rotation.y) * 5 * delta;
          }


          renderer.render(scene, camera)
        }

        animate()

        // Use custom property to bridge React state into strict Three.js loop
        ;(containerRef.current as any)._setInternalState = (
          playing: boolean,
        ) => {
          isPlayingState = playing
        }

        const handleResize = () => {
          if (!containerRef.current) return
          const w = containerRef.current.clientWidth
          const h = containerRef.current.clientHeight
          const newAspect = w / h
          camera.left = -d * newAspect
          camera.right = d * newAspect
          camera.top = d
          camera.bottom = -d
          camera.updateProjectionMatrix()
          renderer.setSize(w, h)
        }
        window.addEventListener("resize", handleResize)

        ;(containerRef.current as any)._cleanup = () => {
          cancelAnimationFrame(animationFrameId)
          window.removeEventListener("resize", handleResize)
          window.removeEventListener("pointerdown", onClick)
          window.removeEventListener("pointermove", onPointerMove)
          if (controls) controls.dispose()
          renderer.dispose()
        }
      } catch (err: any) {
        console.error(err)
        setErrorMsg(err.message)
      }
    }

    initThreeJS()

    return () => {
      const cleanup = (containerRef.current as any)?._cleanup
      if (cleanup) cleanup()
      if (containerRef.current && containerRef.current.firstChild) {
        containerRef.current.innerHTML = ""
      }
    }
  }, [])

  // Update Three.js loop variable whenever React state changes
  useEffect(() => {
    if (
      containerRef.current &&
      (containerRef.current as any)._setInternalState
    ) {
      ;(containerRef.current as any)._setInternalState(isPlaying)
    }
  }, [isPlaying])

  return (
    <div className="relative w-full h-screen bg-[#1a1a1a] overflow-hidden font-sans text-white">
      <div ref={containerRef} className="absolute inset-0 cursor-move" />

      {/* Modern UI */}
      <div className="absolute top-0 left-0 w-full p-8 pointer-events-none flex justify-between items-start z-10 mix-blend-difference">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-light tracking-tighter text-white drop-shadow-md">
            ZENITH <span className="font-bold">M-1</span>
          </h1>
          <p className="text-gray-400 tracking-widest text-sm uppercase">
            Procedural Turntable
          </p>
        </div>
        <div className="text-right flex flex-col items-end gap-3 text-white">
          <button
            className="pointer-events-auto flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-medium hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            onClick={(e) => {
              e.stopPropagation() // Prevent duplicate clicks on window logic
              setIsPlaying(!isPlaying)
            }}
          >
            {isPlaying ? (
              <>
                <div className="w-3 h-3 bg-red-500 rounded-sm animate-pulse" />{" "}
                STOP
              </>
            ) : (
              <>
                <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-black border-b-[6px] border-b-transparent" />{" "}
                PLAY
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
