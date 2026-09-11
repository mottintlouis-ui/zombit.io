import * as THREE from 'three';
import { GAME_ASSETS } from '../assets/assets';
import { SkillUpgrade, ZombieType, GroundPuddle } from '../types/game';
import { sound } from '../services/sound';
import { ModelFactory } from './ModelFactory';
import { TextureGenerator } from './TextureGenerator';

export interface GameCallbacks {
  onHealthChanged: (current: number, max: number, shield: number, maxShield: number) => void;
  onXpChanged: (current: number, max: number, level: number) => void;
  onLevelUp: () => void;
  onWaveChanged: (wave: number, waveTimeLeft: number) => void;
  onScoreChanged: (score: number, kills: number) => void;
  onBossSpawned: (bossName: string, currentHp: number, maxHp: number) => void;
  onBossHpChanged: (currentHp: number, maxHp: number) => void;
  onBossDefeated: () => void;
  onGameOver: (score: number, timeSec: number, kills: number, wave: number, level: number, bossKills: number) => void;
  onVehicleStateChanged?: (isDriving: boolean, timeLeft: number, cooldownLeft: number, maxCooldown: number, isUnlocked: boolean) => void;
}

interface Projectile {
  mesh: THREE.Group;
  vx: number;
  vz: number;
  damage: number;
  life: number;
  pierceRemaining: number;
  type: 'bullet' | 'railgun' | 'bomb';
  radius: number;
}

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  colorType: 'green_smoke' | 'spark' | 'explosion';
}

interface ZombieEntity {
  id: string;
  type: ZombieType;
  group: THREE.Group;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  xpValue: number;
  radius: number;
  height: number;
  leftLeg?: THREE.Group;
  rightLeg?: THREE.Group;
  leftArm?: THREE.Group;
  rightArm?: THREE.Group;
  torso?: THREE.Group;
  head?: THREE.Group;
  zigzagPhase: number;
  zigzagFreq: number;
  isExploding?: boolean;
  explodeTimer?: number;
  isBoss?: boolean;
  bossName?: string;
  summonTimer?: number;
  auraMesh?: THREE.Mesh;
  tauntTimer?: number;
  isTaunted?: boolean;
  lastAttackTime?: number;
  isEnraged?: boolean;
}

interface Shockwave {
  mesh: THREE.Mesh;
  radius: number;
  maxRadius: number;
  speed: number;
  opacity: number;
}

interface FloatingText {
  sprite: THREE.Sprite;
  life: number;
  maxLife: number;
  vy: number;
}

interface XpGem {
  mesh: THREE.Object3D;
  x: number;
  z: number;
  value: number;
  magnetized: boolean;
}

interface Drone {
  mesh: THREE.Group;
  angle: number;
  distance: number;
}

export class GameEngine {
  private container: HTMLElement;
  private callbacks: GameCallbacks;

  // Three.js Core
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private textureLoader: THREE.TextureLoader;

  // Textures
  private groundTex: THREE.Texture | null = null;
  private survivorTex: THREE.Texture | null = null;
  private zombieTex: THREE.Texture | null = null;
  private propTex: THREE.Texture | null = null;

  // Game Objects
  private playerGroup: THREE.Group;
  private playerBodyMesh: THREE.Mesh | null = null;
  private playerGunMesh: THREE.Mesh | null = null;
  private playerShieldAura: THREE.Mesh | null = null;
  private petGroup: THREE.Group | null = null;
  private playerParts: {
    root: THREE.Group;
    leftLeg: THREE.Group;
    rightLeg: THREE.Group;
    leftArm: THREE.Group;
    rightArm: THREE.Group;
    torso: THREE.Group;
    head: THREE.Group;
    gun: THREE.Group;
    muzzlePoint: THREE.Vector3;
  } | null = null;

  // Visual Customization
  public equippedSkin: string = 'skin_default';
  public equippedSkinColor: string = '#0284c7';
  public equippedAccentColor: string = '#00f0ff';
  public equippedWeaponSkin: string = 'weapon_plasma';
  public equippedFx: string = 'fx_cyan';
  public equippedPet: string = 'none';

  private zombies: ZombieEntity[] = [];
  private projectiles: Projectile[] = [];
  private xpGems: XpGem[] = [];
  private particles: Particle[] = [];
  private puddles: GroundPuddle[] = [];
  private puddleMeshes: Map<string, THREE.Mesh> = new Map();
  private drones: Drone[] = [];
  private shockwaves: Shockwave[] = [];
  private floatingTexts: FloatingText[] = [];
  private petZapBeam: THREE.Line | null = null;
  private petZapLife: number = 0;
  private petState: {
    mode: 'follow' | 'charging' | 'taunting' | 'return';
    target: ZombieEntity | null;
    actionTimer: number;
    cooldownTimer: number;
    currentX: number;
    currentZ: number;
  } | null = null;

  // Arena Props
  private obstacles: { x: number; z: number; radius: number }[] = [];
  private parkedVehicles: { x: number; z: number }[] = [];

  // Optimized static shared geometries for particles & FX (avoids thousands of WebGL buffer allocations/sec)
  private static readonly sharedSparkGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
  private static readonly sharedExplosionGeo = new THREE.SphereGeometry(0.28, 6, 6);
  private static readonly sharedSmokeGeo = new THREE.DodecahedronGeometry(0.22);
  private static readonly sharedRingGeo = new THREE.RingGeometry(0.25, 0.4, 24);

  // Vehicle Driving Skill (10-Second Combat Car Drive)
  public isDrivingVehicle: boolean = false;
  public vehicleDriveTimeLeft: number = 0;
  public readonly vehicleMaxDriveTime: number = 10.0;
  public vehicleCooldownLeft: number = 0;
  public vehicleMaxCooldown: number = 25.0;
  private combatVehicleGroup: THREE.Group | null = null;
  private vehicleWheels: THREE.Mesh[] = [];
  private vehicleBeaconL: THREE.Mesh | null = null;
  private vehicleBeaconR: THREE.Mesh | null = null;
  private vehicleSpotLight: THREE.SpotLight | null = null;
  private vehicleFireTimer: number = 0;
  private vehicleNitroTimer: number = 0;

  // Player Stats
  public maxHp = 100;
  public currentHp = 100;
  public maxShield = 0;
  public currentShield = 0;
  public shieldRegenTimer = 0;
  public speed = 7.5;
  public magnetRadius = 4.5;
  public damageMult = 1.0;
  public fireRateMult = 1.0;
  public critChance = 0.05;
  public regenRate = 0; // HP / sec

  // Progression
  public currentXp = 0;
  public maxXp = 30;
  public level = 1;
  public score = 0;
  public kills = 0;
  public bossesKilled = 0;
  public totalLevelUps = 0;

  // Wave Management
  public currentWave = 1;
  public waveTimer = 30.0; // 30s per wave as specified
  public survivalTime = 0;
  public isPaused = false;
  public isGameOver = false;

  // Active boss
  private activeBoss: ZombieEntity | null = null;

  // Weapon Timers & Skills
  private skillTiers: Map<string, number> = new Map();
  private blasterTimer = 0;
  private teslaTimer = 0;
  private mortarTimer = 0;
  private railgunTimer = 0;

  // Inputs
  private inputVector = new THREE.Vector2(0, 0);
  private keysDown: Set<string> = new Set();
  private joystickVector = new THREE.Vector2(0, 0);
  private stationaryTimer = 0;
  private stationaryWarningTimer = 0;

  // Animation Loop
  private animationFrameId: number | null = null;
  private lastTime = 0;

  // Arena limits
  private readonly ARENA_SIZE = 48; // 48x48 units half-extents (96x96 total)

  constructor(
    container: HTMLElement,
    callbacks: GameCallbacks,
    initialCosmetics?: { skin?: string; weapon?: string; fx?: string; pet?: string }
  ) {
    this.container = container;
    this.callbacks = callbacks;

    if (initialCosmetics?.skin) this.equippedSkin = initialCosmetics.skin;
    if (initialCosmetics?.weapon) this.equippedWeaponSkin = initialCosmetics.weapon;
    if (initialCosmetics?.fx) this.equippedFx = initialCosmetics.fx;
    if (initialCosmetics?.pet) this.equippedPet = initialCosmetics.pet;

    // 1. Scene & Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0d14);
    this.scene.fog = new THREE.FogExp2(0x0a0d14, 0.015);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 200);
    this.camera.position.set(0, 13.5, 9.5);
    this.camera.lookAt(0, 0.8, -1.0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(this.renderer.domElement);

    this.textureLoader = new THREE.TextureLoader();

    // 2. Player
    this.playerGroup = new THREE.Group();
    this.scene.add(this.playerGroup);

    // Initial default skill: Blaster level 1
    this.skillTiers.set('plasma_blaster', 1);

    this.initLights();
    this.loadTexturesAndBuildArena();
    this.buildPlayerModel();
    this.setupKeyboardListeners();

    window.addEventListener('resize', this.handleResize);
    this.handleResize();

    // Start tick
    this.lastTime = performance.now();
    this.animate = this.animate.bind(this);
    this.animationFrameId = requestAnimationFrame(this.animate);

    // Sync initial UI
    this.callbacks.onHealthChanged(this.currentHp, this.maxHp, this.currentShield, this.maxShield);
    this.callbacks.onXpChanged(this.currentXp, this.maxXp, this.level);
    this.callbacks.onWaveChanged(this.currentWave, Math.ceil(this.waveTimer));
    this.callbacks.onScoreChanged(this.score, this.kills);
  }

  // --- LIGHTING ---
  private initLights() {
    const ambientLight = new THREE.AmbientLight(0x404b69, 1.4);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xdfe8ff, 2.0);
    dirLight.position.set(25, 45, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 120;
    const d = 50;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    this.scene.add(dirLight);

    // Subtle atmospheric cyan point light over player
    const playerPointLight = new THREE.PointLight(0x00e5ff, 1.2, 16);
    playerPointLight.position.set(0, 3, 0);
    this.playerGroup.add(playerPointLight);
  }

  // --- TEXTURES & ARENA ---
  private loadTexturesAndBuildArena() {
    // Load generated textures
    this.textureLoader.load(
      GAME_ASSETS.groundTexture,
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(12, 12);
        this.groundTex = tex;
        this.buildGround();
      },
      undefined,
      () => this.buildGround()
    );

    this.textureLoader.load(
      GAME_ASSETS.survivorTexture,
      (tex) => {
        this.survivorTex = tex;
        if (this.playerBodyMesh) {
          (this.playerBodyMesh.material as THREE.MeshStandardMaterial).map = tex;
          (this.playerBodyMesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
        }
      }
    );

    this.textureLoader.load(GAME_ASSETS.zombieTexture, (tex) => {
      this.zombieTex = tex;
    });

    this.textureLoader.load(GAME_ASSETS.propTexture, (tex) => {
      this.propTex = tex;
    });

    // Build arena scenery
    this.buildArenaProps();
  }

  private buildGround() {
    const groundGeo = new THREE.PlaneGeometry(this.ARENA_SIZE * 2, this.ARENA_SIZE * 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x888899,
      map: this.groundTex,
      roughness: 0.85,
      metalness: 0.15,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Perimeter boundary barriers with texture
    const wallGeo = new THREE.BoxGeometry(this.ARENA_SIZE * 2, 2.5, 1.5);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x273549,
      map: TextureGenerator.getWallTexture(),
      roughness: 0.6,
      metalness: 0.4,
    });

    // North, South, East, West borders
    const nWall = new THREE.Mesh(wallGeo, wallMat);
    nWall.position.set(0, 1.25, -this.ARENA_SIZE);
    nWall.receiveShadow = true;
    this.scene.add(nWall);

    const sWall = new THREE.Mesh(wallGeo, wallMat);
    sWall.position.set(0, 1.25, this.ARENA_SIZE);
    sWall.receiveShadow = true;
    this.scene.add(sWall);

    const ewWallGeo = new THREE.BoxGeometry(1.5, 2.5, this.ARENA_SIZE * 2);
    const eWall = new THREE.Mesh(ewWallGeo, wallMat);
    eWall.position.set(this.ARENA_SIZE, 1.25, 0);
    eWall.receiveShadow = true;
    this.scene.add(eWall);

    const wWall = new THREE.Mesh(ewWallGeo, wallMat);
    wWall.position.set(-this.ARENA_SIZE, 1.25, 0);
    wWall.receiveShadow = true;
    this.scene.add(wWall);

    // Neon hazard border line
    const borderGlowMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const topGlow = new THREE.Mesh(new THREE.BoxGeometry(this.ARENA_SIZE * 2, 0.2, 0.2), borderGlowMat);
    topGlow.position.set(0, 2.5, -this.ARENA_SIZE);
    this.scene.add(topGlow);
    const botGlow = topGlow.clone();
    botGlow.position.set(0, 2.5, this.ARENA_SIZE);
    this.scene.add(botGlow);
  }

  private buildArenaProps() {
    this.obstacles = [];
    this.parkedVehicles = [];

    // Abandoned vehicles, light poles, road barriers
    const propLocations = [
      { x: -18, z: -15, type: 'vehicle' },
      { x: 22, z: 12, type: 'vehicle' },
      { x: -14, z: 24, type: 'barrier' },
      { x: 16, z: -20, type: 'barrier' },
      { x: -16, z: -4, type: 'barrier' },
      { x: 18, z: 22, type: 'barrier' },
      { x: 0, z: -32, type: 'lightpole' },
      { x: 0, z: 32, type: 'lightpole' },
      { x: -32, z: 0, type: 'lightpole' },
      { x: 32, z: 0, type: 'lightpole' },
      { x: -28, z: -28, type: 'crates' },
      { x: 28, z: 28, type: 'crates' },
    ];

    propLocations.forEach((p) => {
      if (p.type === 'vehicle') {
        const variant = p.x < 0 ? 'police' : 'military';
        const vehicle = this.createVehicleMesh(variant);
        vehicle.position.set(p.x, 0, p.z);
        const rot = (p.x + p.z) * 0.1;
        vehicle.rotation.y = rot;
        this.scene.add(vehicle);
        this.parkedVehicles.push({ x: p.x, z: p.z });

        // Accurate multi-disc bounding covering the vehicle's 4.4m x 2.4m footprint
        [-1.3, 0, 1.3].forEach((offset) => {
          this.obstacles.push({
            x: p.x - Math.sin(rot) * offset,
            z: p.z - Math.cos(rot) * offset,
            radius: 1.35,
          });
        });
      } else if (p.type === 'barrier') {
        const barrier = this.createBarrierMesh();
        barrier.position.set(p.x, 0, p.z);
        this.scene.add(barrier);

        // Barrier is 3.6m long in X, 0.8m wide in Z. 3 overlapping colliders completely block penetration
        [-1.2, 0, 1.2].forEach((offsetX) => {
          this.obstacles.push({
            x: p.x + offsetX,
            z: p.z,
            radius: 0.85,
          });
        });
      } else if (p.type === 'lightpole') {
        const pole = this.createLightPoleMesh();
        pole.position.set(p.x, 0, p.z);
        this.scene.add(pole);
        this.obstacles.push({ x: p.x, z: p.z, radius: 0.85 });
      } else if (p.type === 'crates') {
        const crates = this.createCratesMesh();
        crates.position.set(p.x, 0, p.z);
        this.scene.add(crates);
        this.obstacles.push({ x: p.x, z: p.z, radius: 1.2 });
        this.obstacles.push({ x: p.x + 0.6, z: p.z + 1.0, radius: 0.95 });
      }
    });
  }

  /**
   * Enforces 100% solid, non-traversable collision against barriers, parked cars,
   * crates, streetlights and outer arena walls for both the player and all zombies!
   */
  public resolveObstacleCollisions(pos: { x: number; z: number }, entityRadius: number): void {
    // 1. Outer Arena Boundary Walls
    const bound = this.ARENA_SIZE - entityRadius - 0.7;
    pos.x = Math.max(-bound, Math.min(bound, pos.x));
    pos.z = Math.max(-bound, Math.min(bound, pos.z));

    // 2. Obstacles (2-pass relaxation to prevent any tunneling or clipping)
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < this.obstacles.length; i++) {
        const obs = this.obstacles[i];
        const dx = pos.x - obs.x;
        const dz = pos.z - obs.z;
        const distSq = dx * dx + dz * dz;
        const minDist = obs.radius + entityRadius;
        if (distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq);
          if (dist > 0.0001) {
            const overlap = minDist - dist;
            pos.x += (dx / dist) * overlap;
            pos.z += (dz / dist) * overlap;
          } else {
            pos.x += minDist;
          }
        }
      }
    }
  }

  private createVehicleMesh(variant: 'police' | 'military' = 'police'): THREE.Group {
    const group = new THREE.Group();

    // Body paint & panels texture
    const bodyTex = TextureGenerator.getVehicleBodyTexture(variant);
    const bodyMat = new THREE.MeshStandardMaterial({
      map: bodyTex,
      metalness: 0.55,
      roughness: 0.35,
    });

    // Glass & window reflections texture
    const windowTex = TextureGenerator.getVehicleWindowTexture();
    const windowMat = new THREE.MeshStandardMaterial({
      map: windowTex,
      metalness: 0.85,
      roughness: 0.15,
      transparent: true,
      opacity: 0.95,
    });

    // Radial rubber tire with alloy wheel rims texture
    const tireTex = TextureGenerator.getTireTexture();
    const tireMat = new THREE.MeshStandardMaterial({
      map: tireTex,
      roughness: 0.7,
      metalness: 0.3,
    });

    // Heavy duty bumpers and undercarriage
    const bumperMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
      metalness: 0.4,
    });

    // 1. Lower chassis frame
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.45, 4.4), bumperMat);
    chassis.position.y = 0.5;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    group.add(chassis);

    // Front push-bumper / bullbar
    const bullbar = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.5, 0.3), bumperMat);
    bullbar.position.set(0, 0.62, 2.3);
    bullbar.castShadow = true;
    group.add(bullbar);

    // 2. Sculpted vehicle body
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.75, 4.2), bodyMat);
    body.position.y = 0.92;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // 3. Cabin with textured windshield & side windows
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.72, 2.2), windowMat);
    cabin.position.set(0, 1.55, -0.2);
    cabin.castShadow = true;
    group.add(cabin);

    // Cabin roof with painted body panels
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.1, 2.22), bodyMat);
    roof.position.set(0, 1.93, -0.2);
    roof.castShadow = true;
    group.add(roof);

    // 4. Textured wheels with tires & alloy rims
    const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 16);
    const wheelPositions = [
      { x: -1.16, z: 1.35 },
      { x: 1.16, z: 1.35 },
      { x: -1.16, z: -1.35 },
      { x: 1.16, z: -1.35 },
    ];
    wheelPositions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeo, tireMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos.x, 0.42, pos.z);
      wheel.castShadow = true;
      group.add(wheel);
    });

    // 5. Front headlights with bright lens
    const hlMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd });
    const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.1), hlMat);
    hl1.position.set(-0.75, 0.95, 2.12);
    const hl2 = hl1.clone();
    hl2.position.x = 0.75;
    group.add(hl1, hl2);

    // Rear glowing red taillights
    const tlMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.1), tlMat);
    tl1.position.set(-0.75, 0.95, -2.12);
    const tl2 = tl1.clone();
    tl2.position.x = 0.75;
    group.add(tl1, tl2);

    // 6. Siren Bar (if Police cruiser)
    if (variant === 'police') {
      const sirenMount = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.18), bumperMat);
      sirenMount.position.set(0, 2.02, -0.2);
      group.add(sirenMount);

      const redSiren = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.14), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      redSiren.position.set(-0.35, 2.1, -0.2);
      const blueSiren = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.14), new THREE.MeshBasicMaterial({ color: 0x0284c7 }));
      blueSiren.position.set(0.35, 2.1, -0.2);
      group.add(redSiren, blueSiren);
    }

    return group;
  }

  private createBarrierMesh(): THREE.Group {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: TextureGenerator.getBarrierTexture(),
      roughness: 0.7,
      metalness: 0.2,
    });
    const barrier = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.2, 0.8), mat);
    barrier.position.y = 0.6;
    barrier.castShadow = true;
    group.add(barrier);

    // Hazard stripes
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(3.62, 0.35, 0.82),
      new THREE.MeshBasicMaterial({ color: 0xf97316 })
    );
    stripe.position.y = 0.6;
    group.add(stripe);

    return group;
  }

  private createLightPoleMesh(): THREE.Group {
    const group = new THREE.Group();

    // Galvanized steel pole texture with hazard stripe and inspection panel
    const poleTex = TextureGenerator.getStreetPoleTexture();
    const poleMat = new THREE.MeshStandardMaterial({
      map: poleTex,
      metalness: 0.75,
      roughness: 0.35,
    });

    // Street luminaire fixture head texture
    const lampHeadTex = TextureGenerator.getStreetLampHeadTexture();
    const lampMat = new THREE.MeshStandardMaterial({
      map: lampHeadTex,
      metalness: 0.6,
      roughness: 0.4,
      emissive: new THREE.Color(0x0284c7),
      emissiveIntensity: 0.4,
    });

    // Concrete base mounting block
    const baseMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.getWallTexture(),
      roughness: 0.9,
      metalness: 0.2,
    });
    const baseBlock = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 0.9), baseMat);
    baseBlock.position.y = 0.225;
    baseBlock.castShadow = true;
    baseBlock.receiveShadow = true;
    group.add(baseBlock);

    // Flange plate
    const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.44, 0.15, 8), poleMat);
    flange.position.y = 0.5;
    group.add(flange);

    // Vertical galvanized steel mast
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 5.2, 12), poleMat);
    mast.position.y = 3.0;
    mast.castShadow = true;
    group.add(mast);

    // Curved extension arm
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.8), poleMat);
    arm.position.set(0, 5.5, 0.8);
    arm.rotation.x = -0.15;
    arm.castShadow = true;
    group.add(arm);

    // Luminaire fixture housing
    const luminaire = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.22, 0.9), lampMat);
    luminaire.position.set(0, 5.4, 1.6);
    luminaire.castShadow = true;
    group.add(luminaire);

    // Illuminated glass refractor lens on bottom
    const lensMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc });
    const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.75), lensMat);
    lens.position.set(0, 5.28, 1.6);
    lens.rotation.x = Math.PI / 2;
    group.add(lens);

    // Atmospheric downwards point light
    const pl = new THREE.PointLight(0x38bdf8, 2.2, 16);
    pl.position.set(0, 5.1, 1.6);
    group.add(pl);

    // Ground light pool
    const poolMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    const lightPool = new THREE.Mesh(new THREE.CircleGeometry(2.8, 16), poolMat);
    lightPool.rotation.x = -Math.PI / 2;
    lightPool.position.set(0, 0.02, 1.6);
    group.add(lightPool);

    return group;
  }

  private createCratesMesh(): THREE.Group {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.getCrateTexture(),
      roughness: 0.8,
      metalness: 0.2,
    });
    const c1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), mat);
    c1.position.set(0, 0.7, 0);
    c1.castShadow = true;
    group.add(c1);

    const c2 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), mat);
    c2.position.set(0.6, 0.55, 1.0);
    c2.castShadow = true;
    group.add(c2);

    return group;
  }

  // --- PLAYER MODEL ---
  public resolveSkinColors() {
    switch (this.equippedSkin) {
      case 'skin_ronin':
        this.equippedSkinColor = '#0f172a';
        this.equippedAccentColor = '#38bdf8';
        break;
      case 'skin_hazmat':
        this.equippedSkinColor = '#65a30d';
        this.equippedAccentColor = '#84cc16';
        break;
      case 'skin_valkyrie':
        this.equippedSkinColor = '#d97706';
        this.equippedAccentColor = '#f59e0b';
        break;
      case 'skin_default':
      case 'skin_soldier':
      default:
        this.equippedSkinColor = '#0284c7';
        this.equippedAccentColor = '#00f0ff';
        break;
    }
  }

  private buildPlayerModel() {
    // Clear any previous meshes in playerGroup
    while (this.playerGroup.children.length > 0) {
      this.playerGroup.remove(this.playerGroup.children[0]);
    }

    // Resolve skin palette
    this.resolveSkinColors();

    // Survivor full 3D articulated model with character accessories and weapon skins
    const playerModel = ModelFactory.createPlayerModel(
      this.equippedSkinColor,
      this.equippedAccentColor,
      this.equippedSkin,
      this.equippedWeaponSkin
    );
    this.playerParts = playerModel;
    this.playerGroup.add(playerModel.root);

    // Shield bubble (invisible until forcefield unlocked)
    const shieldGeo = new THREE.SphereGeometry(1.4, 16, 16);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.0,
      wireframe: true,
    });
    this.playerShieldAura = new THREE.Mesh(shieldGeo, shieldMat);
    this.playerShieldAura.position.y = 1.0;
    this.playerGroup.add(this.playerShieldAura);

    // Initialize pet companion
    this.initPet();
  }

  // --- INPUT CONTROLS ---
  private onKeyDown = (e: KeyboardEvent) => {
    this.keysDown.add(e.code);
    if ((e.code === 'KeyE' || e.code === 'Space') && !e.repeat) {
      this.activateCombatVehicle();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysDown.delete(e.code);
  };

  private setupKeyboardListeners() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  public setJoystickVector(x: number, y: number) {
    this.joystickVector.set(x, y);
  }

  private updatePlayerMovement(delta: number) {
    let moveX = 0;
    let moveZ = 0;

    // Keyboard (WASD, ZQSD, Arrows)
    if (this.keysDown.has('KeyW') || this.keysDown.has('KeyZ') || this.keysDown.has('ArrowUp')) moveZ -= 1;
    if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) moveZ += 1;
    if (this.keysDown.has('KeyA') || this.keysDown.has('KeyQ') || this.keysDown.has('ArrowLeft')) moveX -= 1;
    if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) moveX += 1;

    // Virtual Joystick takes precedence or adds
    if (this.joystickVector.lengthSq() > 0.01) {
      moveX = this.joystickVector.x;
      moveZ = this.joystickVector.y;
    }

    const moveDir = new THREE.Vector2(moveX, moveZ);
    if (moveDir.lengthSq() > 0.01) {
      this.stationaryTimer = 0;
      moveDir.normalize();

      // Turbo speed when piloting combat vehicle!
      const currentSpeed = this.isDrivingVehicle
        ? 16.5
        : this.speed * (1 + (this.skillTiers.get('overdrive_boots') || 0) * 0.15);

      const nextX = this.playerGroup.position.x + moveDir.x * currentSpeed * delta;
      const nextZ = this.playerGroup.position.z + moveDir.y * currentSpeed * delta;

      // Solid obstacle & boundary wall collision (strictly non-traversable)
      const targetPos = { x: nextX, z: nextZ };
      const playerRadius = this.isDrivingVehicle ? 1.4 : 0.65;
      this.resolveObstacleCollisions(targetPos, playerRadius);

      this.playerGroup.position.x = targetPos.x;
      this.playerGroup.position.z = targetPos.z;

      // Turn player / vehicle smoothly toward heading direction
      const headingAngle = Math.atan2(moveDir.x, moveDir.y);
      this.playerGroup.rotation.y = headingAngle;

      if (this.isDrivingVehicle) {
        // Spin vehicle wheels
        this.vehicleWheels.forEach((wheel) => {
          wheel.rotation.x += delta * 24;
        });

        // Drift smoke / sparks
        if (Math.random() < 0.35) {
          this.createSparkParticles(
            this.playerGroup.position.x - moveDir.x * 1.8,
            this.playerGroup.position.z - moveDir.y * 1.8,
            0x00f0ff
          );
        }
      } else {
        // Subtle walking tilt & bob
        const walkCycle = Math.sin(performance.now() * 0.014);
        this.playerGroup.position.y = Math.abs(walkCycle) * 0.08;

        // Articulated limbs walking animation
        if (this.playerParts) {
          const walkPhase = performance.now() * 0.014;
          this.playerParts.leftLeg.rotation.x = Math.sin(walkPhase) * 0.6;
          this.playerParts.rightLeg.rotation.x = -Math.sin(walkPhase) * 0.6;
          this.playerParts.leftArm.rotation.x = -Math.sin(walkPhase) * 0.45;
          this.playerParts.rightArm.rotation.x = Math.sin(walkPhase) * 0.25;
          this.playerParts.torso.rotation.z = Math.sin(walkPhase * 0.5) * 0.03;
        }
      }
    } else {
      // Idle state: advance stationary timer to prevent stand-still exploit
      this.stationaryTimer += delta;

      // Immobility penalty: Enrage nearby zombies & alert horde!
      if (this.stationaryTimer > 1.8) {
        const pPos = this.playerGroup.position;
        // Enrage all nearby zombies within 28m: aggressive rush speed!
        this.zombies.forEach((z) => {
          if (pPos.distanceTo(z.group.position) < 28) {
            z.isEnraged = true;
          }
        });

        this.stationaryWarningTimer -= delta;
        if (this.stationaryWarningTimer <= 0) {
          this.stationaryWarningTimer = 2.4;
          this.createFloatingCombatText('⚠️ BOUGEZ ! (Horde enragée)', pPos.x, 2.2, pPos.z, '#ef4444', 24);
        }

        // Spawn flanking ambush squad if standing still > 3.2s
        if (this.stationaryTimer > 3.2 && this.zombies.length < 130) {
          this.stationaryTimer = 1.8;
          const pAngle = this.playerGroup.rotation.y;
          const a1 = pAngle + Math.PI * 0.65;
          const a2 = pAngle - Math.PI * 0.65;
          const dist = 14 + Math.random() * 4;
          this.createZombieEntity('runner', pPos.x + Math.sin(a1) * dist, pPos.z + Math.cos(a1) * dist, 1.0, 1.1);
          this.createZombieEntity('normal', pPos.x + Math.sin(a2) * dist, pPos.z + Math.cos(a2) * dist, 1.0, 1.1);
        }
      }

      // Idle state: smoothly settle limbs
      if (this.playerParts) {
        this.playerParts.leftLeg.rotation.x *= 0.8;
        this.playerParts.rightLeg.rotation.x *= 0.8;
        this.playerParts.leftArm.rotation.x *= 0.8;
        this.playerParts.rightArm.rotation.x *= 0.8;
        this.playerParts.torso.rotation.z *= 0.8;
        const breath = Math.sin(performance.now() * 0.003) * 0.03;
        this.playerParts.torso.position.y = 1.0 + breath;
      }
    }

    // Orientation & Aiming:
    // When moving, the character always faces the direction of travel for natural locomotion.
    // When stationary, the character faces the nearest threat within tactical combat range (18m).
    const isMoving = moveDir.lengthSq() > 0.01;
    if (isMoving) {
      const moveAngle = Math.atan2(moveDir.x, moveDir.y);
      let diff = moveAngle - this.playerGroup.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.playerGroup.rotation.y += diff * Math.min(1, delta * 20);
    } else {
      let targetZombie: ZombieEntity | null = null;
      let closestDist = 18.0;
      for (let i = 0; i < this.zombies.length; i++) {
        const z = this.zombies[i];
        const dist = this.playerGroup.position.distanceTo(z.group.position);
        if (dist < closestDist) {
          closestDist = dist;
          targetZombie = z;
        }
      }

      if (targetZombie) {
        const dx = (targetZombie as ZombieEntity).group.position.x - this.playerGroup.position.x;
        const dz = (targetZombie as ZombieEntity).group.position.z - this.playerGroup.position.z;
        const targetAngle = Math.atan2(dx, dz);
        let diff = targetAngle - this.playerGroup.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.playerGroup.rotation.y += diff * Math.min(1, delta * 12);
      }
    }

    // Camera follow with smooth dampening and close-up tactical perspective
    const isPortrait = (this.container.clientWidth || window.innerWidth) < (this.container.clientHeight || window.innerHeight);
    const camTargetY = isPortrait ? 15.0 : 13.5;
    const camTargetZOffset = isPortrait ? 11.0 : 9.5;

    const targetCamX = this.playerGroup.position.x;
    const targetCamY = camTargetY;
    const targetCamZ = this.playerGroup.position.z + camTargetZOffset;

    this.camera.position.x += (targetCamX - this.camera.position.x) * 0.12;
    this.camera.position.y += (targetCamY - this.camera.position.y) * 0.12;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.12;
    this.camera.lookAt(this.playerGroup.position.x, 0.8, this.playerGroup.position.z - 1.0);
  }

  // --- ZOMBIE SPAWNING & FORMULAS ---
  private zombieSpawnTimer = 0;

  private updateWaveProgression(delta: number) {
    this.waveTimer -= delta;
    this.survivalTime += delta;

    if (this.waveTimer <= 0) {
      this.currentWave += 1;
      this.waveTimer = 30.0; // Next wave
      this.callbacks.onWaveChanged(this.currentWave, Math.ceil(this.waveTimer));

      // Boss encounter every 5 waves!
      if (this.currentWave % 5 === 0) {
        this.spawnBoss();
      }
    }

    this.callbacks.onWaveChanged(this.currentWave, Math.ceil(this.waveTimer));

    // Spawn zombies: higher early wave presence and squad spawning
    this.zombieSpawnTimer -= delta;
    const targetMaxZombies = Math.min(140, 24 + this.currentWave * 4);
    const spawnInterval = Math.max(0.2, 0.75 - this.currentWave * 0.04);

    if (this.zombieSpawnTimer <= 0 && this.zombies.length < targetMaxZombies) {
      this.zombieSpawnTimer = spawnInterval;
      // Spawn in squads of 1 to 2 from varied angles so auto-aim cannot trivialize hordes
      const squadCount = Math.min(2, Math.max(1, Math.floor(1 + this.currentWave * 0.12)));
      for (let s = 0; s < squadCount && this.zombies.length < targetMaxZombies; s++) {
        this.spawnRandomZombie();
      }
    }
  }

  private spawnRandomZombie() {
    // Zombie scaling with waves
    const waveHpMult = 1 + this.currentWave * 0.12;
    const waveDmgMult = 1 + this.currentWave * 0.07;

    // Pick type based on wave: early runners keep player moving
    let type: ZombieType = 'normal';
    const rand = Math.random();

    if (this.currentWave >= 15 && rand < 0.12) {
      type = 'elite';
    } else if (this.currentWave >= 8 && rand < 0.22) {
      type = 'summoner';
    } else if (this.currentWave >= 6 && rand < 0.35) {
      type = 'explosive';
    } else if (this.currentWave >= 4 && rand < 0.5) {
      type = 'toxic';
    } else if (this.currentWave >= 3 && rand < 0.65) {
      type = 'armored';
    } else if (rand < 0.22) {
      // 22% chance of fast runners even from wave 1
      type = 'runner';
    }

    // Spawn closer (18m - 26m) around player so enemies arrive quickly
    const angle = Math.random() * Math.PI * 2;
    const spawnDist = 18 + Math.random() * 8;
    const spawnX = this.playerGroup.position.x + Math.cos(angle) * spawnDist;
    const spawnZ = this.playerGroup.position.z + Math.sin(angle) * spawnDist;

    // Clamp inside arena limits
    const clampedX = Math.max(-this.ARENA_SIZE + 2, Math.min(this.ARENA_SIZE - 2, spawnX));
    const clampedZ = Math.max(-this.ARENA_SIZE + 2, Math.min(this.ARENA_SIZE - 2, spawnZ));

    this.createZombieEntity(type, clampedX, clampedZ, waveHpMult, waveDmgMult);
  }

  private createZombieEntity(
    type: ZombieType,
    x: number,
    z: number,
    hpMult: number,
    dmgMult: number
  ): ZombieEntity {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    let baseHp = 22;
    let baseDmg = 10;
    let baseSpeed = 2.9;
    let xpValue = 10;
    let color = 0x22c55e;
    let scale = 1.0;

    switch (type) {
      case 'runner':
        baseHp = 14;
        baseDmg = 9;
        baseSpeed = 4.8; // fast, fragile, aggressive zigzag
        color = 0xf97316;
        scale = 0.85;
        break;
      case 'armored':
        baseHp = 48;
        baseDmg = 14;
        baseSpeed = 2.0; // slow, high hp
        color = 0x64748b;
        scale = 1.25;
        break;
      case 'toxic':
        baseHp = 26;
        baseDmg = 10;
        baseSpeed = 2.4;
        color = 0xa3e635; // leaves poison pool
        break;
      case 'explosive':
        baseHp = 24;
        baseDmg = 18;
        baseSpeed = 3.2;
        color = 0xef4444; // swells & explodes
        break;
      case 'summoner':
        baseHp = 38;
        baseDmg = 8;
        baseSpeed = 2.0;
        color = 0xa855f7;
        scale = 1.1;
        break;
      case 'elite':
        baseHp = 110;
        baseDmg = 22;
        baseSpeed = 3.0;
        xpValue = 50;
        color = 0xeab308;
        scale = 1.6;
        break;
      default: // normal
        baseHp = 22;
        baseDmg = 10;
        baseSpeed = 2.9;
        break;
    }

    // Speed capped as requested ("Plafonner la vitesse pour que les ennemis restent évitables")
    const finalSpeed = Math.min(5.2, baseSpeed * (1 + this.currentWave * 0.02));
    const finalHp = Math.round(baseHp * hpMult);
    const finalDmg = Math.round(baseDmg * dmgMult);

    // Build authentic 3D articulated zombie monster model
    const zombieModel = ModelFactory.createZombieModel(type, scale);
    group.add(zombieModel.root);

    let auraMesh: THREE.Mesh | undefined;
    if (type === 'elite') {
      const auraGeo = new THREE.RingGeometry(1.2, 1.5, 16);
      const auraMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      });
      auraMesh = new THREE.Mesh(auraGeo, auraMat);
      auraMesh.rotation.x = -Math.PI / 2;
      auraMesh.position.y = 0.08;
      group.add(auraMesh);
    }

    this.scene.add(group);

    const entity: ZombieEntity = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      group,
      hp: finalHp,
      maxHp: finalHp,
      speed: finalSpeed,
      damage: finalDmg,
      xpValue,
      radius: zombieModel.radius,
      height: zombieModel.height,
      leftLeg: zombieModel.leftLeg,
      rightLeg: zombieModel.rightLeg,
      leftArm: zombieModel.leftArm,
      rightArm: zombieModel.rightArm,
      torso: zombieModel.torso,
      head: zombieModel.head,
      zigzagPhase: Math.random() * Math.PI * 2,
      zigzagFreq: 4.5,
      auraMesh,
    };

    this.zombies.push(entity);
    return entity;
  }

  private spawnBoss() {
    sound.playBossRoar();
    const bossNames = ['Giga Goliath', 'Titan Bio-Chimère', 'Seigneur des Ombres', 'Cyber-Béhémoth'];
    const bossName = bossNames[(Math.floor(this.currentWave / 5) - 1) % bossNames.length];

    const group = new THREE.Group();
    const angle = Math.random() * Math.PI * 2;
    const x = this.playerGroup.position.x + Math.cos(angle) * 28;
    const z = this.playerGroup.position.z + Math.sin(angle) * 28;
    group.position.set(x, 0, z);

    const baseHp = 600 + this.currentWave * 180;
    const baseDmg = 35 + this.currentWave * 4;

    // Colossal boss 3D monster model
    const bossModel = ModelFactory.createZombieModel('boss', 1.0);
    group.add(bossModel.root);

    // Red Boss ground aura
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.4, 2.9, 24), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.06;
    group.add(ring);

    this.scene.add(group);

    const boss: ZombieEntity = {
      id: 'boss_' + Date.now(),
      type: 'boss',
      group,
      hp: baseHp,
      maxHp: baseHp,
      speed: 1.8,
      damage: baseDmg,
      xpValue: 200,
      radius: bossModel.radius,
      height: bossModel.height,
      leftLeg: bossModel.leftLeg,
      rightLeg: bossModel.rightLeg,
      leftArm: bossModel.leftArm,
      rightArm: bossModel.rightArm,
      torso: bossModel.torso,
      head: bossModel.head,
      zigzagPhase: 0,
      zigzagFreq: 0,
      isBoss: true,
      bossName,
    };

    this.zombies.push(boss);
    this.activeBoss = boss;
    this.callbacks.onBossSpawned(bossName, baseHp, baseHp);
  }

  // --- ZOMBIE BEHAVIOR & MOVEMENT ---
  private updateZombies(delta: number) {
    const playerPos = this.playerGroup.position;
    const now = performance.now();

    // Swarm flocking separation: prevent zombies from collapsing into a single stacked point
    const zCount = this.zombies.length;
    for (let i = 0; i < zCount; i++) {
      const z1 = this.zombies[i];
      const checkLimit = Math.min(i + 6, zCount);
      for (let j = i + 1; j < checkLimit; j++) {
        const z2 = this.zombies[j];
        const sepX = z1.group.position.x - z2.group.position.x;
        const sepZ = z1.group.position.z - z2.group.position.z;
        const sepMin = (z1.radius + z2.radius) * 0.85;
        const sepDistSq = sepX * sepX + sepZ * sepZ;
        if (sepDistSq > 0.0001 && sepDistSq < sepMin * sepMin) {
          const sepDist = Math.sqrt(sepDistSq);
          const push = ((sepMin - sepDist) / sepDist) * 0.5 * delta * 3.5;
          z1.group.position.x += sepX * push;
          z1.group.position.z += sepZ * push;
          z2.group.position.x -= sepX * push;
          z2.group.position.z -= sepZ * push;
        }
      }
    }

    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];

      // Swelling animation if explosive
      if (z.isExploding && z.explodeTimer !== undefined) {
        z.explodeTimer -= delta;
        const progress = 1 - z.explodeTimer / 1.2;
        const scale = 1 + progress * 0.9;
        z.group.scale.set(scale, scale, scale);

        // Flash red
        if (Math.sin(now * 0.03) > 0) {
          z.group.traverse((c) => {
            if ((c as THREE.Mesh).isMesh) {
              ((c as THREE.Mesh).material as THREE.MeshStandardMaterial).color?.setHex(0xffffff);
            }
          });
        }

        if (z.explodeTimer <= 0) {
          // Detonate!
          sound.playExplosion();
          this.createExplosionParticles(z.group.position.x, z.group.position.z, 3.5);
          const distToPlayer = playerPos.distanceTo(z.group.position);
          if (distToPlayer < 4.0) {
            this.damagePlayer(25);
          }
          this.removeZombie(i);
          continue;
        }
      }

      // Movement vector toward player
      const dx = playerPos.x - z.group.position.x;
      const dz = playerPos.z - z.group.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 0.01) {
        let dirX = dx / dist;
        let dirZ = dz / dist;

        // Runner zigzags toward player
        if (z.type === 'runner') {
          z.zigzagPhase += delta * z.zigzagFreq;
          const perpX = -dirZ;
          const perpZ = dirX;
          const zigzagAmount = Math.sin(z.zigzagPhase) * 0.7;
          dirX += perpX * zigzagAmount;
          dirZ += perpZ * zigzagAmount;
          const len = Math.hypot(dirX, dirZ);
          dirX /= len;
          dirZ /= len;
        }

        // Summoner keeps distance and spawns minions
        if (z.type === 'summoner') {
          z.summonTimer = (z.summonTimer || 0) + delta;
          if (z.summonTimer > 5.0 && this.zombies.length < 100) {
            z.summonTimer = 0;
            this.createZombieEntity('normal', z.group.position.x + (Math.random() - 0.5) * 3, z.group.position.z + (Math.random() - 0.5) * 3, 0.7, 0.7);
          }
          if (dist < 10) {
            // Back away slightly
            dirX = -dirX;
            dirZ = -dirZ;
          }
        }

        // Explosive zombie starts countdown when close
        if (z.type === 'explosive' && !z.isExploding && dist < 4.0) {
          z.isExploding = true;
          z.explodeTimer = 1.2;
        }

        // Apply movement (boosted if enraged, slowed down if agacé / taunted by pet)
        let moveSpeed = z.speed;
        if (z.isEnraged) {
          moveSpeed *= 1.35; // aggressive horde rush!
        }
        if (z.tauntTimer && z.tauntTimer > 0) {
          z.tauntTimer -= delta;
          moveSpeed *= 0.45; // Slowed significantly because he is agacé / distracted!
          if (z.tauntTimer <= 0) {
            z.isTaunted = false;
          }
        }

        z.group.position.x += dirX * moveSpeed * delta;
        z.group.position.z += dirZ * moveSpeed * delta;

        // Make barriers, vehicles, crates and arena walls 100% solid for zombies too!
        this.resolveObstacleCollisions(z.group.position, z.radius);

        // Rotate facing movement
        z.group.rotation.y = Math.atan2(dirX, dirZ);

        // Gentle walk wobble & articulated limb swing
        z.group.position.y = Math.abs(Math.sin(now * 0.008 + i)) * 0.08;

        const walkCycle = now * 0.009 + i * 0.7;
        if (z.leftLeg && z.rightLeg) {
          z.leftLeg.rotation.x = Math.sin(walkCycle) * 0.5;
          z.rightLeg.rotation.x = -Math.sin(walkCycle) * 0.5;
        }
        if (z.leftArm && z.rightArm) {
          z.leftArm.rotation.x = -Math.PI / 2.3 + Math.cos(walkCycle) * 0.25;
          z.rightArm.rotation.x = -Math.PI / 2.3 - Math.cos(walkCycle) * 0.25;
        }
        if (z.head) {
          // If agacé / confused, wobble head rapidly
          if (z.tauntTimer && z.tauntTimer > 0) {
            z.head.rotation.y = Math.sin(now * 0.02) * 0.6;
          } else {
            z.head.rotation.y = Math.sin(walkCycle * 0.5) * 0.15;
          }
        }

        // 1. Vehicle crushing: ram and pulverize zombie when driving!
        if (this.isDrivingVehicle && dist < z.radius + 2.4) {
          const ramDmg = 420 * this.damageMult;
          sound.playCarCrash();
          this.createExplosionParticles(z.group.position.x, z.group.position.z, 2.2);
          this.createFloatingCombatText(`💥 ÉCRASÉ! -${Math.round(ramDmg)}`, z.group.position.x, 2.2, z.group.position.z, '#fbbf24', 26);
          // Knock zombie flying backward
          z.group.position.x += -dirX * 3.4;
          z.group.position.z += -dirZ * 3.4;
          this.hitZombie(z, ramDmg);
          continue;
        }

        // 2. Contact attack damage to player (only when on foot, not in armored vehicle)
        if (!this.isDrivingVehicle && dist < z.radius + 0.65) {
          if (!z.lastAttackTime || now - z.lastAttackTime > 550) {
            z.lastAttackTime = now;
            this.damagePlayer(z.damage * 1.5);
            this.createFloatingCombatText(`-${Math.round(z.damage * 1.5)}`, playerPos.x + (Math.random() - 0.5) * 0.4, 1.8, playerPos.z + (Math.random() - 0.5) * 0.4, '#ef4444', 20);
          }
          // Continuous contact pressure
          this.damagePlayer(z.damage * delta * 1.5);
        }
      }
    }
  }

  // --- WEAPONS & COMBAT ---
  private updateWeapons(delta: number) {
    const damageBoost = 1 + (this.skillTiers.get('overclock_reactor') || 0) * 0.2;

    // 1. Plasma Blaster (Base weapon: balanced pacing so standing still is impossible)
    const blasterTier = this.skillTiers.get('plasma_blaster') || 1;
    this.blasterTimer += delta;
    const blasterInterval = Math.max(0.18, 0.58 - blasterTier * 0.06);

    if (this.blasterTimer >= blasterInterval) {
      this.blasterTimer = 0;
      this.firePlasmaBlaster(blasterTier, damageBoost);
    }

    // 2. Nano Drones
    const droneTier = this.skillTiers.get('nano_drones') || 0;
    if (droneTier > 0) {
      this.updateOrbitingDrones(delta, droneTier, damageBoost);
    }

    // 3. Tesla Coil (Arcs between multiple enemies)
    const teslaTier = this.skillTiers.get('tesla_coil') || 0;
    if (teslaTier > 0) {
      this.teslaTimer += delta;
      if (this.teslaTimer >= 2.2 - teslaTier * 0.2) {
        this.teslaTimer = 0;
        this.fireTeslaCoil(teslaTier, damageBoost);
      }
    }

    // 4. Bio-Mortar
    const mortarTier = this.skillTiers.get('bio_mortar') || 0;
    if (mortarTier > 0) {
      this.mortarTimer += delta;
      if (this.mortarTimer >= 3.0 - mortarTier * 0.3) {
        this.mortarTimer = 0;
        this.fireBioMortar(mortarTier, damageBoost);
      }
    }

    // 5. Piercing Railgun
    const railgunTier = this.skillTiers.get('piercing_railgun') || 0;
    if (railgunTier > 0) {
      this.railgunTimer += delta;
      if (this.railgunTimer >= 2.5 - railgunTier * 0.25) {
        this.railgunTimer = 0;
        this.fireRailgun(railgunTier, damageBoost);
      }
    }

    // 6. Forcefield Core passive
    const forcefieldTier = this.skillTiers.get('forcefield') || 0;
    if (forcefieldTier > 0) {
      this.maxShield = 40 + forcefieldTier * 30;
      this.shieldRegenTimer += delta;
      if (this.shieldRegenTimer >= 10 - forcefieldTier) {
        this.shieldRegenTimer = 0;
        this.currentShield = this.maxShield;
        this.callbacks.onHealthChanged(this.currentHp, this.maxHp, this.currentShield, this.maxShield);
      }
      if (this.playerShieldAura) {
        (this.playerShieldAura.material as THREE.MeshBasicMaterial).opacity = this.currentShield > 0 ? 0.35 : 0.0;
      }
    }

    // 7. Passive Vitality HP Regen
    const vitalityTier = this.skillTiers.get('vitality_core') || 0;
    if (vitalityTier > 0 && this.currentHp < this.maxHp) {
      this.currentHp = Math.min(this.maxHp, this.currentHp + (1.2 + vitalityTier * 0.8) * delta);
      this.callbacks.onHealthChanged(this.currentHp, this.maxHp, this.currentShield, this.maxShield);
    }
  }

  private firePlasmaBlaster(tier: number, dmgBoost: number) {
    // Find closest zombie within realistic combat engagement range (16m)
    let target: ZombieEntity | null = null;
    let closestDist = 16.0;
    this.zombies.forEach((z) => {
      const d = this.playerGroup.position.distanceTo(z.group.position);
      if (d < closestDist) {
        closestDist = d;
        target = z;
      }
    });

    if (!target) return;

    sound.playLaser();
    const pPos = this.playerGroup.position;
    const tPos = (target as ZombieEntity).group.position;
    const dx = tPos.x - pPos.x;
    const dz = tPos.z - pPos.z;
    const dist = Math.hypot(dx, dz);
    const speed = 28;

    const projData = ModelFactory.createProjectileModel('bullet', this.equippedFx);
    projData.mesh.rotation.y = Math.atan2(dx, dz);
    projData.mesh.position.set(pPos.x, 1.05, pPos.z);
    this.scene.add(projData.mesh);

    // Balanced damage: 11 base at Tier 1 (requires 2 shots to kill a 22hp zombie)
    const baseDmg = (10 + tier * 3.5) * dmgBoost;
    const isCrit = Math.random() < this.critChance;
    const finalDmg = isCrit ? baseDmg * 2.0 : baseDmg;

    this.projectiles.push({
      mesh: projData.mesh,
      vx: (dx / dist) * speed,
      vz: (dz / dist) * speed,
      damage: finalDmg,
      life: 1.2,
      // Tier 1 hits single target; Tier 2+ gains piercing
      pierceRemaining: tier > 1 ? 1 : 0,
      type: 'bullet',
      radius: projData.radius,
    });
  }

  private updateOrbitingDrones(delta: number, tier: number, dmgBoost: number) {
    const requiredDrones = Math.min(6, 1 + tier);
    while (this.drones.length < requiredDrones) {
      const dGroup = new THREE.Group();
      const dMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.35), new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2 }));
      dGroup.add(dMesh);
      const trail = new THREE.Mesh(new THREE.RingGeometry(0.15, 0.28, 8), new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide }));
      trail.rotation.x = Math.PI / 2;
      dGroup.add(trail);
      this.scene.add(dGroup);
      this.drones.push({ mesh: dGroup, angle: (this.drones.length * Math.PI * 2) / requiredDrones, distance: 2.4 + tier * 0.3 });
    }

    const rotationSpeed = 3.2;
    this.drones.forEach((drone) => {
      drone.angle += delta * rotationSpeed;
      const dx = Math.cos(drone.angle) * drone.distance;
      const dz = Math.sin(drone.angle) * drone.distance;
      drone.mesh.position.set(this.playerGroup.position.x + dx, 1.2, this.playerGroup.position.z + dz);
      drone.mesh.rotation.y += delta * 5;

      // Contact collision with zombies
      this.zombies.forEach((z) => {
        if (drone.mesh.position.distanceTo(z.group.position) < z.radius + 0.4) {
          this.hitZombie(z, (8 + tier * 3) * dmgBoost * delta * 5);
          this.createSparkParticles(drone.mesh.position.x, drone.mesh.position.z, 0x00ffff);
        }
      });
    });
  }

  private fireTeslaCoil(tier: number, dmgBoost: number) {
    // Zap up to 3 + tier zombies
    const maxTargets = 2 + tier * 2;
    const inRange = this.zombies.filter((z) => this.playerGroup.position.distanceTo(z.group.position) < 18);
    if (inRange.length === 0) return;

    sound.playLightning();
    const zapCount = Math.min(maxTargets, inRange.length);
    for (let i = 0; i < zapCount; i++) {
      const target = inRange[i];
      this.hitZombie(target, (22 + tier * 8) * dmgBoost);
      this.createLightningEffect(this.playerGroup.position, target.group.position);
    }
  }

  private createLightningEffect(start: THREE.Vector3, end: THREE.Vector3) {
    const points = [
      new THREE.Vector3(start.x, 1.2, start.z),
      new THREE.Vector3((start.x + end.x) / 2 + (Math.random() - 0.5) * 1.5, 1.4, (start.z + end.z) / 2 + (Math.random() - 0.5) * 1.5),
      new THREE.Vector3(end.x, 1.0, end.z),
    ];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8 });
    const line = new THREE.Line(lineGeo, lineMat);
    this.scene.add(line);
    setTimeout(() => {
      this.scene.remove(line);
      lineGeo.dispose();
      lineMat.dispose();
    }, 120);
  }

  private fireBioMortar(tier: number, dmgBoost: number) {
    // Pick densest enemy cluster or random zombie
    if (this.zombies.length === 0) return;
    const target = this.zombies[Math.floor(Math.random() * this.zombies.length)];

    const pPos = this.playerGroup.position;
    const tPos = target.group.position;
    const projData = ModelFactory.createProjectileModel('bomb', this.equippedFx);
    projData.mesh.position.set(pPos.x, 1.2, pPos.z);
    this.scene.add(projData.mesh);

    const dx = tPos.x - pPos.x;
    const dz = tPos.z - pPos.z;
    const dist = Math.hypot(dx, dz);
    const speed = 16;

    this.projectiles.push({
      mesh: projData.mesh,
      vx: (dx / dist) * speed,
      vz: (dz / dist) * speed,
      damage: (35 + tier * 12) * dmgBoost,
      life: Math.min(2.0, dist / speed),
      pierceRemaining: 1,
      type: 'bomb',
      radius: projData.radius,
    });
  }

  private fireRailgun(tier: number, dmgBoost: number) {
    if (this.zombies.length === 0) return;
    let target: ZombieEntity | null = null;
    let closestDist = 26;
    this.zombies.forEach((z) => {
      const d = this.playerGroup.position.distanceTo(z.group.position);
      if (d < closestDist) {
        closestDist = d;
        target = z;
      }
    });
    if (!target) return;

    sound.playLaser(0.6);
    const pPos = this.playerGroup.position;
    const tPos = (target as ZombieEntity).group.position;
    const dx = tPos.x - pPos.x;
    const dz = tPos.z - pPos.z;
    const dist = Math.hypot(dx, dz);
    const speed = 45;

    const projData = ModelFactory.createProjectileModel('railgun', this.equippedFx);
    projData.mesh.rotation.y = Math.atan2(dx, dz);
    projData.mesh.position.set(pPos.x, 1.05, pPos.z);
    this.scene.add(projData.mesh);

    this.projectiles.push({
      mesh: projData.mesh,
      vx: (dx / dist) * speed,
      vz: (dz / dist) * speed,
      damage: (45 + tier * 15) * dmgBoost,
      life: 1.5,
      pierceRemaining: 6 + tier * 2, // Pierces through multiple enemies
      type: 'railgun',
      radius: projData.radius,
    });
  }

  // --- PROJECTILES TICK & COLLISION ---
  private updateProjectiles(delta: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= delta;
      p.mesh.position.x += p.vx * delta;
      p.mesh.position.z += p.vz * delta;

      let destroyed = false;

      // Direct hit detection in horizontal X-Z plane with vertical height clearance
      for (let j = this.zombies.length - 1; j >= 0; j--) {
        const z = this.zombies[j];
        const dx = p.mesh.position.x - z.group.position.x;
        const dz = p.mesh.position.z - z.group.position.z;
        const horizDist = Math.hypot(dx, dz);
        const hitRadius = z.radius + p.radius + 0.3; // Generous satisfying hit radius
        const inHeight = p.mesh.position.y >= z.group.position.y - 0.4 && p.mesh.position.y <= z.group.position.y + z.height + 0.6;

        if (horizDist <= hitRadius && inHeight) {
          if (p.type === 'bomb') {
            // Area explosion
            sound.playExplosion();
            this.createExplosionParticles(p.mesh.position.x, p.mesh.position.z, 2.8);
            this.zombies.forEach((nearby) => {
              const ndx = p.mesh.position.x - nearby.group.position.x;
              const ndz = p.mesh.position.z - nearby.group.position.z;
              if (Math.hypot(ndx, ndz) <= 3.8) {
                this.hitZombie(nearby, p.damage);
              }
            });
            destroyed = true;
            break;
          } else {
            // Bullet / Railgun
            this.hitZombie(z, p.damage);
            this.createSparkParticles(p.mesh.position.x, p.mesh.position.z, 0x00f0ff);
            p.pierceRemaining--;
            if (p.pierceRemaining <= 0) {
              destroyed = true;
              break;
            }
          }
        }
      }

      if (destroyed || p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) {
            (c as THREE.Mesh).geometry?.dispose();
            if (Array.isArray((c as THREE.Mesh).material)) {
              ((c as THREE.Mesh).material as THREE.Material[]).forEach((m) => m.dispose());
            } else {
              ((c as THREE.Mesh).material as THREE.Material)?.dispose();
            }
          }
        });
        this.projectiles.splice(i, 1);
      }
    }
  }

  private hitZombie(z: ZombieEntity, damage: number) {
    // Armored zombie takes 30% reduced damage
    const actualDmg = z.type === 'armored' ? damage * 0.7 : damage;
    z.hp -= actualDmg;

    // Boss health sync
    if (z.isBoss) {
      this.callbacks.onBossHpChanged(Math.max(0, z.hp), z.maxHp);
    }

    // Flash hit effect
    z.group.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) {
        const mat = (c as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat.color) {
          const oldColor = mat.color.getHex();
          mat.color.setHex(0xffffff);
          setTimeout(() => {
            if (mat && mat.color) mat.color.setHex(oldColor);
          }, 60);
        }
      }
    });

    if (z.hp <= 0) {
      this.onZombieKilled(z);
    }
  }

  private onZombieKilled(z: ZombieEntity) {
    const idx = this.zombies.indexOf(z);
    if (idx !== -1) {
      this.removeZombie(idx);
    }

    sound.playZombiePoof();
    this.kills += 1;
    this.score += z.isBoss ? 500 : z.type === 'elite' ? 150 : 25;
    this.callbacks.onScoreChanged(this.score, this.kills);

    // Green smoke / particle explosion (Strict compliance: no blood/gore, clean energy smoke)
    this.createZombieDefeatParticles(z.group.position.x, z.group.position.z, z.type === 'elite' ? 24 : 14);

    // Drop XP Gem
    this.spawnXpGem(z.group.position.x, z.group.position.z, z.xpValue);

    // Toxic zombie leaves green poison pool
    if (z.type === 'toxic') {
      this.createPoisonPuddle(z.group.position.x, z.group.position.z);
    }

    // Boss defeated
    if (z.isBoss) {
      this.bossesKilled += 1;
      this.activeBoss = null;
      this.callbacks.onBossDefeated();
      // Drop bonus XP ring
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI * 2) / 8;
        this.spawnXpGem(z.group.position.x + Math.cos(a) * 2.5, z.group.position.z + Math.sin(a) * 2.5, 30);
      }
    }
  }

  private removeZombie(index: number) {
    const z = this.zombies[index];
    this.scene.remove(z.group);
    z.group.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) {
        (c as THREE.Mesh).geometry?.dispose();
        if (Array.isArray((c as THREE.Mesh).material)) {
          ((c as THREE.Mesh).material as THREE.Material[]).forEach((m) => m.dispose());
        } else {
          ((c as THREE.Mesh).material as THREE.Material)?.dispose();
        }
      }
    });
    this.zombies.splice(index, 1);
  }

  // --- XP GEMS & MAGNET ---
  private spawnXpGem(x: number, z: number, value: number) {
    const group = new THREE.Group();
    const tier: 'gold' | 'cyan' | 'green' = value >= 50 ? 'gold' : value >= 20 ? 'cyan' : 'green';
    const coreColor = value >= 50 ? 0xf59e0b : value >= 20 ? 0x00f0ff : 0x22c55e;
    const baseRadius = 0.26 + Math.min(0.2, value * 0.005);

    // Textured multifaceted outer crystal
    const tex = TextureGenerator.getXpOrbTexture(tier);
    const crystalGeo = new THREE.OctahedronGeometry(baseRadius, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.2,
      metalness: 0.5,
      emissive: new THREE.Color(coreColor),
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.92,
    });
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    crystalMesh.castShadow = true;
    group.add(crystalMesh);

    // Glowing inner energy core
    const coreGeo = new THREE.SphereGeometry(baseRadius * 0.45, 8, 8);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    group.add(coreMesh);

    // Floating subtle glow aura disk underneath
    const haloGeo = new THREE.RingGeometry(baseRadius * 0.8, baseRadius * 1.5, 16);
    const haloMat = new THREE.MeshBasicMaterial({
      color: coreColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = Math.PI / 2;
    halo.position.y = -baseRadius * 0.8;
    group.add(halo);

    group.position.set(x, 0.45, z);
    this.scene.add(group);

    this.xpGems.push({ mesh: group, x, z, value, magnetized: false });
  }

  private updateXpGems(delta: number) {
    const playerPos = this.playerGroup.position;
    const currentMagnet = this.magnetRadius * (1 + (this.skillTiers.get('magnet_sensor') || 0) * 0.4);
    const now = performance.now();

    // Consolidate excess gems if count exceeds 60 to prevent WebGL draw-call saturation
    if (this.xpGems.length > 60) {
      for (let i = 0; i < this.xpGems.length - 1; i++) {
        const g1 = this.xpGems[i];
        if (g1.magnetized) continue;
        for (let j = i + 1; j < this.xpGems.length; j++) {
          const g2 = this.xpGems[j];
          if (g2.magnetized) continue;
          const dx = g1.mesh.position.x - g2.mesh.position.x;
          const dz = g1.mesh.position.z - g2.mesh.position.z;
          if (dx * dx + dz * dz < 25) { // within 5 meters
            g1.value += g2.value;
            this.scene.remove(g2.mesh);
            g2.mesh.traverse((c) => {
              if ((c as THREE.Mesh).isMesh) {
                (c as THREE.Mesh).geometry?.dispose();
                const m = (c as THREE.Mesh).material;
                if (Array.isArray(m)) m.forEach((mat) => mat.dispose());
                else m?.dispose();
              }
            });
            this.xpGems.splice(j, 1);
            break;
          }
        }
        if (this.xpGems.length <= 50) break;
      }
    }

    for (let i = this.xpGems.length - 1; i >= 0; i--) {
      const gem = this.xpGems[i];
      const dist = playerPos.distanceTo(gem.mesh.position);

      // Multi-axis gem rotation & floating oscillation
      gem.mesh.rotation.y += delta * 2.8;
      gem.mesh.rotation.x += delta * 1.2;
      gem.mesh.position.y = 0.4 + Math.sin(now * 0.006 + i) * 0.12;

      // Magnet attraction
      if (dist < currentMagnet) {
        gem.magnetized = true;
      }

      if (gem.magnetized) {
        const dx = playerPos.x - gem.mesh.position.x;
        const dz = playerPos.z - gem.mesh.position.z;
        const d = Math.hypot(dx, dz);
        const magnetSpeed = 16.0;
        gem.mesh.position.x += (dx / d) * magnetSpeed * delta;
        gem.mesh.position.z += (dz / d) * magnetSpeed * delta;

        // Collected
        if (d < 0.75) {
          sound.playGemCollect();
          this.gainXp(gem.value);
          this.scene.remove(gem.mesh);
          gem.mesh.traverse((c) => {
            if ((c as THREE.Mesh).isMesh) {
              (c as THREE.Mesh).geometry?.dispose();
              if (Array.isArray((c as THREE.Mesh).material)) {
                ((c as THREE.Mesh).material as THREE.Material[]).forEach((m) => m.dispose());
              } else {
                ((c as THREE.Mesh).material as THREE.Material)?.dispose();
              }
            }
          });
          this.xpGems.splice(i, 1);
        }
      }
    }
  }

  private gainXp(amount: number) {
    this.currentXp += amount;
    if (this.currentXp >= this.maxXp) {
      this.currentXp -= this.maxXp;
      this.level += 1;
      this.totalLevelUps += 1;
      this.maxXp = Math.round(this.maxXp * 1.35 + 15);
      sound.playLevelUp();
      this.isPaused = true;
      this.callbacks.onLevelUp();
    }
    this.callbacks.onXpChanged(this.currentXp, this.maxXp, this.level);
  }

  // --- POISON PUDDLES ---
  private createPoisonPuddle(x: number, z: number) {
    const id = 'puddle_' + Math.random().toString(36).substring(2, 9);
    const radius = 2.0;

    const geo = new THREE.CircleGeometry(radius, 16);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x84cc16,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.05, z);
    this.scene.add(mesh);

    this.puddleMeshes.set(id, mesh);
    this.puddles.push({
      id,
      x,
      z,
      radius,
      durationMs: 7000,
      damagePerSec: 12,
      createdAt: Date.now(),
    });
  }

  private updatePuddles(delta: number) {
    const now = Date.now();
    const playerPos = this.playerGroup.position;

    for (let i = this.puddles.length - 1; i >= 0; i--) {
      const p = this.puddles[i];
      const elapsed = now - p.createdAt;

      if (elapsed >= p.durationMs) {
        const mesh = this.puddleMeshes.get(p.id);
        if (mesh) {
          this.scene.remove(mesh);
          mesh.geometry.dispose();
          (mesh.material as THREE.Material).dispose();
          this.puddleMeshes.delete(p.id);
        }
        this.puddles.splice(i, 1);
        continue;
      }

      // Check player inside poison pool
      const dist = Math.hypot(playerPos.x - p.x, playerPos.z - p.z);
      if (dist < p.radius) {
        this.damagePlayer(p.damagePerSec * delta);
      }
    }
  }

  // --- PARTICLE EFFECTS (GREEN SMOKE, SPARKS) ---
  private createZombieDefeatParticles(x: number, z: number, count: number) {
    const matGreen = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      transparent: true,
      opacity: 0.9,
    });
    const matLightGreen = new THREE.MeshBasicMaterial({
      color: 0x86efac,
      transparent: true,
      opacity: 0.9,
    });

    const clampedCount = Math.min(count, 14);
    for (let i = 0; i < clampedCount; i++) {
      const mesh = new THREE.Mesh(GameEngine.sharedSmokeGeo, Math.random() > 0.4 ? matGreen : matLightGreen);
      const s = 0.8 + Math.random() * 0.5;
      mesh.scale.set(s, s, s);
      mesh.position.set(x + (Math.random() - 0.5) * 0.4, 0.8 + Math.random() * 0.4, z + (Math.random() - 0.5) * 0.4);
      this.scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 3.0;
      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: 1.8 + Math.random() * 2.2,
        vz: Math.sin(angle) * speed,
        life: 0.55 + Math.random() * 0.25,
        maxLife: 0.75,
        colorType: 'green_smoke',
      });
    }
  }

  private createSparkParticles(x: number, z: number, colorHex: number) {
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });
    for (let i = 0; i < 4; i++) {
      const mesh = new THREE.Mesh(GameEngine.sharedSparkGeo, mat);
      mesh.position.set(x, 1.0, z);
      this.scene.add(mesh);

      this.particles.push({
        mesh,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        vz: (Math.random() - 0.5) * 4,
        life: 0.25,
        maxLife: 0.25,
        colorType: 'spark',
      });
    }
  }

  private createExplosionParticles(x: number, z: number, radius: number) {
    const matOrange = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.85,
    });
    const matRed = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.85,
    });

    for (let i = 0; i < 14; i++) {
      const mesh = new THREE.Mesh(GameEngine.sharedExplosionGeo, Math.random() > 0.5 ? matOrange : matRed);
      const scale = (0.7 + Math.random() * 0.6) * (radius / 2.5);
      mesh.scale.set(scale, scale, scale);
      mesh.position.set(x, 0.6, z);
      this.scene.add(mesh);

      const a = Math.random() * Math.PI * 2;
      const spd = 3.5 + Math.random() * 4.5;
      this.particles.push({
        mesh,
        vx: Math.cos(a) * spd,
        vy: 1.5 + Math.random() * 2.8,
        vz: Math.sin(a) * spd,
        life: 0.55,
        maxLife: 0.55,
        colorType: 'explosion',
      });
    }
  }

  private updateParticles(delta: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;

      p.mesh.position.x += p.vx * delta;
      p.mesh.position.y += p.vy * delta;
      p.mesh.position.z += p.vz * delta;

      // Gravity or upward smoke drift
      if (p.colorType === 'green_smoke') {
        p.vy += delta * 1.5; // gentle upward smoke
        const scale = 1 + (1 - p.life / p.maxLife) * 1.2;
        p.mesh.scale.set(scale, scale, scale);
      } else {
        p.vy -= delta * 9.8; // gravity for sparks & fire
      }

      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      if (mat.opacity !== undefined) {
        mat.opacity = Math.max(0, p.life / p.maxLife);
      }

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        // Only dispose non-shared geometries
        if (
          p.mesh.geometry !== GameEngine.sharedSparkGeo &&
          p.mesh.geometry !== GameEngine.sharedExplosionGeo &&
          p.mesh.geometry !== GameEngine.sharedSmokeGeo
        ) {
          p.mesh.geometry?.dispose();
        }
        mat.dispose();
        this.particles.splice(i, 1);
      }
    }
  }

  // --- PLAYER HEALTH & DAMAGE ---
  public damagePlayer(amount: number) {
    if (this.isGameOver) return;

    // 100% Armored invulnerability while inside combat vehicle!
    if (this.isDrivingVehicle) {
      sound.playShieldBlock();
      this.createSparkParticles(this.playerGroup.position.x, this.playerGroup.position.z, 0x00f0ff);
      return;
    }

    sound.playPlayerHit();

    // Shield absorption first
    if (this.currentShield > 0) {
      if (this.currentShield >= amount) {
        this.currentShield -= amount;
        amount = 0;
      } else {
        amount -= this.currentShield;
        this.currentShield = 0;
      }
    }

    if (amount > 0) {
      this.currentHp = Math.max(0, this.currentHp - amount);
    }

    this.callbacks.onHealthChanged(this.currentHp, this.maxHp, this.currentShield, this.maxShield);

    // Screen flash red / camera shake
    this.camera.position.x += (Math.random() - 0.5) * 0.35;
    this.camera.position.z += (Math.random() - 0.5) * 0.35;

    if (this.currentHp <= 0) {
      this.handleGameOver();
    }
  }

  public healPlayer(percent: number) {
    this.currentHp = Math.min(this.maxHp, this.currentHp + (this.maxHp * percent) / 100);
    this.callbacks.onHealthChanged(this.currentHp, this.maxHp, this.currentShield, this.maxShield);
  }

  public resurrectPlayer() {
    this.currentHp = this.maxHp * 0.6;
    this.currentShield = this.maxShield;
    this.isGameOver = false;
    this.isPaused = false;
    this.callbacks.onHealthChanged(this.currentHp, this.maxHp, this.currentShield, this.maxShield);

    // Clear perimeter around player so resurrection feels safe & fair
    const pPos = this.playerGroup.position;
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      if (pPos.distanceTo(this.zombies[i].group.position) < 14 && !this.zombies[i].isBoss) {
        this.onZombieKilled(this.zombies[i]);
      }
    }
  }

  private handleGameOver() {
    this.isGameOver = true;
    this.isPaused = true;
    const timeSec = Math.floor(this.survivalTime);
    this.callbacks.onGameOver(this.score, timeSec, this.kills, this.currentWave, this.level, this.bossesKilled);
  }

  // --- SKILL UPGRADES APPLICATION ---
  public applySkill(skill: SkillUpgrade) {
    if (skill.id === 'bonus_health_scrap') {
      this.currentHp = Math.min(this.maxHp, this.currentHp + 60);
      this.callbacks.onHealthChanged(this.currentHp, this.maxHp, this.currentShield, this.maxShield);
      this.createFloatingCombatText('SOIN +60 PV & +100 FERRAILLE', this.playerGroup.position.x, 2.2, this.playerGroup.position.z, '#22c55e', 24);
      this.isPaused = false;
      return;
    }

    const currentTier = this.skillTiers.get(skill.id) || 0;
    const newTier = currentTier + 1;
    this.skillTiers.set(skill.id, newTier);

    if (skill.id === 'vitality_core') {
      this.maxHp += 30;
      this.currentHp += 30;
      this.callbacks.onHealthChanged(this.currentHp, this.maxHp, this.currentShield, this.maxShield);
    } else if (skill.id === 'forcefield') {
      this.maxShield = 40 + newTier * 30;
      this.currentShield = this.maxShield;
      this.callbacks.onHealthChanged(this.currentHp, this.maxHp, this.currentShield, this.maxShield);
    } else if (skill.id === 'combat_vehicle') {
      // Immediately launch into the 10-second combat driving spree!
      this.activateCombatVehicle();
    }

    this.isPaused = false;
  }

  /**
   * Activates the 10-second combat vehicle driving mode!
   */
  public activateCombatVehicle(): boolean {
    const tier = this.skillTiers.get('combat_vehicle') || 0;
    // Can be activated if skill unlocked, OR if near any parked car in the arena!
    let nearParkedCar = false;
    const pPos = this.playerGroup.position;
    for (const pv of this.parkedVehicles) {
      if (Math.hypot(pPos.x - pv.x, pPos.z - pv.z) < 3.8) {
        nearParkedCar = true;
        break;
      }
    }

    if (tier === 0 && !nearParkedCar) {
      return false;
    }

    if (this.isDrivingVehicle) return false;
    if (this.vehicleCooldownLeft > 0 && !nearParkedCar) return false;

    this.isDrivingVehicle = true;
    this.vehicleDriveTimeLeft = this.vehicleMaxDriveTime; // exactly 10.0 seconds!
    this.vehicleMaxCooldown = Math.max(10, 28 - Math.max(tier, 1) * 3);

    // Audio SFX
    sound.playCarEngine();
    sound.playCarHorn();

    // Hide human limbs
    if (this.playerParts) {
      this.playerParts.root.visible = false;
    }

    // Attach combat vehicle model if not already created
    if (!this.combatVehicleGroup) {
      const vModel = ModelFactory.createCombatDrivableVehicleModel('#00f0ff');
      this.combatVehicleGroup = vModel.root;
      this.vehicleWheels = vModel.wheels;
      this.vehicleBeaconL = vModel.beaconL;
      this.vehicleBeaconR = vModel.beaconR;
      this.vehicleSpotLight = vModel.spotLight;
      this.playerGroup.add(this.combatVehicleGroup);
    } else {
      this.combatVehicleGroup.visible = true;
    }

    // Ignition explosion effect & text
    this.createExplosionParticles(this.playerGroup.position.x, this.playerGroup.position.z, 2.5);
    this.createFloatingCombatText('🚗 BLINDÉ DE COMBAT ACTIVÉ (10s)!', this.playerGroup.position.x, 2.6, this.playerGroup.position.z, '#00f0ff', 24);

    this.callbacks.onVehicleStateChanged?.(
      true,
      this.vehicleDriveTimeLeft,
      0,
      this.vehicleMaxCooldown,
      tier > 0 || nearParkedCar
    );

    return true;
  }

  /**
   * Updates vehicle timers, mounted turret firing, beacon flashing, and dismount explosion
   */
  private updateVehicleMode(delta: number) {
    const tier = this.skillTiers.get('combat_vehicle') || 0;

    if (this.isDrivingVehicle) {
      this.vehicleDriveTimeLeft -= delta;

      // Roof-mounted twin machine gun fire at closest zombie
      this.vehicleFireTimer += delta;
      if (this.vehicleFireTimer >= 0.16) {
        this.vehicleFireTimer = 0;
        this.fireVehicleMountedGuns();
      }

      // Flashing police / military sirens
      const beaconPhase = Math.floor(performance.now() * 0.008) % 2;
      if (this.vehicleBeaconL && this.vehicleBeaconR) {
        (this.vehicleBeaconL.material as THREE.MeshBasicMaterial).color.setHex(beaconPhase === 0 ? 0xef4444 : 0x450a0a);
        (this.vehicleBeaconR.material as THREE.MeshBasicMaterial).color.setHex(beaconPhase === 1 ? 0x00f0ff : 0x082f49);
      }

      // Nitro exhaust flame & sparks behind car
      this.vehicleNitroTimer += delta;
      if (this.vehicleNitroTimer >= 0.05) {
        this.vehicleNitroTimer = 0;
        const forwardAngle = this.playerGroup.rotation.y;
        const rearX = this.playerGroup.position.x - Math.sin(forwardAngle) * 2.1;
        const rearZ = this.playerGroup.position.z - Math.cos(forwardAngle) * 2.1;
        this.createSparkParticles(rearX, rearZ, 0x00f0ff);
      }

      // Callback sync
      this.callbacks.onVehicleStateChanged?.(
        true,
        Math.max(0, this.vehicleDriveTimeLeft),
        0,
        this.vehicleMaxCooldown,
        true
      );

      // Duration expired (10 seconds completed!) -> Dismount!
      if (this.vehicleDriveTimeLeft <= 0) {
        this.isDrivingVehicle = false;
        this.vehicleCooldownLeft = this.vehicleMaxCooldown;

        if (this.combatVehicleGroup) {
          this.combatVehicleGroup.visible = false;
        }
        if (this.playerParts) {
          this.playerParts.root.visible = true;
        }

        // Blast wave dismount: knock back & blast nearby zombies
        sound.playExplosion();
        this.createExplosionParticles(this.playerGroup.position.x, this.playerGroup.position.z, 4.0);
        this.createFloatingCombatText('💥 DÉBARQUEMENT DU BLINDÉ !', this.playerGroup.position.x, 2.6, this.playerGroup.position.z, '#f59e0b', 24);

        const pPos = this.playerGroup.position;
        this.zombies.forEach((z) => {
          const d = pPos.distanceTo(z.group.position);
          if (d < 6.0) {
            this.hitZombie(z, 220 * this.damageMult);
          }
        });

        this.callbacks.onVehicleStateChanged?.(
          false,
          0,
          this.vehicleCooldownLeft,
          this.vehicleMaxCooldown,
          tier > 0
        );
      }
    } else {
      // Cooldown timer
      if (this.vehicleCooldownLeft > 0) {
        this.vehicleCooldownLeft -= delta;
        if (this.vehicleCooldownLeft <= 0) {
          this.vehicleCooldownLeft = 0;
          sound.playPowerUp();
          this.createFloatingCombatText('⚡ BLINDÉ PRÊT ! [E]', this.playerGroup.position.x, 2.5, this.playerGroup.position.z, '#00f0ff', 22);
        }
        this.callbacks.onVehicleStateChanged?.(
          false,
          0,
          Math.max(0, this.vehicleCooldownLeft),
          this.vehicleMaxCooldown,
          tier > 0
        );
      }
    }
  }

  /**
   * Fires the combat vehicle's roof twin rotary machine guns
   */
  private fireVehicleMountedGuns() {
    if (this.zombies.length === 0) return;
    const playerPos = this.playerGroup.position;
    let closestZombie: ZombieEntity | null = null;
    let closestDist = 24;

    for (let i = 0; i < this.zombies.length; i++) {
      const z = this.zombies[i];
      const d = playerPos.distanceTo(z.group.position);
      if (d < closestDist) {
        closestDist = d;
        closestZombie = z;
      }
    }

    if (!closestZombie) return;

    sound.playLaser(1.2);
    const targetPos = closestZombie.group.position;
    const dx = targetPos.x - playerPos.x;
    const dz = targetPos.z - playerPos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.01) return;

    const dirX = dx / dist;
    const dirZ = dz / dist;
    const speed = 38;
    const damage = 95 * this.damageMult;

    [-0.35, 0.35].forEach((offset) => {
      const perpX = -dirZ * offset;
      const perpZ = dirX * offset;
      const projData = ModelFactory.createProjectileModel('bullet', 'cyber');
      const bulletGroup = projData.mesh;
      bulletGroup.position.set(playerPos.x + perpX, 1.8, playerPos.z + perpZ);
      bulletGroup.rotation.y = Math.atan2(dirX, dirZ);
      this.scene.add(bulletGroup);

      this.projectiles.push({
        mesh: bulletGroup,
        vx: dirX * speed,
        vz: dirZ * speed,
        damage,
        life: 1.2,
        pierceRemaining: 2,
        type: 'bullet',
        radius: 0.35,
      });
    });
  }

  public getSkillTier(skillId: string): number {
    return this.skillTiers.get(skillId) || 0;
  }

  public getActiveSkills(): { id: string; tier: number }[] {
    const result: { id: string; tier: number }[] = [];
    this.skillTiers.forEach((tier, id) => {
      if (tier > 0) result.push({ id, tier });
    });
    return result;
  }

  // --- RESIZING & CLEANUP ---
  public handleResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    if (width <= 0 || height <= 0) return;

    this.camera.aspect = width / height;
    const isPortrait = width < height;
    if (isPortrait) {
      this.camera.fov = 54;
      this.camera.position.set(this.playerGroup?.position.x || 0, 15.0, (this.playerGroup?.position.z || 0) + 11.0);
    } else {
      this.camera.fov = 46;
      this.camera.position.set(this.playerGroup?.position.x || 0, 13.5, (this.playerGroup?.position.z || 0) + 9.5);
    }
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  };

  public setSkinColor(colorHex: string) {
    if (this.playerBodyMesh) {
      ((this.playerBodyMesh.material as THREE.MeshStandardMaterial).color).setStyle(colorHex);
    }
  }

  public setSkin(skinId: string) {
    this.equippedSkin = skinId;
    this.buildPlayerModel();
  }

  public setWeaponSkin(weaponSkinId: string) {
    this.equippedWeaponSkin = weaponSkinId;
    this.buildPlayerModel();
  }

  public setProjectileFx(fxId: string) {
    this.equippedFx = fxId;
  }

  public setPet(petId: string) {
    this.equippedPet = petId;
    this.initPet();
  }

  /**
   * Initializes and spawns the chosen pet companion (Puppy or Hover Drone)
   */
  private initPet() {
    if (this.petGroup) {
      this.scene.remove(this.petGroup);
      this.petGroup.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) {
          (c as THREE.Mesh).geometry?.dispose();
          if (Array.isArray((c as THREE.Mesh).material)) {
            ((c as THREE.Mesh).material as THREE.Material[]).forEach((m) => m.dispose());
          } else {
            ((c as THREE.Mesh).material as THREE.Material)?.dispose();
          }
        }
      });
      this.petGroup = null;
    }

    if (!this.equippedPet || this.equippedPet === 'none') {
      this.petState = null;
      return;
    }

    const pX = this.playerGroup.position.x;
    const pZ = this.playerGroup.position.z;

    if (this.equippedPet === 'pet_cyberpup' || this.equippedPet.includes('pup') || this.equippedPet.includes('chien')) {
      // 3D Cyber-Puppy Companion
      const puppy = ModelFactory.createPetPuppy('#ec4899');
      this.petGroup = puppy.root;
      this.petGroup.position.set(pX - 1.2, 0, pZ + 0.8);
      this.scene.add(this.petGroup);

      this.petState = {
        mode: 'follow',
        target: null,
        actionTimer: 0,
        cooldownTimer: 1.2,
        currentX: pX - 1.2,
        currentZ: pZ + 0.8,
      };
    } else {
      // 3D Hover-Drone Companion
      this.petGroup = ModelFactory.createPetDrone();
      this.petGroup.position.set(pX + 1.2, 1.4, pZ);
      this.scene.add(this.petGroup);

      this.petState = {
        mode: 'follow',
        target: null,
        actionTimer: 0,
        cooldownTimer: 1.0,
        currentX: pX + 1.2,
        currentZ: pZ,
      };
    }
  }

  /**
   * Updates Pet Companion Movement & "Agacer" (Harassment / Taunt / Attack) Behavior
   */
  private updatePetCompanion(delta: number) {
    if (!this.petGroup || !this.petState || !this.equippedPet || this.equippedPet === 'none') {
      return;
    }

    const isPuppy = this.petGroup.userData.type === 'puppy';
    const playerPos = this.playerGroup.position;

    // Remove old zap beam if expired
    if (this.petZapBeam) {
      this.petZapLife -= delta;
      if (this.petZapLife <= 0) {
        this.scene.remove(this.petZapBeam);
        this.petZapBeam.geometry.dispose();
        (this.petZapBeam.material as THREE.Material).dispose();
        this.petZapBeam = null;
      }
    }

    if (isPuppy) {
      // === CYBER-PUPPY BEHAVIOR ===
      const uData = this.petGroup.userData;
      this.petState.cooldownTimer -= delta;

      // Find closest zombie within 9m
      let closestZombie: ZombieEntity | null = null;
      let closestDist = 9.0;
      for (const z of this.zombies) {
        const d = playerPos.distanceTo(z.group.position);
        if (d < closestDist && z.hp > 0) {
          closestDist = d;
          closestZombie = z;
        }
      }

      const pRot = this.playerGroup.rotation.y;
      // Target flank position beside player
      const followX = playerPos.x + Math.cos(pRot + 2.2) * 1.35;
      const followZ = playerPos.z + Math.sin(pRot + 2.2) * 1.35;

      if (this.petState.mode === 'follow') {
        // Run/trot toward player flank
        const dx = followX - this.petGroup.position.x;
        const dz = followZ - this.petGroup.position.z;
        const distToFlank = Math.hypot(dx, dz);

        if (distToFlank > 0.2) {
          const moveSpeed = Math.min(12, distToFlank * 7.0);
          this.petGroup.position.x += (dx / distToFlank) * moveSpeed * delta;
          this.petGroup.position.z += (dz / distToFlank) * moveSpeed * delta;
          this.petGroup.rotation.y = Math.atan2(dx, dz);

          // 4-Leg Trotting & Tail Wagging
          const trot = performance.now() * 0.016;
          this.petGroup.position.y = Math.abs(Math.sin(trot)) * 0.06;
          if (uData.frontLegL && uData.frontLegR && uData.backLegL && uData.backLegR) {
            uData.frontLegL.rotation.x = Math.sin(trot) * 0.6;
            uData.frontLegR.rotation.x = -Math.sin(trot) * 0.6;
            uData.backLegL.rotation.x = -Math.sin(trot) * 0.55;
            uData.backLegR.rotation.x = Math.sin(trot) * 0.55;
          }
          if (uData.tail) uData.tail.rotation.y = Math.sin(trot * 2) * 0.5;
          if (uData.earL) uData.earL.rotation.z = 0.25 + Math.sin(trot) * 0.08;
          if (uData.earR) uData.earR.rotation.z = -0.25 - Math.sin(trot) * 0.08;
        } else {
          // Idle beside player: happy tail wag and breathing
          this.petGroup.position.y = 0;
          this.petGroup.rotation.y = pRot;
          if (uData.frontLegL) uData.frontLegL.rotation.x *= 0.8;
          if (uData.frontLegR) uData.frontLegR.rotation.x *= 0.8;
          if (uData.backLegL) uData.backLegL.rotation.x *= 0.8;
          if (uData.backLegR) uData.backLegR.rotation.x *= 0.8;
          if (uData.tail) uData.tail.rotation.y = Math.sin(performance.now() * 0.01) * 0.4;
          if (uData.head) uData.head.rotation.z = Math.sin(performance.now() * 0.003) * 0.08;
        }

        // Trigger "Agacer" attack if enemy nearby and cooldown ready
        if (this.petState.cooldownTimer <= 0 && closestZombie) {
          this.petState.mode = 'charging';
          this.petState.target = closestZombie;
          this.petState.actionTimer = 1.4; // max chase time
          sound.playPuppyBark();
          this.createFloatingCombatText('WOUF ! ⚡', this.petGroup.position.x, 1.0, this.petGroup.position.z, '#ec4899', 24);
        }
      } else if (this.petState.mode === 'charging') {
        const target = this.petState.target;
        if (!target || target.hp <= 0 || !this.zombies.includes(target)) {
          this.petState.mode = 'return';
          return;
        }

        this.petState.actionTimer -= delta;
        const tx = target.group.position.x;
        const tz = target.group.position.z;
        const dx = tx - this.petGroup.position.x;
        const dz = tz - this.petGroup.position.z;
        const dist = Math.hypot(dx, dz);

        // Sprint towards enemy to agace/taunt
        const sprintSpeed = 13.5;
        this.petGroup.position.x += (dx / dist) * sprintSpeed * delta;
        this.petGroup.position.z += (dz / dist) * sprintSpeed * delta;
        this.petGroup.rotation.y = Math.atan2(dx, dz);

        const sprintRun = performance.now() * 0.024;
        this.petGroup.position.y = Math.abs(Math.sin(sprintRun)) * 0.1;
        if (uData.frontLegL && uData.frontLegR) {
          uData.frontLegL.rotation.x = Math.sin(sprintRun) * 0.7;
          uData.frontLegR.rotation.x = -Math.sin(sprintRun) * 0.7;
          uData.backLegL.rotation.x = -Math.sin(sprintRun) * 0.65;
          uData.backLegR.rotation.x = Math.sin(sprintRun) * 0.65;
        }
        if (uData.tail) uData.tail.rotation.y = Math.sin(sprintRun * 2) * 0.6;

        // Reach target -> Pounce, bark shockwave, bite & agacer!
        if (dist <= 1.3 || this.petState.actionTimer <= 0) {
          this.petState.mode = 'taunting';
          this.petState.actionTimer = 0.5;

          // Cute pounce hop
          this.petGroup.position.y = 0.45;
          sound.playPuppyBark();

          // Sonic bark shockwave
          this.createBarkShockwave(tx, tz, 0xec4899);

          // Floating combat feedback
          this.createFloatingCombatText('MORDILLEMENT ! (Agacé)', tx, 1.5, tz, '#f43f5e', 22);

          // Damage target and agacer/stun
          this.hitZombie(target, 35);
          target.tauntTimer = 2.8; // Agacé: slowed by 55%
          target.isTaunted = true;

          // Agacer nearby zombies too
          for (const z of this.zombies) {
            if (z !== target && z.group.position.distanceTo(target.group.position) < 3.2) {
              z.tauntTimer = 2.0;
              this.createSparkParticles(z.group.position.x, z.group.position.z, 0xec4899);
            }
          }
        }
      } else if (this.petState.mode === 'taunting') {
        this.petState.actionTimer -= delta;
        // Paws swiping playfully, head shaking
        if (uData.head) uData.head.rotation.y = Math.sin(performance.now() * 0.03) * 0.4;
        if (uData.tail) uData.tail.rotation.y = Math.sin(performance.now() * 0.04) * 0.7;

        if (this.petState.actionTimer <= 0) {
          this.petState.mode = 'return';
        }
      } else if (this.petState.mode === 'return') {
        // Sprint back to master
        const dx = followX - this.petGroup.position.x;
        const dz = followZ - this.petGroup.position.z;
        const dist = Math.hypot(dx, dz);

        if (dist > 0.6) {
          const retSpeed = 12.5;
          this.petGroup.position.x += (dx / dist) * retSpeed * delta;
          this.petGroup.position.z += (dz / dist) * retSpeed * delta;
          this.petGroup.rotation.y = Math.atan2(dx, dz);

          const retRun = performance.now() * 0.02;
          this.petGroup.position.y = Math.abs(Math.sin(retRun)) * 0.08;
          if (uData.frontLegL && uData.frontLegR) {
            uData.frontLegL.rotation.x = Math.sin(retRun) * 0.55;
            uData.frontLegR.rotation.x = -Math.sin(retRun) * 0.55;
            uData.backLegL.rotation.x = -Math.sin(retRun) * 0.5;
            uData.backLegR.rotation.x = Math.sin(retRun) * 0.5;
          }
          if (uData.tail) uData.tail.rotation.y = Math.sin(retRun * 2) * 0.5;
        } else {
          // Back with player!
          this.petState.mode = 'follow';
          this.petState.cooldownTimer = 2.6; // Ready to agace again soon
        }
      }
    } else {
      // === HOVER DRONE BEHAVIOR ===
      const petAngle = performance.now() * 0.0018;
      const targetPetX = playerPos.x + Math.cos(petAngle) * 1.5;
      const targetPetZ = playerPos.z + Math.sin(petAngle) * 1.5;
      const petBob = Math.sin(performance.now() * 0.005) * 0.12;
      this.petGroup.position.set(targetPetX, 1.35 + petBob, targetPetZ);
      this.petGroup.rotation.y = petAngle + Math.PI / 2;

      // Drone Agacer zap attack
      this.petState.cooldownTimer -= delta;
      if (this.petState.cooldownTimer <= 0) {
        // Find nearest zombie to zap & agacer
        let closestZombie: ZombieEntity | null = null;
        let closestDist = 9.5;
        for (const z of this.zombies) {
          const d = this.petGroup.position.distanceTo(z.group.position);
          if (d < closestDist && z.hp > 0) {
            closestDist = d;
            closestZombie = z;
          }
        }

        if (closestZombie) {
          const zPos = closestZombie.group.position;
          sound.playDroneZap();

          // Create bright EMP electric zap line
          const pts = [
            new THREE.Vector3(this.petGroup.position.x, 1.35 + petBob, this.petGroup.position.z),
            new THREE.Vector3(zPos.x, 1.0, zPos.z),
          ];
          const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
          const lineMat = new THREE.LineBasicMaterial({ color: 0x00ffff });
          if (this.petZapBeam) {
            this.scene.remove(this.petZapBeam);
            this.petZapBeam.geometry.dispose();
          }
          this.petZapBeam = new THREE.Line(lineGeo, lineMat);
          this.scene.add(this.petZapBeam);
          this.petZapLife = 0.12;

          // Visual spark burst at zombie
          this.createSparkParticles(zPos.x, zPos.z, 0x00ffff);
          this.createFloatingCombatText('ZAP ! (Agacé)', zPos.x, 1.4, zPos.z, '#00ffff', 22);

          // Damage zombie & apply agacer / stun slow
          this.hitZombie(closestZombie, 26);
          closestZombie.tauntTimer = 2.2; // Slowed & agacé
          closestZombie.isTaunted = true;

          // Push zombie back slightly
          const dx = zPos.x - playerPos.x;
          const dz = zPos.z - playerPos.z;
          const dist = Math.hypot(dx, dz) || 1;
          closestZombie.group.position.x += (dx / dist) * 0.6;
          closestZombie.group.position.z += (dz / dist) * 0.6;

          // Reset drone cooldown
          this.petState.cooldownTimer = 1.8;
        }
      }
    }
  }

  /**
   * Sonic Bark Shockwave Effect for Pet Puppy
   */
  private createBarkShockwave(x: number, z: number, colorHex: number = 0xec4899) {
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const mesh = new THREE.Mesh(GameEngine.sharedRingGeo, mat);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(x, 0.08, z);
    this.scene.add(mesh);

    this.shockwaves.push({
      mesh,
      radius: 0.4,
      maxRadius: 2.8,
      speed: 6.0,
      opacity: 0.85,
    });
  }

  private updateShockwaves(delta: number) {
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed * delta;
      sw.mesh.scale.set(sw.radius, sw.radius, 1);
      sw.opacity = Math.max(0, 0.85 * (1 - sw.radius / sw.maxRadius));
      (sw.mesh.material as THREE.MeshBasicMaterial).opacity = sw.opacity;

      if (sw.radius >= sw.maxRadius || sw.opacity <= 0) {
        this.scene.remove(sw.mesh);
        if (sw.mesh.geometry !== GameEngine.sharedRingGeo) {
          sw.mesh.geometry.dispose();
        }
        (sw.mesh.material as THREE.Material).dispose();
        this.shockwaves.splice(i, 1);
      }
    }
  }

  /**
   * Floating Combat Text (e.g. WOUF!, ZAP!, AGACÉ!)
   */
  private createFloatingCombatText(
    text: string,
    x: number,
    y: number,
    z: number,
    color: string = '#ec4899',
    fontSize: number = 26
  ) {
    // Cap simultaneous floating texts to prevent texture/canvas memory leaks
    if (this.floatingTexts.length >= 12) {
      const oldest = this.floatingTexts.shift();
      if (oldest) {
        this.scene.remove(oldest.sprite);
        oldest.sprite.material.map?.dispose();
        oldest.sprite.material.dispose();
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.lineWidth = 4;
    ctx.strokeText(text, 128, 64);
    ctx.fillStyle = color;
    ctx.fillText(text, 128, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 1.0,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(x, y, z);
    sprite.scale.set(2.2, 1.1, 1.0);
    this.scene.add(sprite);

    this.floatingTexts.push({
      sprite,
      life: 0.85,
      maxLife: 0.85,
      vy: 1.6,
    });
  }

  private updateFloatingTexts(delta: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= delta;
      ft.sprite.position.y += ft.vy * delta;
      ft.sprite.material.opacity = Math.max(0, ft.life / ft.maxLife);

      if (ft.life <= 0) {
        this.scene.remove(ft.sprite);
        ft.sprite.material.map?.dispose();
        ft.sprite.material.dispose();
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  // --- MAIN ANIMATION LOOP ---
  private animate(currentTime: number) {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = Math.min(0.1, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    if (!this.isPaused && !this.isGameOver) {
      this.updatePlayerMovement(delta);
      this.updateVehicleMode(delta);
      this.updatePetCompanion(delta);
      this.updateWaveProgression(delta);
      this.updateZombies(delta);
      this.updateWeapons(delta);
      this.updateProjectiles(delta);
      this.updateXpGems(delta);
      this.updatePuddles(delta);
      this.updateParticles(delta);
      this.updateShockwaves(delta);
      this.updateFloatingTexts(delta);
    }

    this.renderer.render(this.scene, this.camera);
  }

  public destroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);

    // 1. Combat vehicle
    if (this.combatVehicleGroup) {
      this.scene.remove(this.combatVehicleGroup);
      this.combatVehicleGroup.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) {
          (c as THREE.Mesh).geometry?.dispose();
          const mat = (c as THREE.Mesh).material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat?.dispose();
        }
      });
      this.combatVehicleGroup = null;
    }

    // 2. Pet zap beam
    if (this.petZapBeam) {
      this.scene.remove(this.petZapBeam);
      this.petZapBeam.geometry?.dispose();
      (this.petZapBeam.material as THREE.Material)?.dispose();
      this.petZapBeam = null;
    }

    // 3. Shockwaves
    for (const sw of this.shockwaves) {
      this.scene.remove(sw.mesh);
      if (sw.mesh.geometry !== GameEngine.sharedRingGeo) {
        sw.mesh.geometry?.dispose();
      }
      (sw.mesh.material as THREE.Material)?.dispose();
    }
    this.shockwaves = [];

    // 4. Floating Combat Texts
    for (const ft of this.floatingTexts) {
      this.scene.remove(ft.sprite);
      ft.sprite.material.map?.dispose();
      ft.sprite.material.dispose();
    }
    this.floatingTexts = [];

    // 5. XP Gems
    for (const gem of this.xpGems) {
      this.scene.remove(gem.mesh);
      gem.mesh.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) {
          (c as THREE.Mesh).geometry?.dispose();
          const mat = (c as THREE.Mesh).material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat?.dispose();
        }
      });
    }
    this.xpGems = [];

    // 6. Projectiles
    for (const proj of this.projectiles) {
      this.scene.remove(proj.mesh);
      proj.mesh.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) {
          (c as THREE.Mesh).geometry?.dispose();
          const mat = (c as THREE.Mesh).material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat?.dispose();
        }
      });
    }
    this.projectiles = [];

    // 7. Particles
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
      if (
        p.mesh.geometry !== GameEngine.sharedSparkGeo &&
        p.mesh.geometry !== GameEngine.sharedExplosionGeo &&
        p.mesh.geometry !== GameEngine.sharedSmokeGeo
      ) {
        p.mesh.geometry?.dispose();
      }
      (p.mesh.material as THREE.Material)?.dispose();
    }
    this.particles = [];

    // 8. Toxic Puddles
    this.puddleMeshes.forEach((mesh) => {
      this.scene.remove(mesh);
      mesh.geometry?.dispose();
      (mesh.material as THREE.Material)?.dispose();
    });
    this.puddleMeshes.clear();
    this.puddles = [];

    // 9. Drones
    for (const d of this.drones) {
      this.scene.remove(d.mesh);
      d.mesh.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) {
          (c as THREE.Mesh).geometry?.dispose();
          const mat = (c as THREE.Mesh).material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat?.dispose();
        }
      });
    }
    this.drones = [];

    // 10. Zombies
    for (const z of this.zombies) {
      this.scene.remove(z.group);
      z.group.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) {
          (c as THREE.Mesh).geometry?.dispose();
          const mat = (c as THREE.Mesh).material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat?.dispose();
        }
      });
    }
    this.zombies = [];

    // 11. Player & Pet
    this.scene.remove(this.playerGroup);
    this.playerGroup.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) {
        (c as THREE.Mesh).geometry?.dispose();
        const mat = (c as THREE.Mesh).material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat?.dispose();
      }
    });

    if (this.petGroup) {
      this.scene.remove(this.petGroup);
      this.petGroup.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) {
          (c as THREE.Mesh).geometry?.dispose();
          const mat = (c as THREE.Mesh).material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat?.dispose();
        }
      });
      this.petGroup = null;
    }

    // 12. Deep sweep of the entire scene to free any leftover meshes, materials, textures
    this.scene.traverse((child) => {
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
    this.scene.clear();

    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
