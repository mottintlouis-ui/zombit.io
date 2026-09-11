import * as THREE from 'three';

/**
 * Procedural texture generator for high-detail 3D models in Zombie Core Arena.
 * Generates high-resolution canvas textures with lighting, seams, materials, and decals.
 */
export class TextureGenerator {
  private static cache: Map<string, THREE.CanvasTexture> = new Map();

  /**
   * Crate texture: wooden planks with reinforced metal border and military markings
   */
  public static getCrateTexture(): THREE.CanvasTexture {
    const key = 'crate_tex';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base wood background
    ctx.fillStyle = '#6b3f1f';
    ctx.fillRect(0, 0, 512, 512);

    // Wood planks
    const plankHeight = 512 / 4;
    for (let i = 0; i < 4; i++) {
      const y = i * plankHeight;
      // Plank tone variation
      ctx.fillStyle = i % 2 === 0 ? '#784624' : '#5c3518';
      ctx.fillRect(0, y, 512, plankHeight);

      // Wood grain lines
      ctx.strokeStyle = 'rgba(40, 20, 10, 0.25)';
      ctx.lineWidth = 2;
      for (let g = 0; g < 6; g++) {
        ctx.beginPath();
        const lineY = y + 10 + g * 18;
        ctx.moveTo(0, lineY);
        ctx.bezierCurveTo(150, lineY + (g % 2 ? 6 : -6), 350, lineY + (g % 3 ? -8 : 8), 512, lineY);
        ctx.stroke();
      }

      // Seam between planks
      ctx.fillStyle = '#1e1108';
      ctx.fillRect(0, y + plankHeight - 4, 512, 4);
    }

    // Metal corner brackets
    ctx.fillStyle = '#475569';
    const border = 36;
    ctx.fillRect(0, 0, 512, border);
    ctx.fillRect(0, 512 - border, 512, border);
    ctx.fillRect(0, 0, border, 512);
    ctx.fillRect(512 - border, 0, border, 512);

    // Cross brace straps
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 28;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(512, 512);
    ctx.moveTo(512, 0);
    ctx.lineTo(0, 512);
    ctx.stroke();

    // Rivets on metal brackets
    ctx.fillStyle = '#94a3b8';
    const rivetPositions = [
      [18, 18], [256, 18], [494, 18],
      [18, 494], [256, 494], [494, 494],
      [18, 256], [494, 256],
      [256, 256]
    ];
    rivetPositions.forEach(([rx, ry]) => {
      ctx.beginPath();
      ctx.arc(rx, ry, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Biohazard / Ammo stencil in center
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CORE SUPPLY', 256, 220);
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('CRATE #09 - AMMO', 256, 290);

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Hazard barrier texture: diagonal safety stripes and worn steel
   */
  public static getBarrierTexture(): THREE.CanvasTexture {
    const key = 'barrier_tex';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Base concrete/metal gray
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(0, 0, 512, 256);

    // Diagonal hazard stripes in center band
    ctx.save();
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(0, 48, 512, 160);

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    for (let x = -100; x < 650; x += 60) {
      ctx.moveTo(x, 48);
      ctx.lineTo(x + 36, 48);
      ctx.lineTo(x + 36 - 60, 208);
      ctx.lineTo(x - 60, 208);
      ctx.closePath();
    }
    ctx.fill();
    ctx.restore();

    // Metallic frame borders top and bottom
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, 512, 48);
    ctx.fillRect(0, 208, 512, 48);

    // Weathering scratches
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1.5;
    for (let s = 0; s < 12; s++) {
      ctx.beginPath();
      const sx = Math.random() * 500;
      const sy = Math.random() * 200 + 20;
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.random() * 40 - 20, sy + Math.random() * 30 - 15);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Arena wall texture: industrial concrete blocks with hazard lights and steel plates
   */
  public static getWallTexture(): THREE.CanvasTexture {
    const key = 'wall_tex';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Dark concrete base
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 512, 256);

    // Segmented concrete panels
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    for (let x = 0; x < 512; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }

    // Top caution strip
    ctx.fillStyle = '#eab308';
    ctx.fillRect(0, 0, 512, 24);
    ctx.fillStyle = '#0f172a';
    for (let x = -20; x < 540; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 16, 0);
      ctx.lineTo(x + 4, 24);
      ctx.lineTo(x - 12, 24);
      ctx.closePath();
      ctx.fill();
    }

    // High tech glowing conduit line
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, 236, 512, 6);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(0, 238, 512, 2);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 1);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * High-detail Vehicle Texture: body panels, windows, grilles, plates
   */
  public static getVehicleTexture(): THREE.CanvasTexture {
    const key = 'vehicle_tex';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Armored military matte finish
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, 512, 512);

    // Camo / paneling patches
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(20, 20, 220, 180);
    ctx.fillRect(260, 220, 230, 180);

    // Front radiator grille pattern
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(40, 360, 432, 100);
    ctx.fillStyle = '#64748b';
    for (let y = 370; y < 450; y += 12) {
      ctx.fillRect(50, y, 412, 4);
    }

    // Panel seam lines
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, 492, 492);
    ctx.beginPath();
    ctx.moveTo(256, 10);
    ctx.lineTo(256, 502);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Detailed Survivor Armor Texture
   */
  public static getSurvivorArmorTexture(primaryHex: string = '#0284c7', accentHex: string = '#00f0ff'): THREE.CanvasTexture {
    const key = `survivor_armor_${primaryHex}_${accentHex}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Carbon fiber base weave
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#131c2e';
    for (let y = 0; y < 512; y += 8) {
      for (let x = (y % 16 === 0 ? 0 : 8); x < 512; x += 16) {
        ctx.fillRect(x, y, 8, 8);
      }
    }

    // Heavy reinforced chest plating
    ctx.fillStyle = primaryHex;
    ctx.beginPath();
    ctx.roundRect(40, 40, 432, 220, 24);
    ctx.fill();

    // Inner plate bevel
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(50, 50, 412, 30);

    // Glowing cyber reactor core in center
    const grad = ctx.createRadialGradient(256, 150, 10, 256, 150, 60);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, accentHex);
    grad.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(256, 150, 60, 0, Math.PI * 2);
    ctx.fill();

    // Reactor ring
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(256, 150, 45, 0, Math.PI * 2);
    ctx.stroke();

    // Tactical pouches and belts on lower half
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(40, 300, 432, 60);
    ctx.fillStyle = '#334155';
    for (let p = 60; p < 450; p += 80) {
      ctx.fillRect(p, 306, 60, 48);
      // Pouch snaps
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(p + 25, 320, 10, 8);
      ctx.fillStyle = '#334155';
    }

    // High-tech neon circuit traces
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(70, 380);
    ctx.lineTo(160, 380);
    ctx.lineTo(200, 430);
    ctx.lineTo(312, 430);
    ctx.lineTo(352, 380);
    ctx.lineTo(442, 380);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * High-detail Zombie Flesh & Decay Texture
   */
  public static getZombieFleshTexture(type: string = 'normal'): THREE.CanvasTexture {
    const key = `zombie_flesh_${type}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    let baseColor = '#2d4739';
    let rotColor = '#1e2d24';
    let veinColor = '#4ade80';

    if (type === 'runner') {
      baseColor = '#7f1d1d';
      rotColor = '#450a0a';
      veinColor = '#f87171';
    } else if (type === 'toxic') {
      baseColor = '#3f6212';
      rotColor = '#1a2e05';
      veinColor = '#a3e635';
    } else if (type === 'explosive') {
      baseColor = '#991b1b';
      rotColor = '#450a0a';
      veinColor = '#fb923c';
    } else if (type === 'armored') {
      baseColor = '#334155';
      rotColor = '#1e293b';
      veinColor = '#94a3b8';
    } else if (type === 'summoner') {
      baseColor = '#581c87';
      rotColor = '#3b0764';
      veinColor = '#c084fc';
    } else if (type === 'elite' || type === 'boss') {
      baseColor = '#713f12';
      rotColor = '#451a03';
      veinColor = '#facc15';
    }

    // Mottled skin tone
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 512, 512);

    // Rot patches
    ctx.fillStyle = rotColor;
    for (let i = 0; i < 28; i++) {
      ctx.beginPath();
      const px = Math.random() * 512;
      const py = Math.random() * 512;
      const rad = Math.random() * 60 + 15;
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glowing infected veins
    ctx.strokeStyle = veinColor;
    ctx.lineWidth = 3;
    for (let v = 0; v < 14; v++) {
      ctx.beginPath();
      let vx = Math.random() * 512;
      let vy = Math.random() * 512;
      ctx.moveTo(vx, vy);
      for (let step = 0; step < 4; step++) {
        vx += (Math.random() - 0.5) * 80;
        vy += (Math.random() - 0.5) * 80;
        ctx.lineTo(vx, vy);
      }
      ctx.stroke();
    }

    // Torn armor / stitches
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 2;
    for (let s = 0; s < 8; s++) {
      ctx.beginPath();
      const sx = Math.random() * 450 + 30;
      const sy = Math.random() * 450 + 30;
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 40, sy + 15);
      ctx.stroke();
      // Stitch cross marks
      for (let c = 0; c < 4; c++) {
        ctx.moveTo(sx + c * 10, sy - 6);
        ctx.lineTo(sx + c * 10, sy + 10);
        ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * High-tech Projectile Texture (Plasma energy & fin casing)
   */
  public static getProjectileTexture(type: 'plasma' | 'railgun' | 'bomb' | 'solar' | 'void' = 'plasma'): THREE.CanvasTexture {
    const key = `proj_tex_${type}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    let gradStart = '#ffffff';
    let gradMid = '#00f0ff';
    let gradEnd = '#0369a1';

    if (type === 'railgun') {
      gradStart = '#ffffff';
      gradMid = '#ef4444';
      gradEnd = '#7f1d1d';
    } else if (type === 'bomb') {
      gradStart = '#fef08a';
      gradMid = '#f97316';
      gradEnd = '#c2410c';
    } else if (type === 'solar') {
      gradStart = '#fffbeb';
      gradMid = '#f59e0b';
      gradEnd = '#b45309';
    } else if (type === 'void') {
      gradStart = '#f5d0fe';
      gradMid = '#a855f7';
      gradEnd = '#581c87';
    }

    // Outer shell
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 256, 256);

    // Energy core bands
    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, gradStart);
    grad.addColorStop(0.5, gradMid);
    grad.addColorStop(1, gradEnd);
    ctx.fillStyle = grad;
    ctx.fillRect(20, 20, 216, 216);

    // Stabilizer fin and heat sink lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    for (let i = 40; i < 220; i += 24) {
      ctx.beginPath();
      ctx.moveTo(i, 30);
      ctx.lineTo(i, 226);
      ctx.stroke();
    }

    // Glow accents
    ctx.fillStyle = gradStart;
    ctx.beginPath();
    ctx.arc(128, 128, 40, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Detailed Vehicle Body Texture: realistic automotive bodywork, panel seams,
   * doors, decals, lights, and weathering.
   */
  public static getVehicleBodyTexture(variant: 'police' | 'military' = 'police'): THREE.CanvasTexture {
    const key = `vehicle_body_${variant}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const isPolice = variant === 'police';

    // 1. Base car paint (deep glossy metallic finish)
    ctx.fillStyle = isPolice ? '#0f172a' : '#1c2826';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle metallic flake noise
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let i = 0; i < 600; i++) {
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }

    if (isPolice) {
      // White door / roof panels for police cruiser
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(40, 160, 432, 180);

      // Blue police accent stripe
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(40, 230, 432, 28);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(40, 258, 432, 4);

      // Stenciled typography
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('POLICE', 256, 210);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('UNIT 04 • METRO SECTOR', 256, 250);
    } else {
      // Military / Camo urban patches
      ctx.fillStyle = '#2d3748';
      ctx.fillRect(60, 60, 200, 180);
      ctx.fillRect(280, 240, 200, 200);

      // Hazard stripes on rear/front areas
      ctx.fillStyle = '#eab308';
      ctx.fillRect(40, 450, 432, 30);
      ctx.fillStyle = '#0f172a';
      for (let x = 20; x < 500; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 450);
        ctx.lineTo(x + 14, 450);
        ctx.lineTo(x, 480);
        ctx.lineTo(x - 14, 480);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('AP-99 HAZMAT', 256, 210);
    }

    // Front hood vents / radiator grille
    ctx.fillStyle = '#020617';
    ctx.fillRect(80, 40, 352, 70);
    ctx.fillStyle = '#475569';
    for (let y = 48; y < 105; y += 8) {
      ctx.fillRect(90, y, 332, 3);
    }

    // Headlight lenses texture at top corners
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(30, 30, 40, 70);
    ctx.fillRect(442, 30, 40, 70);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(36, 45, 28, 40);
    ctx.fillRect(448, 45, 28, 40);

    // Door seams and body lines
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 20, 452, 472);
    ctx.beginPath();
    ctx.moveTo(256, 20);
    ctx.lineTo(256, 492);
    ctx.moveTo(30, 256);
    ctx.lineTo(482, 256);
    ctx.stroke();

    // Door handles
    ctx.fillStyle = '#020617';
    ctx.fillRect(60, 246, 36, 10);
    ctx.fillRect(416, 246, 36, 10);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(64, 249, 28, 4);
    ctx.fillRect(420, 249, 28, 4);

    // Weathering / Rust / scratches
    ctx.strokeStyle = 'rgba(120, 53, 15, 0.4)';
    ctx.lineWidth = 2;
    for (let s = 0; s < 8; s++) {
      ctx.beginPath();
      const sx = Math.random() * 400 + 50;
      const sy = Math.random() * 400 + 50;
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 30, sy + 15);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Window glass texture with tint, glare reflections, and rubber gasket trim
   */
  public static getVehicleWindowTexture(): THREE.CanvasTexture {
    const key = 'vehicle_window_tex';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Black rubber perimeter trim
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, 256, 256);

    // Dark tinted safety glass with subtle cyan tint
    const glassGrad = ctx.createLinearGradient(0, 0, 256, 256);
    glassGrad.addColorStop(0, '#0c1b2b');
    glassGrad.addColorStop(0.6, '#132c44');
    glassGrad.addColorStop(1, '#07111c');
    ctx.fillStyle = glassGrad;
    ctx.fillRect(12, 12, 232, 232);

    // Diagonal specular sun glare streaks
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.beginPath();
    ctx.moveTo(40, 12);
    ctx.lineTo(100, 12);
    ctx.lineTo(244, 156);
    ctx.lineTo(244, 216);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(120, 12);
    ctx.lineTo(150, 12);
    ctx.lineTo(244, 106);
    ctx.lineTo(244, 136);
    ctx.closePath();
    ctx.fill();

    // Defroster thermal lines in lower section
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.lineWidth = 1;
    for (let y = 140; y < 230; y += 15) {
      ctx.beginPath();
      ctx.moveTo(24, y);
      ctx.lineTo(232, y);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Tire rubber texture with radial tread ribs and alloy rim with lug nuts
   */
  public static getTireTexture(): THREE.CanvasTexture {
    const key = 'vehicle_tire_tex';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Outer rubber tire
    ctx.fillStyle = '#171717';
    ctx.beginPath();
    ctx.arc(128, 128, 120, 0, Math.PI * 2);
    ctx.fill();

    // Tread ribs on outer rim
    ctx.strokeStyle = '#0a0a0a';
    ctx.lineWidth = 6;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) {
      ctx.beginPath();
      ctx.moveTo(128 + Math.cos(a) * 98, 128 + Math.sin(a) * 98);
      ctx.lineTo(128 + Math.cos(a) * 118, 128 + Math.sin(a) * 118);
      ctx.stroke();
    }

    // Metal alloy wheel rim
    const rimGrad = ctx.createRadialGradient(128, 128, 10, 128, 128, 90);
    rimGrad.addColorStop(0, '#e2e8f0');
    rimGrad.addColorStop(0.7, '#475569');
    rimGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = rimGrad;
    ctx.beginPath();
    ctx.arc(128, 128, 88, 0, Math.PI * 2);
    ctx.fill();

    // Brake disc peeking through
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(128, 128, 62, 0, Math.PI * 2);
    ctx.fill();

    // Wheel spokes
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 12;
    for (let s = 0; s < 5; s++) {
      const ang = (s * Math.PI * 2) / 5;
      ctx.beginPath();
      ctx.moveTo(128, 128);
      ctx.lineTo(128 + Math.cos(ang) * 82, 128 + Math.sin(ang) * 82);
      ctx.stroke();
    }

    // Center hub cap with lug nuts
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(128, 128, 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    for (let l = 0; l < 5; l++) {
      const lang = (l * Math.PI * 2) / 5;
      ctx.beginPath();
      ctx.arc(128 + Math.cos(lang) * 16, 128 + Math.sin(lang) * 16, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Street Lamp Pole Texture: galvanized weather-beaten steel with electrical access hatch,
   * safety caution stripes, and bolt rings.
   */
  public static getStreetPoleTexture(): THREE.CanvasTexture {
    const key = 'street_pole_tex';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Galvanized zinc-coated steel gradient
    const metalGrad = ctx.createLinearGradient(0, 0, 256, 0);
    metalGrad.addColorStop(0, '#334155');
    metalGrad.addColorStop(0.2, '#64748b');
    metalGrad.addColorStop(0.5, '#94a3b8');
    metalGrad.addColorStop(0.8, '#475569');
    metalGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = metalGrad;
    ctx.fillRect(0, 0, 256, 512);

    // Weathering / vertical brushing lines
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.25)';
    ctx.lineWidth = 1.5;
    for (let x = 8; x < 250; x += 12) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }

    // Segment rings
    for (let y = 80; y < 500; y += 90) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, y, 256, 6);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(0, y + 1, 256, 2);
    }

    // Electrical Maintenance Inspection Panel (lower section)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(60, 360, 136, 110);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.strokeRect(60, 360, 136, 110);

    // Panel corner bolts
    ctx.fillStyle = '#94a3b8';
    [[68, 368], [188, 368], [68, 462], [188, 462]].forEach(([bx, by]) => {
      ctx.beginPath();
      ctx.arc(bx, by, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // High-voltage warning decal
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(128, 385);
    ctx.lineTo(152, 425);
    ctx.lineTo(104, 425);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡', 128, 420);

    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('HIGH VOLTAGE 400V', 128, 445);

    // Yellow & Black hazard band near bottom
    ctx.fillStyle = '#eab308';
    ctx.fillRect(0, 480, 256, 32);
    ctx.fillStyle = '#0f172a';
    for (let x = -20; x < 280; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 480);
      ctx.lineTo(x + 16, 480);
      ctx.lineTo(x + 4, 512);
      ctx.lineTo(x - 12, 512);
      ctx.closePath();
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Street Lamp Luminaire Head Texture: industrial cast aluminum heat sink,
   * protective refractor glass grid, and glowing LED array.
   */
  public static getStreetLampHeadTexture(): THREE.CanvasTexture {
    const key = 'street_lamp_head_tex';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Outer dark cast aluminum luminaire body
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 256, 256);

    // Heat sink fins
    ctx.fillStyle = '#0f172a';
    for (let x = 16; x < 240; x += 16) {
      ctx.fillRect(x, 10, 8, 236);
    }

    // Glass lens cavity (illuminated LED emitter face)
    const glowGrad = ctx.createRadialGradient(128, 128, 10, 128, 128, 90);
    glowGrad.addColorStop(0, '#ffffff');
    glowGrad.addColorStop(0.2, '#38bdf8');
    glowGrad.addColorStop(0.6, '#0284c7');
    glowGrad.addColorStop(1, '#0c4a6e');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.roundRect(36, 36, 184, 184, 20);
    ctx.fill();

    // Optical prismatic honeycomb refractor pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    for (let y = 50; y < 210; y += 18) {
      ctx.beginPath();
      ctx.moveTo(46, y);
      ctx.lineTo(210, y);
      ctx.stroke();
    }
    for (let x = 50; x < 210; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, 46);
      ctx.lineTo(x, 210);
      ctx.stroke();
    }

    // High-power LED diodes in center grid
    ctx.fillStyle = '#ffffff';
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        ctx.beginPath();
        ctx.arc(86 + col * 28, 86 + row * 28, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Faceted Cybernetic XP Gem Texture: crystalline refractions, glowing core runes,
   * holographic aura, and specular prismatic highlights.
   */
  public static getXpOrbTexture(theme: 'green' | 'cyan' | 'gold' = 'green'): THREE.CanvasTexture {
    const key = `xp_gem_tex_${theme}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    let coreColor = '#4ade80';
    let outerColor = '#15803d';
    let energyColor = '#86efac';
    let darkFacet = '#052e16';

    if (theme === 'cyan') {
      coreColor = '#38bdf8';
      outerColor = '#0369a1';
      energyColor = '#7dd3fc';
      darkFacet = '#082f49';
    } else if (theme === 'gold') {
      coreColor = '#facc15';
      outerColor = '#b45309';
      energyColor = '#fef08a';
      darkFacet = '#451a03';
    }

    // Dark crystal substrate
    ctx.fillStyle = darkFacet;
    ctx.fillRect(0, 0, 256, 256);

    // Radiant energy core glow
    const coreGrad = ctx.createRadialGradient(128, 128, 5, 128, 128, 110);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.25, coreColor);
    coreGrad.addColorStop(0.7, outerColor);
    coreGrad.addColorStop(1, darkFacet);
    ctx.fillStyle = coreGrad;
    ctx.fillRect(0, 0, 256, 256);

    // Crystal facet polygon geometry
    ctx.strokeStyle = energyColor;
    ctx.lineWidth = 2.5;

    // Outer octagonal cut
    ctx.beginPath();
    const pts: [number, number][] = [
      [128, 16], [206, 48], [240, 128], [206, 208],
      [128, 240], [50, 208], [16, 128], [50, 48]
    ];
    pts.forEach(([px, py], idx) => {
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.stroke();

    // Inner facets converging to center
    pts.forEach(([px, py]) => {
      ctx.beginPath();
      ctx.moveTo(128, 128);
      ctx.lineTo(px, py);
      ctx.stroke();
    });

    // Inner diamond core
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.moveTo(128, 70);
    ctx.lineTo(186, 128);
    ctx.lineTo(128, 186);
    ctx.lineTo(70, 128);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Floating arcane power runes / circuitry
    ctx.strokeStyle = energyColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(98, 98, 60, 60);

    // Brilliant specular gleam
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(105, 105, 8, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }
}
