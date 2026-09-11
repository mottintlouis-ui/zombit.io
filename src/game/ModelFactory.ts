import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator';
import { ZombieType } from '../types/game';

/**
 * High-detail 3D Model Factory for Zombie Core Arena.
 * Creates articulated, textured 3D characters, monsters, weapons, and projectiles.
 */
export class ModelFactory {
  /**
   * Creates an articulated, high-detail 3D Survivor Player model with skin accessories and custom weapon styling
   */
  public static createPlayerModel(
    skinColorHex: string = '#0284c7',
    accentHex: string = '#00f0ff',
    skinId: string = 'skin_default',
    weaponSkinId: string = 'weapon_plasma'
  ): {
    root: THREE.Group;
    leftLeg: THREE.Group;
    rightLeg: THREE.Group;
    leftArm: THREE.Group;
    rightArm: THREE.Group;
    torso: THREE.Group;
    head: THREE.Group;
    gun: THREE.Group;
    muzzlePoint: THREE.Vector3;
  } {
    // Determine effective colors if not explicitly overridden
    let effectiveSkinColor = skinColorHex;
    let effectiveAccent = accentHex;

    if (skinId === 'skin_ronin') {
      if (skinColorHex === '#0284c7') effectiveSkinColor = '#0f172a';
      if (accentHex === '#00f0ff') effectiveAccent = '#38bdf8';
    } else if (skinId === 'skin_hazmat') {
      if (skinColorHex === '#0284c7') effectiveSkinColor = '#65a30d';
      if (accentHex === '#00f0ff') effectiveAccent = '#84cc16';
    } else if (skinId === 'skin_valkyrie') {
      if (skinColorHex === '#0284c7') effectiveSkinColor = '#d97706';
      if (accentHex === '#00f0ff') effectiveAccent = '#f59e0b';
    }

    const root = new THREE.Group();
    root.name = 'player_root';

    const armorTexture = TextureGenerator.getSurvivorArmorTexture(effectiveSkinColor, effectiveAccent);

    const armorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(effectiveSkinColor),
      map: armorTexture,
      roughness: 0.35,
      metalness: 0.65,
    });

    const darkSuitMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.7,
      metalness: 0.3,
    });

    const glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(effectiveAccent),
    });

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.25,
      metalness: 0.85,
    });

    // 1. Torso & Pelvis
    const torso = new THREE.Group();
    torso.position.y = 1.0;
    root.add(torso);

    // Main chest armor
    const chestGeo = new THREE.BoxGeometry(0.75, 0.7, 0.48);
    const chest = new THREE.Mesh(chestGeo, armorMat);
    chest.castShadow = true;
    torso.add(chest);

    // Glowing Chest Arc Reactor Core
    const coreGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 16);
    const core = new THREE.Mesh(coreGeo, glowMat);
    core.rotation.x = Math.PI / 2;
    core.position.set(0, 0.08, 0.24);
    torso.add(core);

    // Core protector ring
    const ringGeo = new THREE.TorusGeometry(0.14, 0.03, 8, 16);
    const ring = new THREE.Mesh(ringGeo, metalMat);
    ring.position.set(0, 0.08, 0.24);
    torso.add(ring);

    // Tactical Belt & Pouches
    const beltGeo = new THREE.BoxGeometry(0.78, 0.14, 0.5);
    const belt = new THREE.Mesh(beltGeo, darkSuitMat);
    belt.position.y = -0.32;
    torso.add(belt);

    // Belt buckle
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.54), metalMat);
    buckle.position.y = -0.32;
    torso.add(buckle);

    // Back Thruster / Jetpack
    const jetpack = new THREE.Group();
    jetpack.position.set(0, 0.05, -0.3);
    const packBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.2), metalMat);
    packBody.castShadow = true;
    jetpack.add(packBody);

    // Twin exhaust thruster cones
    const thrusterGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.2, 12);
    const tLeft = new THREE.Mesh(thrusterGeo, metalMat);
    tLeft.position.set(-0.16, -0.28, 0);
    const tGlowL = new THREE.Mesh(new THREE.CircleGeometry(0.09, 12), glowMat);
    tGlowL.rotation.x = Math.PI / 2;
    tGlowL.position.y = -0.1;
    tLeft.add(tGlowL);
    jetpack.add(tLeft);

    const tRight = tLeft.clone();
    tRight.position.x = 0.16;
    jetpack.add(tRight);
    torso.add(jetpack);

    // 2. Head & Combat Helmet
    const head = new THREE.Group();
    head.position.y = 0.55;
    torso.add(head);

    // Helmet dome
    const helmetGeo = new THREE.SphereGeometry(0.28, 16, 12);
    const helmet = new THREE.Mesh(helmetGeo, armorMat);
    helmet.scale.set(1.0, 1.1, 1.05);
    helmet.castShadow = true;
    head.add(helmet);

    // Cyber Visor HUD (Glowing Curved Band - facing directly forward +Z)
    const visorGeo = new THREE.CylinderGeometry(0.295, 0.295, 0.13, 24, 1, false, -Math.PI / 3.2, (Math.PI * 2) / 3.2);
    const visor = new THREE.Mesh(visorGeo, glowMat);
    // CylinderGeometry centered on angle 0 points along +Z. No Y rotation so it faces straight ahead!
    visor.rotation.y = 0;
    visor.position.set(0, 0.04, 0.01);
    head.add(visor);

    // Front Visor Brow Guard (angled armor rim above eyes)
    const browGeo = new THREE.BoxGeometry(0.42, 0.05, 0.14);
    const brow = new THREE.Mesh(browGeo, armorMat);
    brow.position.set(0, 0.12, 0.22);
    brow.rotation.x = 0.2;
    head.add(brow);

    // Lower Front Cyber Respirator / Faceplate (mouth & chin)
    const breathGeo = new THREE.BoxGeometry(0.24, 0.13, 0.14);
    const breathMesh = new THREE.Mesh(breathGeo, metalMat);
    breathMesh.position.set(0, -0.11, 0.22);
    breathMesh.castShadow = true;
    const breathVent = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.02), glowMat);
    breathVent.position.set(0, 0, 0.072);
    breathMesh.add(breathVent);
    head.add(breathMesh);

    // Tactical Ear modules (Symmetrical left & right)
    const earGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12);
    const earL = new THREE.Mesh(earGeo, metalMat);
    earL.rotation.z = Math.PI / 2;
    earL.position.set(-0.28, 0.02, 0);
    head.add(earL);

    const earR = earL.clone();
    earR.position.x = 0.28;
    head.add(earR);

    // Tactical comm antenna on right ear
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 6), metalMat);
    antenna.position.set(0.28, 0.2, -0.04);
    antenna.rotation.z = -0.12;
    head.add(antenna);

    // Character Accessories: Toxic Hazmat Filters
    if (skinId === 'skin_hazmat') {
      const filterGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.16, 8);
      const filterMat = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.35 });
      const f1 = new THREE.Mesh(filterGeo, filterMat);
      f1.position.set(-0.18, -0.08, 0.22);
      f1.rotation.x = Math.PI / 4;
      head.add(f1);
      const f2 = f1.clone();
      f2.position.x = 0.18;
      head.add(f2);
    }

    // Character Accessories: Neon Ronin Katanas or Valkyrie Wings on torso
    if (skinId === 'skin_ronin') {
      const katanaGeo = new THREE.BoxGeometry(0.06, 1.25, 0.04);
      const bladeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const k1 = new THREE.Mesh(katanaGeo, bladeMat);
      k1.rotation.z = 0.45;
      k1.position.set(-0.24, 0.15, -0.38);
      torso.add(k1);
      const k2 = k1.clone();
      k2.rotation.z = -0.45;
      k2.position.x = 0.24;
      torso.add(k2);
    } else if (skinId === 'skin_valkyrie') {
      const wingMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, side: THREE.DoubleSide });
      const wingGeo = new THREE.PlaneGeometry(0.85, 0.32);
      const w1 = new THREE.Mesh(wingGeo, wingMat);
      w1.rotation.set(0, 0.3, 0.4);
      w1.position.set(-0.55, 0.18, -0.34);
      torso.add(w1);
      const w2 = w1.clone();
      w2.rotation.set(0, -0.3, -0.4);
      w2.position.x = 0.55;
      torso.add(w2);
    }

    // 3. Articulated Legs
    // Left Leg
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.22, -0.38, 0);
    torso.add(leftLeg);

    const legUpperGeo = new THREE.BoxGeometry(0.24, 0.36, 0.26);
    const legUpperL = new THREE.Mesh(legUpperGeo, darkSuitMat);
    legUpperL.position.y = -0.18;
    legUpperL.castShadow = true;
    leftLeg.add(legUpperL);

    // Knee armor
    const kneeL = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.14, 0.12), armorMat);
    kneeL.position.set(0, -0.36, 0.12);
    leftLeg.add(kneeL);

    // Boot
    const bootGeo = new THREE.BoxGeometry(0.25, 0.34, 0.38);
    const bootL = new THREE.Mesh(bootGeo, metalMat);
    bootL.position.set(0, -0.52, 0.04);
    bootL.castShadow = true;
    leftLeg.add(bootL);

    // Right Leg
    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.22, -0.38, 0);
    torso.add(rightLeg);

    const legUpperR = new THREE.Mesh(legUpperGeo, darkSuitMat);
    legUpperR.position.y = -0.18;
    legUpperR.castShadow = true;
    rightLeg.add(legUpperR);

    const kneeR = kneeL.clone();
    rightLeg.add(kneeR);

    const bootR = bootL.clone();
    rightLeg.add(bootR);

    // 4. Articulated Arms & Weapon
    // Left Arm (Tactical gauntlet / wrist shield)
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.46, 0.22, 0);
    torso.add(leftArm);

    // Shoulder pauldron
    const pauldronGeo = new THREE.BoxGeometry(0.28, 0.24, 0.32);
    const pauldronL = new THREE.Mesh(pauldronGeo, armorMat);
    pauldronL.castShadow = true;
    leftArm.add(pauldronL);

    const armUpperL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.38, 0.2), darkSuitMat);
    armUpperL.position.set(0, -0.22, 0);
    armUpperL.castShadow = true;
    leftArm.add(armUpperL);

    // Wrist computer gauntlet
    const gauntletL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.26), armorMat);
    gauntletL.position.set(0, -0.42, 0.04);
    const screenGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.1), glowMat);
    screenGlow.rotation.x = -Math.PI / 4;
    screenGlow.position.set(0, 0.12, 0.08);
    gauntletL.add(screenGlow);
    leftArm.add(gauntletL);

    // Right Arm (Holding Gun)
    const rightArm = new THREE.Group();
    rightArm.position.set(0.46, 0.22, 0);
    torso.add(rightArm);

    const pauldronR = pauldronL.clone();
    rightArm.add(pauldronR);

    const armUpperR = armUpperL.clone();
    rightArm.add(armUpperR);

    // Hand/Gauntlet R
    const gauntletR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 0.24), armorMat);
    gauntletR.position.set(0, -0.42, 0.04);
    rightArm.add(gauntletR);

    // 5. Detailed Futuristic Plasma Blaster Gun with Custom Weapon Skins
    const gun = new THREE.Group();
    gun.position.set(0.04, -0.4, 0.24);
    rightArm.add(gun);

    let weaponChassisMat = metalMat;
    let weaponGlowMat = glowMat;
    let weaponBarrelMat = metalMat;

    if (weaponSkinId === 'weapon_crimson') {
      weaponChassisMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0f, roughness: 0.2, metalness: 0.9 });
      weaponGlowMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      weaponBarrelMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.3, metalness: 0.8 });
    } else if (weaponSkinId === 'weapon_gold') {
      weaponChassisMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.15, metalness: 0.95 });
      weaponGlowMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
      weaponBarrelMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.2, metalness: 0.9 });
    }

    // Main receiver chassis
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.65), weaponChassisMat);
    receiver.position.set(0, 0.04, 0.1);
    receiver.castShadow = true;
    gun.add(receiver);

    // Dual plasma barrels
    const barrelGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.6, 12);
    const barrelTop = new THREE.Mesh(barrelGeo, weaponBarrelMat);
    barrelTop.rotation.x = Math.PI / 2;
    barrelTop.position.set(0, 0.08, 0.55);
    barrelTop.castShadow = true;
    gun.add(barrelTop);

    const barrelBottom = barrelTop.clone();
    barrelBottom.position.y = -0.02;
    gun.add(barrelBottom);

    // Glowing energy heat sinks on weapon side
    const heatSinkGeo = new THREE.BoxGeometry(0.19, 0.08, 0.35);
    const heatSink = new THREE.Mesh(heatSinkGeo, weaponGlowMat);
    heatSink.position.set(0, 0.04, 0.18);
    gun.add(heatSink);

    // Battery power cell magazine
    const magGeo = new THREE.BoxGeometry(0.12, 0.26, 0.16);
    const mag = new THREE.Mesh(magGeo, armorMat);
    mag.position.set(0, -0.16, 0.05);
    gun.add(mag);

    // Muzzle tip socket for projectile spawn
    const muzzlePoint = new THREE.Vector3(0.5, 0.95, 0.95);

    return { root, leftLeg, rightLeg, leftArm, rightArm, torso, head, gun, muzzlePoint };
  }

  /**
   * Creates an articulated, stylized 3D Zombie / Monster model
   */
  public static createZombieModel(type: ZombieType, scale: number = 1.0): {
    root: THREE.Group;
    torso: THREE.Group;
    head: THREE.Group;
    leftArm: THREE.Group;
    rightArm: THREE.Group;
    leftLeg: THREE.Group;
    rightLeg: THREE.Group;
    height: number;
    radius: number;
  } {
    const root = new THREE.Group();
    root.name = `zombie_${type}`;

    const fleshTex = TextureGenerator.getZombieFleshTexture(type);

    let skinColor = 0x22c55e;
    let eyeColor = 0xef4444;
    let metalColor = 0x334155;
    let height = 1.8 * scale;
    let radius = 0.65 * scale;

    switch (type) {
      case 'runner':
        skinColor = 0xef4444;
        eyeColor = 0xffe600;
        break;
      case 'toxic':
        skinColor = 0xa3e635;
        eyeColor = 0x22c55e;
        break;
      case 'armored':
        skinColor = 0x475569;
        eyeColor = 0x38bdf8;
        metalColor = 0x1e293b;
        break;
      case 'explosive':
        skinColor = 0xf97316;
        eyeColor = 0xff0000;
        break;
      case 'summoner':
        skinColor = 0xa855f7;
        eyeColor = 0xec4899;
        break;
      case 'elite':
        skinColor = 0xeab308;
        eyeColor = 0xff0055;
        scale = 1.45;
        height = 2.4;
        radius = 0.9;
        break;
      case 'boss':
        skinColor = 0xdc2626;
        eyeColor = 0xff0044;
        scale = 2.6;
        height = 4.6;
        radius = 1.8;
        break;
      default:
        skinColor = 0x34d399;
        eyeColor = 0xff3b30;
        break;
    }

    const fleshMat = new THREE.MeshStandardMaterial({
      color: skinColor,
      map: fleshTex,
      roughness: 0.6,
      metalness: 0.25,
    });

    const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });
    const boneMat = new THREE.MeshStandardMaterial({ color: 0xecfccb, roughness: 0.8 });
    const metalMat = new THREE.MeshStandardMaterial({ color: metalColor, metalness: 0.7, roughness: 0.4 });

    // 1. Torso (Hunched monster chest)
    const torso = new THREE.Group();
    torso.position.y = 0.85 * scale;
    root.add(torso);

    const chestGeo = new THREE.BoxGeometry(0.7 * scale, 0.65 * scale, 0.48 * scale);
    const chest = new THREE.Mesh(chestGeo, fleshMat);
    chest.castShadow = true;
    chest.receiveShadow = true;
    chest.rotation.x = 0.2; // Hunched forward
    torso.add(chest);

    // Ribcage / Decay detail on chest
    for (let r = -2; r <= 2; r++) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.55 * scale, 0.05 * scale, 0.52 * scale), boneMat);
      rib.position.set(0, r * 0.09 * scale, 0.02 * scale);
      rib.rotation.x = 0.2;
      torso.add(rib);
    }

    // Spine bumps on back
    for (let s = -2; s <= 2; s++) {
      const vert = new THREE.Mesh(new THREE.ConeGeometry(0.06 * scale, 0.16 * scale, 4), boneMat);
      vert.rotation.x = -Math.PI / 3;
      vert.position.set(0, s * 0.11 * scale, -0.26 * scale);
      torso.add(vert);
    }

    // Type-specific accessories
    if (type === 'armored') {
      // Iron breastplate
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.76 * scale, 0.5 * scale, 0.22 * scale), metalMat);
      plate.position.set(0, 0.04 * scale, 0.18 * scale);
      torso.add(plate);
    } else if (type === 'toxic') {
      // Glowing toxic boil pustules
      const boilMat = new THREE.MeshBasicMaterial({ color: 0x84cc16 });
      for (let b = 0; b < 3; b++) {
        const boil = new THREE.Mesh(new THREE.SphereGeometry(0.14 * scale, 8, 8), boilMat);
        boil.position.set((b - 1) * 0.22 * scale, 0.25 * scale, -0.15 * scale);
        torso.add(boil);
      }
    } else if (type === 'explosive') {
      // Bloated pulsating glowing bomb core
      const bombMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
      const belly = new THREE.Mesh(new THREE.SphereGeometry(0.38 * scale, 12, 12), bombMat);
      belly.position.set(0, -0.05 * scale, 0.22 * scale);
      torso.add(belly);

      // Warning hazard tank on back
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * scale, 0.14 * scale, 0.5 * scale, 8), metalMat);
      tank.position.set(0, 0.05 * scale, -0.32 * scale);
      torso.add(tank);
    }

    // 2. Head & Mutated Snarl
    const head = new THREE.Group();
    head.position.set(0, 0.52 * scale, 0.16 * scale); // Positioned forward due to hunched spine
    torso.add(head);

    const craniumGeo = new THREE.BoxGeometry(0.48 * scale, 0.42 * scale, 0.46 * scale);
    const cranium = new THREE.Mesh(craniumGeo, fleshMat);
    cranium.castShadow = true;
    head.add(cranium);

    // Open lower jaw (snarl)
    const jawGeo = new THREE.BoxGeometry(0.44 * scale, 0.14 * scale, 0.32 * scale);
    const jaw = new THREE.Mesh(jawGeo, fleshMat);
    jaw.position.set(0, -0.22 * scale, 0.1 * scale);
    jaw.rotation.x = 0.25;
    head.add(jaw);

    // Fangs / Teeth
    for (let t = -1; t <= 1; t += 2) {
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.03 * scale, 0.1 * scale, 4), boneMat);
      tooth.rotation.x = Math.PI;
      tooth.position.set(t * 0.15 * scale, -0.09 * scale, 0.22 * scale);
      head.add(tooth);
    }

    // Glowing Eyes
    const eyeGeo = new THREE.BoxGeometry(0.11 * scale, 0.08 * scale, 0.08 * scale);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.14 * scale, 0.06 * scale, 0.23 * scale);
    head.add(eyeL);

    const eyeR = eyeL.clone();
    eyeR.position.x = 0.14 * scale;
    head.add(eyeR);

    // Armored helmet or horns
    if (type === 'armored') {
      const helm = new THREE.Mesh(new THREE.BoxGeometry(0.56 * scale, 0.28 * scale, 0.54 * scale), metalMat);
      helm.position.y = 0.16 * scale;
      head.add(helm);
    } else if (type === 'boss' || type === 'summoner') {
      // Demonic horns
      const hornGeo = new THREE.ConeGeometry(0.08 * scale, 0.45 * scale, 6);
      const hornL = new THREE.Mesh(hornGeo, boneMat);
      hornL.rotation.set(-0.3, 0, -0.4);
      hornL.position.set(-0.25 * scale, 0.35 * scale, -0.05 * scale);
      head.add(hornL);

      const hornR = hornL.clone();
      hornR.rotation.z = 0.4;
      hornR.position.x = 0.25 * scale;
      head.add(hornR);
    }

    // 3. Outstretched Reaching Zombie Arms
    // Left Arm
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.44 * scale, 0.2 * scale, 0.05 * scale);
    torso.add(leftArm);

    const armGeo = new THREE.BoxGeometry(0.18 * scale, 0.55 * scale, 0.18 * scale);
    const armL = new THREE.Mesh(armGeo, fleshMat);
    armL.position.set(0, 0, 0.2 * scale);
    armL.rotation.x = -Math.PI / 2.3; // Reaching forward
    armL.castShadow = true;
    leftArm.add(armL);

    // Claws / Hand
    const handL = new THREE.Mesh(new THREE.BoxGeometry(0.22 * scale, 0.14 * scale, 0.18 * scale), boneMat);
    handL.position.set(0, 0.02 * scale, 0.46 * scale);
    leftArm.add(handL);

    // Right Arm
    const rightArm = new THREE.Group();
    rightArm.position.set(0.44 * scale, 0.2 * scale, 0.05 * scale);
    torso.add(rightArm);

    const armR = armL.clone();
    rightArm.add(armR);
    const handR = handL.clone();
    rightArm.add(handR);

    // 4. Shuffling Legs
    // Left Leg
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.2 * scale, -0.35 * scale, 0);
    torso.add(leftLeg);

    const legGeo = new THREE.BoxGeometry(0.22 * scale, 0.52 * scale, 0.22 * scale);
    const legL = new THREE.Mesh(legGeo, fleshMat);
    legL.position.y = -0.26 * scale;
    legL.castShadow = true;
    leftLeg.add(legL);

    // Foot
    const footL = new THREE.Mesh(new THREE.BoxGeometry(0.22 * scale, 0.12 * scale, 0.32 * scale), boneMat);
    footL.position.set(0, -0.52 * scale, 0.06 * scale);
    leftLeg.add(footL);

    // Right Leg
    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.2 * scale, -0.35 * scale, 0);
    torso.add(rightLeg);

    const legR = legL.clone();
    rightLeg.add(legR);
    const footR = footL.clone();
    rightLeg.add(footR);

    return { root, torso, head, leftArm, rightArm, leftLeg, rightLeg, height, radius };
  }

  /**
   * Creates a high-fidelity 3D Projectile model with textures and glowing energy
   */
  public static createProjectileModel(type: 'bullet' | 'railgun' | 'bomb', fxType: string = 'default'): {
    mesh: THREE.Group;
    radius: number;
  } {
    const group = new THREE.Group();
    const isSolar = fxType === 'solar' || fxType.includes('solar');
    const isVoid = fxType === 'void' || fxType.includes('void');

    const projTex = TextureGenerator.getProjectileTexture(
      isSolar ? 'solar' : isVoid ? 'void' : type === 'railgun' ? 'railgun' : type === 'bomb' ? 'bomb' : 'plasma'
    );

    let coreColor = 0x00f0ff;
    let shellColor = 0x0284c7;

    if (isSolar) {
      coreColor = 0xfbbf24;
      shellColor = 0xf97316;
    } else if (isVoid) {
      coreColor = 0xe879f9;
      shellColor = 0x9333ea;
    } else if (type === 'railgun') {
      coreColor = 0xff4444;
      shellColor = 0xb91c1c;
    } else if (type === 'bomb') {
      coreColor = 0xf97316;
      shellColor = 0x7c2d12;
    }

    const energyMat = new THREE.MeshBasicMaterial({ color: coreColor });
    const shellMat = new THREE.MeshStandardMaterial({
      color: shellColor,
      map: projTex,
      metalness: 0.8,
      roughness: 0.3,
    });

    if (type === 'bullet') {
      // 3D Aerodynamic Plasma Dart
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.38, 12), energyMat);
      nose.rotation.x = Math.PI / 2;
      nose.position.z = 0.25;
      group.add(nose);

      const core = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.45, 12), shellMat);
      core.rotation.x = Math.PI / 2;
      group.add(core);

      // 4 Stabilizer fins
      for (let i = 0; i < 4; i++) {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.25), shellMat);
        fin.rotation.z = (i * Math.PI) / 2;
        fin.position.z = -0.15;
        group.add(fin);
      }

      // Trailing glow halo
      const halo = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), energyMat);
      halo.scale.set(0.7, 0.7, 1.4);
      group.add(halo);

      return { mesh: group, radius: 0.4 };
    } else if (type === 'railgun') {
      // High-velocity sabot dart with magnetic rings
      const dart = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 12), energyMat);
      dart.rotation.x = Math.PI / 2;
      group.add(dart);

      // Swept fins
      for (let i = 0; i < 4; i++) {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.6), shellMat);
        fin.rotation.z = (i * Math.PI) / 2;
        fin.position.z = -0.8;
        group.add(fin);
      }

      // Magnetic rings along dart length
      for (let r = -0.5; r <= 0.5; r += 0.35) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 8, 16), shellMat);
        ring.position.z = r;
        group.add(ring);
      }

      return { mesh: group, radius: 0.6 };
    } else {
      // Bio-Mortar Shell Bomb
      const warhead = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), energyMat);
      group.add(warhead);

      const casing = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.45, 12), shellMat);
      casing.rotation.x = Math.PI / 2;
      group.add(casing);

      // Flashing proximity tip
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      tip.rotation.x = Math.PI / 2;
      tip.position.z = 0.32;
      group.add(tip);

      return { mesh: group, radius: 0.55 };
    }
  }

  /**
   * Creates a 3D Hover Drone Companion (Pet)
   */
  public static createPetDrone(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'companion_drone';

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.25, metalness: 0.7 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.8 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });

    // Central spherical chassis
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), bodyMat);
    body.castShadow = true;
    group.add(body);

    // Glowing Cyclops Eye
    const eye = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16), eyeMat);
    eye.rotation.x = Math.PI / 2;
    eye.position.set(0, 0.05, 0.28);
    group.add(eye);

    // Eye visor bezel
    const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 8, 16), darkMat);
    bezel.position.set(0, 0.05, 0.28);
    group.add(bezel);

    // Twin side thrusters
    const thrusters: THREE.Mesh[] = [];
    for (let s = -1; s <= 1; s += 2) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.06, 0.06), darkMat);
      arm.position.set(s * 0.32, 0, 0);
      group.add(arm);

      const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.22, 12), darkMat);
      thruster.position.set(s * 0.44, 0, 0);
      group.add(thruster);
      thrusters.push(thruster);

      const glowRing = new THREE.Mesh(new THREE.RingGeometry(0.04, 0.09, 12), eyeMat);
      glowRing.rotation.x = Math.PI / 2;
      glowRing.position.set(s * 0.44, -0.12, 0);
      group.add(glowRing);
    }

    // Top Antenna
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 6), darkMat);
    ant.position.set(0, 0.38, -0.05);
    group.add(ant);

    const antTip = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeMat);
    antTip.position.set(0, 0.48, -0.05);
    group.add(antTip);

    group.userData = {
      type: 'drone',
      eye,
      thrusters,
      antTip,
    };

    return group;
  }

  /**
   * Creates an adorable, articulated 3D Cyber-Puppy Companion (Pet)
   */
  public static createPetPuppy(accentHex: string = '#ec4899'): {
    root: THREE.Group;
    frontLegL: THREE.Group;
    frontLegR: THREE.Group;
    backLegL: THREE.Group;
    backLegR: THREE.Group;
    tail: THREE.Group;
    head: THREE.Group;
    earL: THREE.Group;
    earR: THREE.Group;
  } {
    const root = new THREE.Group();
    root.name = 'companion_puppy';

    // Materials
    const furColor = 0xf8fafc; // Sleek white cyber-coat
    const darkAccent = 0x1e293b; // Tactical carbon frame
    const accentColor = new THREE.Color(accentHex).getHex(); // Vibrant pink/magenta cyber glow

    const coatMat = new THREE.MeshStandardMaterial({
      color: furColor,
      roughness: 0.3,
      metalness: 0.35,
    });
    const frameMat = new THREE.MeshStandardMaterial({
      color: darkAccent,
      roughness: 0.45,
      metalness: 0.8,
    });
    const glowMat = new THREE.MeshBasicMaterial({ color: accentColor });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 }); // Big cute bright eyes
    const noseMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });

    // 1. Torso / Body
    const torsoGroup = new THREE.Group();
    torsoGroup.position.y = 0.36;
    root.add(torsoGroup);

    // Main puppy body (capsule / rounded box)
    const bodyGeo = new THREE.BoxGeometry(0.36, 0.32, 0.58);
    const bodyMesh = new THREE.Mesh(bodyGeo, coatMat);
    bodyMesh.castShadow = true;
    torsoGroup.add(bodyMesh);

    // Belly undercarriage armor
    const belly = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.48), frameMat);
    belly.position.y = -0.14;
    torsoGroup.add(belly);

    // Cute tactical harness / saddle on back
    const harness = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 0.32), frameMat);
    harness.position.set(0, 0.16, 0.02);
    torsoGroup.add(harness);

    // Glowing cyber battery pack / sound emitter on harness
    const pack = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.22, 12), glowMat);
    pack.rotation.z = Math.PI / 2;
    pack.position.set(0, 0.22, 0.02);
    torsoGroup.add(pack);

    // Glowing side stripe decals
    for (let s = -1; s <= 1; s += 2) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.04), glowMat);
      stripe.position.set(s * 0.185, 0.02, 0.02);
      stripe.rotation.y = s * (Math.PI / 2);
      torsoGroup.add(stripe);
    }

    // 2. Collar with Glowing Tag
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.035, 8, 18), glowMat);
    collar.position.set(0, 0.08, 0.28);
    torsoGroup.add(collar);

    const tag = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.03), glowMat);
    tag.position.set(0, -0.06, 0.31);
    torsoGroup.add(tag);

    // 3. Head & Snout (Articulated for looking, barking and agacing)
    const head = new THREE.Group();
    head.position.set(0, 0.18, 0.36);
    torsoGroup.add(head);

    // Head skull
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.3), coatMat);
    headMesh.castShadow = true;
    head.add(headMesh);

    // Cheeks / jaw rounding
    const cheekL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.2), coatMat);
    cheekL.position.set(-0.16, -0.04, 0.04);
    head.add(cheekL);
    const cheekR = cheekL.clone();
    cheekR.position.x = 0.16;
    head.add(cheekR);

    // Cute Snout / Muzzle
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.22), coatMat);
    snout.position.set(0, -0.06, 0.22);
    head.add(snout);

    // Cute shiny black nose
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.06), noseMat);
    nose.position.set(0, 0.02, 0.33);
    head.add(nose);

    // Cute cyber puppy mouth line
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.08), frameMat);
    mouth.position.set(0, -0.11, 0.22);
    head.add(mouth);

    // Expressive Bright Cyber Eyes
    for (let s = -1; s <= 1; s += 2) {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.03), eyeMat);
      eye.position.set(s * 0.1, 0.05, 0.155);
      head.add(eye);

      // Cute brow mark above eye
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.025, 0.02), glowMat);
      brow.position.set(s * 0.1, 0.11, 0.155);
      head.add(brow);
    }

    // 4. Cute Articulated Cyber Ears (floppy/perked Shiba/Corgi style)
    const earL = new THREE.Group();
    earL.position.set(-0.14, 0.15, -0.02);
    earL.rotation.z = 0.25; // perked tilt
    head.add(earL);

    const earGeo = new THREE.BoxGeometry(0.09, 0.22, 0.12);
    const earMeshL = new THREE.Mesh(earGeo, coatMat);
    earMeshL.position.y = 0.1;
    earL.add(earMeshL);

    // Glowing pink inner ear pad
    const innerEarL = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.16), glowMat);
    innerEarL.position.set(0, 0.1, 0.062);
    earL.add(innerEarL);

    const earR = new THREE.Group();
    earR.position.set(0.14, 0.15, -0.02);
    earR.rotation.z = -0.25;
    head.add(earR);

    const earMeshR = new THREE.Mesh(earGeo, coatMat);
    earMeshR.position.y = 0.1;
    earR.add(earMeshR);

    const innerEarR = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.16), glowMat);
    innerEarR.position.set(0, 0.1, 0.062);
    earR.add(innerEarR);

    // 5. Tail (Articulated for rapid wagging)
    const tail = new THREE.Group();
    tail.position.set(0, 0.1, -0.28);
    tail.rotation.x = 0.45; // curled up happily
    torsoGroup.add(tail);

    const tailMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.26, 8), coatMat);
    tailMesh.position.set(0, 0.12, -0.04);
    tailMesh.rotation.x = -0.3;
    tail.add(tailMesh);

    // Glowing fluffy tail tip orb
    const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), glowMat);
    tailTip.position.set(0, 0.24, -0.08);
    tail.add(tailTip);

    // 6. Four Articulated Legs for Running & Trotting
    const legGeo = new THREE.BoxGeometry(0.1, 0.26, 0.1);
    const pawGeo = new THREE.BoxGeometry(0.12, 0.08, 0.15);

    // Front Left Leg
    const frontLegL = new THREE.Group();
    frontLegL.position.set(-0.16, -0.08, 0.18);
    torsoGroup.add(frontLegL);
    const fLegMeshL = new THREE.Mesh(legGeo, frameMat);
    fLegMeshL.position.y = -0.13;
    frontLegL.add(fLegMeshL);
    const pawFL = new THREE.Mesh(pawGeo, coatMat);
    pawFL.position.set(0, -0.24, 0.03);
    frontLegL.add(pawFL);

    // Front Right Leg
    const frontLegR = new THREE.Group();
    frontLegR.position.set(0.16, -0.08, 0.18);
    torsoGroup.add(frontLegR);
    const fLegMeshR = new THREE.Mesh(legGeo, frameMat);
    fLegMeshR.position.y = -0.13;
    frontLegR.add(fLegMeshR);
    const pawFR = new THREE.Mesh(pawGeo, coatMat);
    pawFR.position.set(0, -0.24, 0.03);
    frontLegR.add(pawFR);

    // Back Left Leg
    const backLegL = new THREE.Group();
    backLegL.position.set(-0.16, -0.08, -0.18);
    torsoGroup.add(backLegL);
    const bLegMeshL = new THREE.Mesh(legGeo, frameMat);
    bLegMeshL.position.y = -0.13;
    backLegL.add(bLegMeshL);
    const pawBL = new THREE.Mesh(pawGeo, coatMat);
    pawBL.position.set(0, -0.24, 0.03);
    backLegL.add(pawBL);

    // Back Right Leg
    const backLegR = new THREE.Group();
    backLegR.position.set(0.16, -0.08, -0.18);
    torsoGroup.add(backLegR);
    const bLegMeshR = new THREE.Mesh(legGeo, frameMat);
    bLegMeshR.position.y = -0.13;
    backLegR.add(bLegMeshR);
    const pawBR = new THREE.Mesh(pawGeo, coatMat);
    pawBR.position.set(0, -0.24, 0.03);
    backLegR.add(pawBR);

    // Save references to userData for direct animation hooks
    root.userData = {
      type: 'puppy',
      frontLegL,
      frontLegR,
      backLegL,
      backLegR,
      tail,
      head,
      earL,
      earR,
      torsoGroup,
    };

    return {
      root,
      frontLegL,
      frontLegR,
      backLegL,
      backLegR,
      tail,
      head,
      earL,
      earR,
    };
  }

  /**
   * Creates an aggressive armored combat vehicle model for the player to drive during the 10-second vehicle skill!
   */
  public static createCombatDrivableVehicleModel(accentHex: string = '#00f0ff'): {
    root: THREE.Group;
    wheels: THREE.Mesh[];
    beaconL: THREE.Mesh;
    beaconR: THREE.Mesh;
    headlightL: THREE.Mesh;
    headlightR: THREE.Mesh;
    exhaustL: THREE.Vector3;
    exhaustR: THREE.Vector3;
    spotLight: THREE.SpotLight;
  } {
    const root = new THREE.Group();
    root.name = 'combat_vehicle_root';

    // Materials
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.85,
      roughness: 0.25,
    });

    const armorTex = TextureGenerator.getVehicleBodyTexture('military');
    const armorMat = new THREE.MeshStandardMaterial({
      map: armorTex,
      metalness: 0.7,
      roughness: 0.35,
    });

    const windowTex = TextureGenerator.getVehicleWindowTexture();
    const glassMat = new THREE.MeshStandardMaterial({
      map: windowTex,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.9,
    });

    const tireTex = TextureGenerator.getTireTexture();
    const tireMat = new THREE.MeshStandardMaterial({
      map: tireTex,
      metalness: 0.3,
      roughness: 0.6,
    });

    const neonMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(accentHex),
    });

    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.9,
      roughness: 0.2,
    });

    // 1. Lower Chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.45, 4.2), chassisMat);
    chassis.position.y = 0.55;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    root.add(chassis);

    // Neon underglow plane
    const underglow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 3.8),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(accentHex),
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
      })
    );
    underglow.rotation.x = Math.PI / 2;
    underglow.position.y = 0.15;
    root.add(underglow);

    // 2. Armored Body Shell
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.8, 4.0), armorMat);
    body.position.y = 1.0;
    body.castShadow = true;
    body.receiveShadow = true;
    root.add(body);

    // Side armor skirts with neon accents
    const skirtGeo = new THREE.BoxGeometry(0.1, 0.3, 3.6);
    const skirtL = new THREE.Mesh(skirtGeo, neonMat);
    skirtL.position.set(-1.15, 0.65, 0);
    const skirtR = skirtL.clone();
    skirtR.position.x = 1.15;
    root.add(skirtL, skirtR);

    // 3. Cockpit / Windshield
    const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.7, 2.2), glassMat);
    cockpit.position.set(0, 1.6, -0.15);
    cockpit.castShadow = true;
    root.add(cockpit);

    // Armored roof with reinforcement cage
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.1, 2.22), armorMat);
    roof.position.set(0, 1.98, -0.15);
    root.add(roof);

    // 4. Heavy Front Ramming Bullbar with Spikes
    const bullbar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.55, 0.4), steelMat);
    bullbar.position.set(0, 0.7, 2.2);
    bullbar.castShadow = true;
    root.add(bullbar);

    // Ramming spikes
    const spikeGeo = new THREE.ConeGeometry(0.12, 0.4, 6);
    const spikePositions = [-0.9, -0.45, 0, 0.45, 0.9];
    spikePositions.forEach((sx) => {
      const spike = new THREE.Mesh(spikeGeo, steelMat);
      spike.rotation.x = Math.PI / 2;
      spike.position.set(sx, 0.7, 2.45);
      spike.castShadow = true;
      root.add(spike);
    });

    // 5. Four Off-Road Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.35, 16);
    const wheels: THREE.Mesh[] = [];
    const wheelOffsets = [
      { x: -1.25, z: 1.35 },
      { x: 1.25, z: 1.35 },
      { x: -1.25, z: -1.35 },
      { x: 1.25, z: -1.35 },
    ];
    wheelOffsets.forEach((off) => {
      const wheel = new THREE.Mesh(wheelGeo, tireMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(off.x, 0.48, off.z);
      wheel.castShadow = true;
      root.add(wheel);
      wheels.push(wheel);
    });

    // 6. Roof-mounted twin machine gun cannons
    const cannonMount = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.6), steelMat);
    cannonMount.position.set(0, 2.12, -0.2);
    root.add(cannonMount);

    const barrelGeo = new THREE.CylinderGeometry(0.06, 0.07, 1.1, 8);
    const barrelL = new THREE.Mesh(barrelGeo, steelMat);
    barrelL.rotation.x = Math.PI / 2;
    barrelL.position.set(-0.25, 2.15, 0.4);
    const barrelR = barrelL.clone();
    barrelR.position.x = 0.25;
    root.add(barrelL, barrelR);

    // 7. Flashing Beacons (Police / Military siren)
    const beaconL = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.14, 0.16),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    beaconL.position.set(-0.35, 2.1, -0.6);

    const beaconR = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.14, 0.16),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    beaconR.position.set(0.35, 2.1, -0.6);
    root.add(beaconL, beaconR);

    // 8. Headlights & Real SpotLight
    const hlMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd });
    const headlightL = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.1), hlMat);
    headlightL.position.set(-0.8, 0.98, 2.05);
    const headlightR = headlightL.clone();
    headlightR.position.x = 0.8;
    root.add(headlightL, headlightR);

    // Forward SpotLight illuminating the street
    const spotLight = new THREE.SpotLight(0x7dd3fc, 3.5, 30, Math.PI / 5, 0.35, 1.2);
    spotLight.position.set(0, 1.2, 2.0);
    const targetObj = new THREE.Object3D();
    targetObj.position.set(0, 0.2, 12);
    root.add(targetObj);
    spotLight.target = targetObj;
    root.add(spotLight);

    // 9. Dual Exhaust Pipes at rear
    const exhaustPipeGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.3, 8);
    const pipeL = new THREE.Mesh(exhaustPipeGeo, steelMat);
    pipeL.rotation.x = Math.PI / 2;
    pipeL.position.set(-0.65, 0.55, -2.1);
    const pipeR = pipeL.clone();
    pipeR.position.x = 0.65;
    root.add(pipeL, pipeR);

    const exhaustL = new THREE.Vector3(-0.65, 0.55, -2.25);
    const exhaustR = new THREE.Vector3(0.65, 0.55, -2.25);

    return {
      root,
      wheels,
      beaconL,
      beaconR,
      headlightL,
      headlightR,
      exhaustL,
      exhaustR,
      spotLight,
    };
  }
}
