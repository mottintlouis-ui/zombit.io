import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ShopItem } from '../types/economy';
import { ModelFactory } from '../game/ModelFactory';
import { TextureGenerator } from '../game/TextureGenerator';

interface Item3DViewerProps {
  item: ShopItem;
}

export const Item3DViewer: React.FC<Item3DViewerProps> = ({ item }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Dimensions
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 200;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.set(0, 1.2, 3.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(5, 8, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const accentLight = new THREE.PointLight(new THREE.Color(item.accentColor || '#38bdf8'), 2.5, 8);
    accentLight.position.set(-2, 2, 2);
    scene.add(accentLight);

    // Holographic Pedestal / Ground
    const pedestalGeo = new THREE.CylinderGeometry(1.4, 1.5, 0.1, 32);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.8,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -0.05;
    pedestal.receiveShadow = true;
    scene.add(pedestal);

    const holoRing = new THREE.Mesh(
      new THREE.RingGeometry(1.2, 1.35, 32),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(item.accentColor || '#00f0ff'), side: THREE.DoubleSide })
    );
    holoRing.rotation.x = -Math.PI / 2;
    holoRing.position.y = 0.01;
    scene.add(holoRing);

    // Root model holder
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    let animationTick: ((time: number) => void) | null = null;

    // Build specific 3D model based on category
    if (item.category === 'characters') {
      const color = item.previewData.color || '#0284c7';
      const playerModel = ModelFactory.createPlayerModel(color, item.accentColor, item.id);
      playerModel.root.scale.set(0.9, 0.9, 0.9);
      playerModel.root.position.y = 0.05;
      modelGroup.add(playerModel.root);

      animationTick = (t) => {
        // Subtle breathing idle
        playerModel.torso.position.y = 1.0 + Math.sin(t * 2) * 0.03;
        playerModel.leftArm.rotation.x = Math.sin(t * 1.5) * 0.08;
      };

      camera.position.set(0, 1.0, 3.2);
    } else if (item.category === 'weapons') {
      // Large detailed weapon showcase model
      const gunGroup = new THREE.Group();
      const metalMat = new THREE.MeshStandardMaterial({
        color: item.id === 'weapon_gold' ? 0xd97706 : 0x0f172a,
        metalness: 0.85,
        roughness: 0.2,
      });
      const glowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(item.accentColor) });

      // Receiver
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 1.6), metalMat);
      gunGroup.add(body);

      // Barrels
      const barrelTop = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 16), metalMat);
      barrelTop.rotation.x = Math.PI / 2;
      barrelTop.position.set(0, 0.12, 1.2);
      gunGroup.add(barrelTop);

      const barrelBot = barrelTop.clone();
      barrelBot.position.y = -0.1;
      gunGroup.add(barrelBot);

      // Glowing power cells
      const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.8, 12), glowMat);
      coil.rotation.x = Math.PI / 2;
      coil.position.set(0, 0.02, 0.1);
      gunGroup.add(coil);

      // Grip
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.3), metalMat);
      grip.position.set(0, -0.45, -0.2);
      grip.rotation.x = -0.25;
      gunGroup.add(grip);

      gunGroup.position.set(0, 0.8, 0);
      gunGroup.rotation.y = Math.PI / 4;
      modelGroup.add(gunGroup);

      animationTick = (t) => {
        gunGroup.position.y = 0.8 + Math.sin(t * 2) * 0.05;
      };

      camera.position.set(0, 0.8, 2.6);
    } else if (item.category === 'projectiles') {
      // Projectile showcase with glowing energy shell and orbiting trails
      const proj = ModelFactory.createProjectileModel('bullet', item.id === 'fx_solar' ? 'solar' : 'void');
      proj.mesh.scale.set(1.6, 1.6, 1.6);
      proj.mesh.position.set(0, 0.8, 0);
      modelGroup.add(proj.mesh);

      // Orbiting energy rings
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(item.accentColor),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.03, 8, 24), ringMat);
      ring.position.y = 0.8;
      modelGroup.add(ring);

      animationTick = (t) => {
        proj.mesh.rotation.y += 0.03;
        ring.rotation.x = Math.sin(t * 1.5) * 0.5;
        ring.rotation.y += 0.04;
      };

      camera.position.set(0, 0.8, 2.5);
    } else if (item.category === 'pets') {
      if (item.id === 'pet_cyberpup' || item.id.includes('pup') || item.id.includes('chien')) {
        // 3D Cyber-Puppy Pet Companion
        const puppy = ModelFactory.createPetPuppy(item.accentColor || '#ec4899');
        puppy.root.position.set(0, 0.1, 0);
        puppy.root.scale.set(1.45, 1.45, 1.45);
        puppy.root.rotation.y = Math.PI / 4;
        modelGroup.add(puppy.root);

        animationTick = (t) => {
          // Playful trot bounce & rapid wagging tail
          const runPhase = t * 6;
          puppy.root.position.y = 0.12 + Math.abs(Math.sin(runPhase)) * 0.05;
          puppy.frontLegL.rotation.x = Math.sin(runPhase) * 0.35;
          puppy.frontLegR.rotation.x = -Math.sin(runPhase) * 0.35;
          puppy.backLegL.rotation.x = -Math.sin(runPhase) * 0.3;
          puppy.backLegR.rotation.x = Math.sin(runPhase) * 0.3;

          // Happy tail wagging
          puppy.tail.rotation.y = Math.sin(t * 16) * 0.45;
          puppy.tail.rotation.z = Math.cos(t * 12) * 0.15;

          // Curious puppy head tilt & ear perk
          puppy.head.rotation.z = Math.sin(t * 2) * 0.12;
          puppy.head.rotation.y = Math.sin(t * 1.5) * 0.15;
          puppy.earL.rotation.z = 0.25 + Math.sin(t * 6) * 0.08;
          puppy.earR.rotation.z = -0.25 - Math.sin(t * 6) * 0.08;
        };

        camera.position.set(0, 0.55, 2.2);
      } else {
        // 3D Hover Drone Companion
        const drone = ModelFactory.createPetDrone();
        drone.position.set(0, 0.9, 0);
        drone.scale.set(1.4, 1.4, 1.4);
        modelGroup.add(drone);

        animationTick = (t) => {
          drone.position.y = 0.9 + Math.sin(t * 3) * 0.12;
          drone.rotation.y += 0.02;
        };

        camera.position.set(0, 0.9, 2.4);
      }
    } else {
      // Emote or Supply Pack
      const crateMat = new THREE.MeshStandardMaterial({
        map: TextureGenerator.getCrateTexture(),
        roughness: 0.6,
        metalness: 0.3,
      });
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), crateMat);
      box.position.y = 0.65;
      modelGroup.add(box);

      const aura = new THREE.Mesh(
        new THREE.RingGeometry(0.8, 1.0, 24),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(item.accentColor), side: THREE.DoubleSide })
      );
      aura.rotation.x = -Math.PI / 2;
      aura.position.y = 0.02;
      modelGroup.add(aura);

      animationTick = (t) => {
        box.position.y = 0.65 + Math.sin(t * 2) * 0.04;
      };

      camera.position.set(0, 0.8, 2.8);
    }

    // Interactive Drag to Rotate
    let isDragging = false;
    let prevMouseX = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      prevMouseX = e.clientX;
      modelGroup.rotation.y += deltaX * 0.015;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Render loop
    let animId: number;
    const startTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startTime) / 1000;

      // Slow idle turntable rotation when not dragging
      if (!isDragging) {
        modelGroup.rotation.y += 0.008;
      }

      if (animationTick) {
        animationTick(elapsed);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      // Deep clean scene geometries, materials and textures
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).geometry?.dispose();
          const mat = (child as THREE.Mesh).material;
          if (Array.isArray(mat)) {
            mat.forEach((m) => {
              (m as THREE.Material & { map?: THREE.Texture }).map?.dispose();
              m.dispose();
            });
          } else if (mat) {
            (mat as THREE.Material & { map?: THREE.Texture }).map?.dispose();
            mat.dispose();
          }
        }
      });
      scene.clear();

      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [item]);

  return (
    <div
      ref={containerRef}
      className="w-full h-48 rounded-xl overflow-hidden relative cursor-grab active:cursor-grabbing select-none border border-neutral-800 bg-neutral-950 shadow-inner"
    >
      <div className="absolute top-2 left-2 z-10 pointer-events-none flex items-center gap-1.5 bg-neutral-900/80 px-2 py-0.5 rounded text-[10px] text-cyan-300 font-mono border border-neutral-700/60">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span>Vue 3D Interactive (Glissez pour tourner)</span>
      </div>
    </div>
  );
};
