/**
 * Procedural Asset Engine
 * Dynamically draws retro pixel art sprites, projectiles, enemies, and UI icons on offscreen canvases.
 * Supports hot-plugging external PNGs when available in /public/assets/.
 */

export class ProceduralAssets {
  private static cache: Map<string, HTMLCanvasElement> = new Map();

  /**
   * Returns a cached canvas or image element for any given asset key.
   */
  public static get(assetId: string): HTMLCanvasElement {
    if (this.cache.has(assetId)) {
      return this.cache.get(assetId)!;
    }

    const canvas = this.generateSprite(assetId);
    this.cache.set(assetId, canvas);
    return canvas;
  }

  /**
   * Returns base64 data URL for inline HTML img tags.
   */
  public static toDataURL(assetId: string): string {
    return this.get(assetId).toDataURL();
  }

  /**
   * Pre-generates all game assets into memory.
   */
  public static init(): void {
    const assetKeys = [
      // Heroes
      'hero_valerius', 'hero_sylvia', 'hero_ignis', 'hero_kaelen', 'hero_mortimer',
      // Enemies
      'enemy_bat', 'enemy_zombie', 'enemy_skeleton', 'enemy_knight',
      'enemy_minotaur_boss', 'enemy_gorgon_boss', 'enemy_vampire_boss', 'enemy_necromancer_boss', 'enemy_reaper',
      // Projectiles
      'proj_whip_slash', 'proj_magic_bolt', 'proj_knife', 'proj_fireball', 'proj_bible', 'proj_garlic_aura', 'proj_bone', 'proj_arrow',
      'proj_cross', 'proj_lightning', 'proj_axe', 'proj_scythe', 'proj_holy_water',
      // Pickups & Gems
      'gem_blue', 'gem_green', 'gem_red', 'gem_gold', 'pickup_coin', 'pickup_chest', 'pickup_magnet', 'pickup_rosary', 'pickup_meat',
      // Tiles
      'tile_grass', 'tile_stone',
      // Base Weapon Icons
      'icon_whip', 'icon_magic_wand', 'icon_knife', 'icon_fire_wand', 'icon_bible', 'icon_garlic', 'icon_bone',
      'icon_cross', 'icon_lightning_ring', 'icon_axe', 'icon_santa_water',
      // Evolution Weapon Icons
      'icon_bloody_tear', 'icon_holy_wand', 'icon_thousand_edge', 'icon_hellfire', 'icon_unholy_vespers', 'icon_soul_eater',
      'icon_heaven_sword', 'icon_thunder_loop', 'icon_death_spiral', 'icon_la_borra',
      // Passive Icons
      'icon_hollow_heart', 'icon_empty_tome', 'icon_bracer', 'icon_spinach', 'icon_spellbinder', 'icon_pummarola',
      'icon_clover', 'icon_duplicator', 'icon_candelabrador', 'icon_attractorb'
    ];

    assetKeys.forEach((key) => this.get(key));
  }

  private static createCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: false })!;
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
  }

  private static generateSprite(id: string): HTMLCanvasElement {
    if (id.startsWith('hero_')) return this.drawHero(id);
    if (id.startsWith('enemy_')) return this.drawEnemy(id);
    if (id.startsWith('proj_')) return this.drawProjectile(id);
    if (id.startsWith('gem_') || id.startsWith('pickup_')) return this.drawPickup(id);
    if (id.startsWith('tile_')) return this.drawTile(id);
    if (id.startsWith('icon_')) return this.drawIcon(id);
    if (id.startsWith('obstacle_') || id.startsWith('shrine_')) return this.drawWorldObject(id);

    const { canvas, ctx } = this.createCanvas(32, 32);
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(0, 0, 32, 32);
    return canvas;
  }

  /* =========================================================================
     HERO SPRITES
     ========================================================================= */
  private static drawHero(id: string): HTMLCanvasElement {
    const size = 32;
    const { canvas, ctx } = this.createCanvas(size, size);

    if (id === 'hero_valerius') {
      // Valerius: Abyssal Warden
      ctx.fillStyle = '#1e1b4b'; // Torn Abyssal Cape
      ctx.fillRect(6, 12, 20, 16);
      ctx.fillStyle = '#090d16'; // Obsidian plate
      ctx.fillRect(8, 10, 16, 14);
      ctx.fillStyle = '#1e293b'; // Helm
      ctx.fillRect(10, 4, 12, 10);
      ctx.fillStyle = '#06b6d4'; // Glowing void visor slit
      ctx.fillRect(12, 8, 8, 2);
      ctx.fillStyle = '#a855f7'; // Runic chest inlay
      ctx.fillRect(14, 13, 4, 4);
      ctx.fillStyle = '#0f172a'; // Legs
      ctx.fillRect(10, 20, 4, 10);
      ctx.fillRect(18, 20, 4, 10);
    } else if (id === 'hero_sylvia') {
      // Sylvia: Astral Occultist
      ctx.fillStyle = '#1e1035'; // Deep Void Robe
      ctx.fillRect(8, 12, 16, 18);
      ctx.fillStyle = '#3b0764'; // Hat
      ctx.beginPath();
      ctx.moveTo(16, 2);
      ctx.lineTo(7, 12);
      ctx.lineTo(25, 12);
      ctx.fill();
      ctx.fillStyle = '#06b6d4'; // Cyan star trim
      ctx.fillRect(8, 11, 16, 2);
      ctx.fillStyle = '#475569'; // Twisted staff
      ctx.fillRect(24, 6, 3, 22);
      ctx.fillStyle = '#a855f7'; // Void eye orb
      ctx.beginPath();
      ctx.arc(25.5, 6, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#67e8f9';
      ctx.fillRect(25, 5, 2, 2);
    } else if (id === 'hero_ignis') {
      // Ignis: Blackfire Pyromancer
      ctx.fillStyle = '#0a0a0f'; // Dark cultist shroud
      ctx.fillRect(8, 12, 16, 18);
      ctx.fillStyle = '#18181b';
      ctx.fillRect(6, 10, 20, 6);
      ctx.fillStyle = '#1c1917'; // Cowl
      ctx.fillRect(10, 4, 12, 10);
      // Blackfire Horns (Green & Violet)
      ctx.fillStyle = '#10b981';
      ctx.fillRect(9, 1, 3, 4);
      ctx.fillRect(19, 1, 3, 4);
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(14, 0, 4, 5);
      // Unholy yellow eyes
      ctx.fillStyle = '#facc15';
      ctx.fillRect(12, 7, 2, 2);
      ctx.fillRect(18, 7, 2, 2);
    } else if (id === 'hero_kaelen') {
      // Kaelen: Void Stalker
      ctx.fillStyle = '#042f2e'; // Abyssal Cloak
      ctx.fillRect(6, 8, 20, 20);
      ctx.fillStyle = '#0f766e'; // Hood
      ctx.fillRect(10, 4, 12, 10);
      ctx.fillStyle = '#022c22'; // Shadow Mask
      ctx.fillRect(12, 8, 8, 4);
      // Glowing Cyan/Emerald feline eyes
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(13, 9, 2, 2);
      ctx.fillRect(17, 9, 2, 2);
      // Dual Obsidian Fangs
      ctx.fillStyle = '#090d16';
      ctx.fillRect(4, 16, 3, 10);
      ctx.fillRect(25, 16, 3, 10);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(4, 16, 1, 8);
      ctx.fillRect(25, 16, 1, 8);
    } else if (id === 'hero_mortimer') {
      // Mortimer: Necro-Alchemist
      ctx.fillStyle = '#1e1b4b'; // Scholar coats
      ctx.fillRect(8, 12, 16, 18);
      ctx.fillStyle = '#0f172a'; // Cowl
      ctx.fillRect(8, 4, 16, 10);
      ctx.fillStyle = '#cbd5e1'; // Pale plagued visage
      ctx.fillRect(11, 7, 10, 7);
      // Occult monocle & soul eye
      ctx.fillStyle = '#06b6d4'; // Brass monocle glow
      ctx.fillRect(13, 8, 2, 2);
      ctx.fillStyle = '#c084fc'; // Purple soul eye
      ctx.fillRect(17, 8, 2, 2);
      // Bone Grimoire
      ctx.fillStyle = '#475569';
      ctx.fillRect(24, 10, 5, 14);
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(25, 12, 3, 2);
    } else if (id === 'hero_nyx') {
      // Nyx: The Eldritch Weaver
      ctx.fillStyle = '#2e1065'; // Void silk dress
      ctx.fillRect(8, 12, 16, 18);
      ctx.fillStyle = '#581c87';
      ctx.fillRect(10, 14, 12, 16);
      ctx.fillStyle = '#e9d5ff'; // Pale silk hair
      ctx.fillRect(8, 4, 16, 10);
      ctx.fillStyle = '#3b0764'; // Blindfold / Spider cowl
      ctx.fillRect(10, 7, 12, 4);
      // 4 tiny glowing purple spider eyes
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(11, 8, 2, 2);
      ctx.fillRect(14, 7, 2, 2);
      ctx.fillRect(17, 7, 2, 2);
      ctx.fillRect(20, 8, 2, 2);
      // Floating silk threads
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(4, 10, 2, 14);
      ctx.fillRect(26, 10, 2, 14);
    } else if (id === 'hero_malakor') {
      // Malakor: Drowned Inquisitor
      ctx.fillStyle = '#0e7490'; // Verdigris sea plate
      ctx.fillRect(6, 10, 20, 16);
      ctx.fillStyle = '#155e75';
      ctx.fillRect(8, 8, 16, 16);
      ctx.fillStyle = '#042f2e'; // Barbute helm
      ctx.fillRect(9, 3, 14, 10);
      ctx.fillStyle = '#38bdf8'; // Glowing cyan eye slit
      ctx.fillRect(11, 7, 10, 2);
      // Iron chain & rusted anchor at side
      ctx.fillStyle = '#475569';
      ctx.fillRect(5, 14, 3, 12);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(24, 6, 4, 22);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(22, 22, 8, 4);
    } else if (id === 'hero_morrigan') {
      // Morrigan: Sanguine Priestess
      ctx.fillStyle = '#4c0519'; // Crimson gown
      ctx.fillRect(8, 12, 16, 18);
      ctx.fillStyle = '#881337';
      ctx.fillRect(10, 14, 12, 16);
      ctx.fillStyle = '#fecdd3'; // Pale visage
      ctx.fillRect(11, 6, 10, 8);
      // Blood veil & horns
      ctx.fillStyle = '#9f1239';
      ctx.fillRect(9, 2, 3, 6);
      ctx.fillRect(20, 2, 3, 6);
      ctx.fillStyle = '#e11d48'; // Glowing crimson eyes
      ctx.fillRect(13, 8, 2, 2);
      ctx.fillRect(17, 8, 2, 2);
      // Sanguine Chalice
      ctx.fillStyle = '#fb7185';
      ctx.fillRect(24, 12, 4, 6);
      ctx.fillStyle = '#475569';
      ctx.fillRect(25, 18, 2, 6);
    } else if (id === 'hero_zephyr') {
      // Zephyr: Astral Astromancer
      ctx.fillStyle = '#082f49'; // Starry midnight robes
      ctx.fillRect(8, 12, 16, 18);
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(10, 14, 12, 16);
      ctx.fillStyle = '#0284c7'; // Hood
      ctx.fillRect(9, 4, 14, 10);
      ctx.fillStyle = '#fde047'; // Starlight runes
      ctx.fillRect(11, 16, 2, 2);
      ctx.fillRect(19, 18, 2, 2);
      // Cosmic void eyes & floating orb
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(12, 8, 3, 2);
      ctx.fillRect(17, 8, 3, 2);
      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath();
      ctx.arc(26, 14, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(25, 13, 2, 2);
    }

    return canvas;
  }

  /* =========================================================================
     HERO PORTRAITS (HIGH-DETAIL 64x64 PIXEL ART)
     ========================================================================= */
  public static getHeroPortraitDataUrl(id: string): string {
    const portraitId = `portrait_${id}`;
    if (!this.cache.has(portraitId)) {
      this.cache.set(portraitId, this.drawHeroPortrait(id));
    }
    return this.cache.get(portraitId)!.toDataURL();
  }

  private static drawHeroPortrait(id: string): HTMLCanvasElement {
    const { canvas, ctx } = this.createCanvas(64, 64);

    // Deep abyssal void backdrop with cosmic glow
    const grad = ctx.createRadialGradient(32, 32, 8, 32, 32, 45);
    grad.addColorStop(0, '#1e1035');
    grad.addColorStop(1, '#05050a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    if (id.includes('valerius')) {
      // Valerius: Abyssal Warden
      // Torn Indigo Mantle
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(10, 42, 44, 22);
      ctx.fillStyle = '#312e81';
      ctx.fillRect(14, 44, 36, 20);
      // Obsidian Void Pauldrons
      ctx.fillStyle = '#090d16';
      ctx.fillRect(8, 44, 12, 12);
      ctx.fillRect(44, 44, 12, 12);
      ctx.fillStyle = '#06b6d4'; // Cyan void rune
      ctx.fillRect(12, 48, 4, 4);
      ctx.fillRect(48, 48, 4, 4);
      // Corrupted Greathelm
      ctx.fillStyle = '#090d16';
      ctx.fillRect(18, 14, 28, 30);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(20, 16, 24, 26);
      ctx.fillStyle = '#334155';
      ctx.fillRect(22, 18, 20, 16);
      // Abyssal Horn Crest
      ctx.fillStyle = '#475569';
      ctx.fillRect(28, 4, 8, 12);
      ctx.fillRect(30, 2, 4, 14);
      // Glowing Cyan Visor Slit
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(22, 28, 20, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(25, 29, 6, 2);
      ctx.fillRect(33, 29, 6, 2);
    } else if (id.includes('sylvia')) {
      // Sylvia: Astral Occultist
      // Deep Violet Robes
      ctx.fillStyle = '#1e1035';
      ctx.fillRect(12, 42, 40, 22);
      ctx.fillStyle = '#3b0764';
      ctx.fillRect(16, 44, 32, 20);
      // Face
      ctx.fillStyle = '#fce7f3';
      ctx.fillRect(22, 24, 20, 20);
      // Flowing Silver-Violet Cosmic Hair
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(18, 22, 6, 26);
      ctx.fillRect(40, 22, 6, 26);
      ctx.fillRect(20, 18, 24, 8);
      // Occult Witch Hat
      ctx.fillStyle = '#180d2b';
      ctx.beginPath();
      ctx.moveTo(32, 3);
      ctx.lineTo(10, 22);
      ctx.lineTo(54, 22);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#06b6d4'; // Cyan star band
      ctx.fillRect(12, 20, 40, 3);
      // Glowing Celestial Cyan Eyes
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(25, 30, 4, 3);
      ctx.fillRect(35, 30, 4, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(26, 31, 2, 1);
      ctx.fillRect(36, 31, 2, 1);
    } else if (id.includes('ignis')) {
      // Ignis: Blackfire Pyromancer
      // Charcoal Cultist Cowl
      ctx.fillStyle = '#090d16';
      ctx.fillRect(10, 42, 44, 22);
      ctx.fillStyle = '#18181b';
      ctx.fillRect(14, 44, 36, 20);
      // Dark Face Mask
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(20, 18, 24, 26);
      // Horns of Blackfire (Green & Violet)
      ctx.fillStyle = '#10b981';
      ctx.fillRect(18, 6, 6, 12);
      ctx.fillRect(40, 6, 6, 12);
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(26, 2, 12, 16);
      ctx.fillStyle = '#6ee7b7';
      ctx.fillRect(20, 8, 2, 6);
      ctx.fillRect(42, 8, 2, 6);
      ctx.fillStyle = '#e879f9';
      ctx.fillRect(30, 4, 4, 8);
      // Burning Eldritch Yellow Eyes
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(24, 28, 5, 4);
      ctx.fillRect(35, 28, 5, 4);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(25, 29, 3, 2);
      ctx.fillRect(36, 29, 3, 2);
    } else if (id.includes('kaelen')) {
      // Kaelen: Void Stalker
      // Deep Abyssal Mantle
      ctx.fillStyle = '#022c22';
      ctx.fillRect(10, 40, 44, 24);
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(14, 42, 36, 22);
      // Hood
      ctx.fillStyle = '#042f2e';
      ctx.beginPath();
      ctx.moveTo(32, 6);
      ctx.lineTo(14, 24);
      ctx.lineTo(50, 24);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(16, 20, 32, 22);
      // Spatial Void Mask
      ctx.fillStyle = '#090d16';
      ctx.fillRect(22, 26, 20, 16);
      // Piercing Cyan Feline Eyes
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(25, 28, 4, 3);
      ctx.fillRect(35, 28, 4, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(26, 29, 2, 1);
      ctx.fillRect(36, 29, 2, 1);
      // Obsidian Fang Collars
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(20, 38, 24, 3);
    } else if (id.includes('mortimer')) {
      // Mortimer: Necro-Alchemist
      // Miskatonic Scholar Robes
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(10, 40, 44, 24);
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(14, 42, 36, 22);
      // Cowl
      ctx.fillStyle = '#090d16';
      ctx.fillRect(18, 12, 28, 30);
      // Pale Plagued Face
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(22, 20, 20, 20);
      // Brass Occult Monocle on Left
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(27, 27, 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(27, 27, 3, 0, Math.PI * 2);
      ctx.fill();
      // Glowing Amethyst Soul Eye on Right
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(35, 25, 4, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(36, 26, 2, 2);
    } else if (id.includes('nyx')) {
      // Nyx: The Eldritch Weaver
      ctx.fillStyle = '#1e1035';
      ctx.fillRect(10, 42, 44, 22);
      ctx.fillStyle = '#3b0764';
      ctx.fillRect(14, 44, 36, 20);
      // Flowing Silver Silk Hair
      ctx.fillStyle = '#e9d5ff';
      ctx.fillRect(16, 12, 32, 34);
      // Blindfolded Cowl
      ctx.fillStyle = '#2e1065';
      ctx.fillRect(20, 22, 24, 14);
      // 4 Glowing spider eyes
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(23, 26, 3, 3);
      ctx.fillRect(28, 25, 3, 3);
      ctx.fillRect(33, 25, 3, 3);
      ctx.fillRect(38, 26, 3, 3);
      // Pale lower visage
      ctx.fillStyle = '#fce7f3';
      ctx.fillRect(24, 36, 16, 12);
      // Silk Web Crown
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(20, 10, 24, 4);
      ctx.fillRect(30, 4, 4, 8);
    } else if (id.includes('malakor')) {
      // Malakor: Drowned Inquisitor
      ctx.fillStyle = '#083344';
      ctx.fillRect(10, 42, 44, 22);
      ctx.fillStyle = '#0e7490';
      ctx.fillRect(14, 44, 36, 20);
      // Verdigris Barbute Helmet
      ctx.fillStyle = '#155e75';
      ctx.fillRect(18, 12, 28, 34);
      ctx.fillStyle = '#042f2e';
      ctx.fillRect(20, 14, 24, 30);
      // Heavy Rusty Iron Chain
      ctx.fillStyle = '#78350f';
      ctx.fillRect(12, 38, 40, 6);
      // Glowing Cyan Depths Visor
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(22, 24, 20, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(24, 25, 4, 2);
      ctx.fillRect(36, 25, 4, 2);
      // Barnacles on Helm
      ctx.fillStyle = '#065f46';
      ctx.fillRect(20, 10, 5, 4);
      ctx.fillRect(38, 12, 6, 5);
    } else if (id.includes('morrigan')) {
      // Morrigan: Sanguine Priestess
      ctx.fillStyle = '#4c0519';
      ctx.fillRect(10, 42, 44, 22);
      ctx.fillStyle = '#881337';
      ctx.fillRect(14, 44, 36, 20);
      // Pale Visage
      ctx.fillStyle = '#ffe4e6';
      ctx.fillRect(22, 22, 20, 22);
      // Crimson Blood Veil & Horned Tiara
      ctx.fillStyle = '#9f1239';
      ctx.fillRect(18, 8, 5, 16);
      ctx.fillRect(41, 8, 5, 16);
      ctx.fillStyle = '#be123c';
      ctx.fillRect(20, 18, 24, 8);
      // Crimson Glowing Eyes
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(25, 28, 4, 3);
      ctx.fillRect(35, 28, 4, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(26, 29, 2, 1);
      ctx.fillRect(36, 29, 2, 1);
      // Blood Droplet Rune on Forehead
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(30, 22, 4, 5);
    } else if (id.includes('zephyr')) {
      // Zephyr: Astral Astromancer
      ctx.fillStyle = '#082f49';
      ctx.fillRect(10, 42, 44, 22);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(14, 44, 36, 20);
      // Deep Astral Hood
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(18, 10, 28, 34);
      ctx.fillStyle = '#0c4a6e';
      ctx.fillRect(20, 14, 24, 28);
      // Glowing Stellar Starlight Eyes
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(24, 26, 5, 3);
      ctx.fillRect(35, 26, 5, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(25, 27, 3, 1);
      ctx.fillRect(36, 27, 3, 1);
      // Golden Astrolabe / Stellar Halo
      ctx.fillStyle = '#fde047';
      ctx.fillRect(22, 6, 20, 3);
      ctx.fillRect(18, 9, 3, 5);
      ctx.fillRect(43, 9, 3, 5);
    }

    // Eldritch border
    ctx.strokeStyle = '#4338ca';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 62, 62);

    return canvas;
  }

  /* =========================================================================
     ENEMY SPRITES
     ========================================================================= */
  private static drawEnemy(id: string): HTMLCanvasElement {
    // --- 1. NIGHTGAUNT PARASITE ---
    if (id === 'enemy_bat') {
      const { canvas, ctx } = this.createCanvas(24, 24);
      // Obsidian-indigo leathery wings
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.moveTo(12, 11);
      ctx.lineTo(1, 4);
      ctx.lineTo(4, 18);
      ctx.lineTo(12, 13);
      ctx.lineTo(20, 18);
      ctx.lineTo(23, 4);
      ctx.closePath();
      ctx.fill();
      // Wing veins in bioluminescent cyan
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(12, 11); ctx.lineTo(3, 7);
      ctx.moveTo(12, 11); ctx.lineTo(21, 7);
      ctx.stroke();
      // Central faceless head with horns
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(12, 11, 3.5, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Glowing cosmic purple central eye
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(11, 9, 2, 2);
      return canvas;
    }

    // --- 2. SUNKEN HUSK ---
    if (id === 'enemy_zombie') {
      const { canvas, ctx } = this.createCanvas(32, 32);
      // Bloated teal aquatic flesh
      ctx.fillStyle = '#0f766e';
      ctx.fillRect(10, 4, 12, 10);
      // Waterlogged tattered rags
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(8, 14, 16, 12);
      // Barnacles & coral growths
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(8, 6, 2, 2);
      ctx.fillRect(19, 9, 3, 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(18, 16, 2, 2);
      // Rotting arms reaching forward
      ctx.fillStyle = '#0d9488';
      ctx.fillRect(4, 15, 6, 4);
      ctx.fillRect(22, 15, 6, 4);
      // Tentacle barbels dripping from chin
      ctx.fillStyle = '#115e59';
      ctx.fillRect(11, 14, 2, 4);
      ctx.fillRect(15, 14, 2, 5);
      ctx.fillRect(19, 14, 2, 4);
      // Legs
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(10, 26, 4, 6);
      ctx.fillRect(18, 26, 4, 6);
      // Unholy milky pale eye
      ctx.fillStyle = '#67e8f9';
      ctx.fillRect(12, 7, 3, 3);
      ctx.fillStyle = '#042f2e';
      ctx.fillRect(17, 7, 2, 2);
      return canvas;
    }

    // --- 3. VOID SPAWN ---
    if (id === 'enemy_skeleton') {
      const { canvas, ctx } = this.createCanvas(32, 32);
      // Dark twisted bone skull
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(11, 4, 10, 8);
      // Hollow eye sockets with eldritch purple fire
      ctx.fillStyle = '#581c87';
      ctx.fillRect(12, 6, 3, 3);
      ctx.fillRect(17, 6, 3, 3);
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(13, 7, 1, 1);
      ctx.fillRect(18, 7, 1, 1);
      // Distorted ribcage with glowing void singularity inside
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(14, 12, 4, 12);
      ctx.fillRect(10, 14, 12, 2);
      ctx.fillRect(11, 18, 10, 2);
      // Void core
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(14, 14, 4, 4);
      ctx.fillStyle = '#f0abfc';
      ctx.fillRect(15, 15, 2, 2);
      // Multi-jointed legs
      ctx.fillStyle = '#64748b';
      ctx.fillRect(11, 24, 3, 8);
      ctx.fillRect(18, 24, 3, 8);
      // Bone void bow
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(26, 16, 8, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      return canvas;
    }

    // --- 4. CORRUPTED INQUISITOR ---
    if (id === 'enemy_knight') {
      const { canvas, ctx } = this.createCanvas(40, 40);
      // Heavy obsidian plate armor
      ctx.fillStyle = '#090d16';
      ctx.fillRect(10, 14, 20, 18);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(12, 4, 16, 12);
      // Void helm horns
      ctx.fillStyle = '#475569';
      ctx.fillRect(8, 2, 4, 6);
      ctx.fillRect(28, 2, 4, 6);
      // Shattered chestplate with pulsing central void eye
      ctx.fillStyle = '#6b21a8';
      ctx.beginPath();
      ctx.arc(20, 22, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e879f9';
      ctx.fillRect(19, 21, 2, 2);
      // Dark tendrils writhing out from armor
      ctx.fillStyle = '#3b0764';
      ctx.fillRect(6, 20, 5, 2);
      ctx.fillRect(29, 24, 6, 2);
      // Heavy jagged runeblade
      ctx.fillStyle = '#475569';
      ctx.fillRect(32, 6, 5, 30);
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(34, 8, 1, 24);
      return canvas;
    }

    // --- BOSS 1: LEVIATHAN BEHEMOTH ---
    if (id === 'enemy_minotaur_boss') {
      const { canvas, ctx } = this.createCanvas(56, 56);
      // Deep sea turquoise armored torso
      ctx.fillStyle = '#0f766e';
      ctx.fillRect(14, 16, 28, 30);
      ctx.fillStyle = '#115e59';
      ctx.fillRect(16, 8, 24, 16);
      // Dorsal shark fins & aquatic horns
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.moveTo(16, 10); ctx.lineTo(4, 1); ctx.lineTo(14, 16);
      ctx.moveTo(40, 10); ctx.lineTo(52, 1); ctx.lineTo(42, 16);
      ctx.fill();
      // Shark maw & burning cyan bioluminescent eyes
      ctx.fillStyle = '#042f2e';
      ctx.fillRect(20, 16, 16, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(22, 16, 2, 3);
      ctx.fillRect(26, 16, 2, 3);
      ctx.fillRect(30, 16, 2, 3);
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(20, 11, 4, 3);
      ctx.fillRect(32, 11, 4, 3);
      // Colossal rusted iron anchor weapon
      ctx.fillStyle = '#475569';
      ctx.fillRect(44, 4, 4, 46);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(46, 44, 10, 0, Math.PI);
      ctx.stroke();
      return canvas;
    }

    // --- BOSS 2: SPAWN OF SHUB-NIGGURATH ---
    if (id === 'enemy_gorgon_boss') {
      const { canvas, ctx } = this.createCanvas(56, 56);
      // Writhing dark mass
      ctx.fillStyle = '#052e16';
      ctx.beginPath();
      ctx.arc(28, 28, 22, 0, Math.PI * 2);
      ctx.fill();
      // Undulating tentacle limbs
      ctx.fillStyle = '#15803d';
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.fillRect(28 + Math.cos(a) * 20 - 3, 28 + Math.sin(a) * 20 - 3, 6, 8);
      }
      // Dripping acidic eldritch ooze
      ctx.fillStyle = '#84cc16';
      ctx.fillRect(20, 42, 4, 6);
      ctx.fillRect(32, 44, 4, 8);
      // Clusters of unholy yellow cosmic eyes
      const eyeCoords = [
        [22, 20], [34, 20], [28, 16],
        [20, 28], [36, 28], [28, 32],
      ];
      eyeCoords.forEach(([ex, ey]) => {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.fillRect(ex - 0.5, ey - 2, 1, 4);
      });
      return canvas;
    }

    // --- BOSS 3: HERALD OF NYARLATHOTEP ---
    if (id === 'enemy_vampire_boss') {
      const { canvas, ctx } = this.createCanvas(56, 56);
      // Shifting void aura
      const grad = ctx.createRadialGradient(28, 28, 8, 28, 28, 28);
      grad.addColorStop(0, 'rgba(147, 51, 234, 0.5)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(28, 28, 26, 0, Math.PI * 2);
      ctx.fill();
      // Shifting obsidian shadowy robes
      ctx.fillStyle = '#2e1065';
      ctx.fillRect(14, 18, 28, 32);
      ctx.fillStyle = '#581c87';
      ctx.fillRect(18, 14, 20, 24);
      // Faceless void head
      ctx.fillStyle = '#0f051d';
      ctx.fillRect(20, 8, 16, 14);
      // Single unholy cosmic vertical eye
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.ellipse(28, 15, 3, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(27.5, 14, 1, 2);
      // Floating runes of chaos
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(8, 22, 6, 6);
      ctx.strokeRect(42, 22, 6, 6);
      return canvas;
    }

    // --- BOSS 4: HIGH PRIEST OF R'LYEH ---
    if (id === 'enemy_necromancer_boss') {
      const { canvas, ctx } = this.createCanvas(56, 56);
      // Deep sea ceremonial purple & gold robes
      ctx.fillStyle = '#3b0764';
      ctx.fillRect(12, 16, 32, 34);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(14, 18, 28, 2);
      ctx.fillRect(26, 20, 4, 30);
      // Squid / Octopus visage
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(18, 8, 20, 14);
      // Writhing tentacles draping down
      ctx.fillStyle = '#7c3aed';
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(20 + i * 3.5, 20, 2.5, 10 + (i % 2) * 3);
      }
      // Glowing yellow void eyes
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(21, 12, 3, 3);
      ctx.fillRect(32, 12, 3, 3);
      // Eldritch Staff of the Deep
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(8, 4, 3, 48);
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(9.5, 6, 6, 0, Math.PI * 2);
      ctx.fill();
      return canvas;
    }

    // --- REAPER: THE ANCIENT ONE (CTHULHU) ---
    if (id === 'enemy_reaper') {
      const { canvas, ctx } = this.createCanvas(64, 64);
      // Colossal cosmic doom shadow
      ctx.fillStyle = '#022c22';
      ctx.beginPath();
      ctx.arc(32, 24, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(16, 24, 32, 36);
      // Colossal Dragon / Bat Wings
      ctx.fillStyle = '#064e3b';
      ctx.beginPath();
      ctx.moveTo(32, 24);
      ctx.lineTo(2, 6);
      ctx.lineTo(8, 40);
      ctx.lineTo(24, 34);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(32, 24);
      ctx.lineTo(62, 6);
      ctx.lineTo(56, 40);
      ctx.lineTo(40, 34);
      ctx.closePath();
      ctx.fill();
      // Tentacle bearded maw
      ctx.fillStyle = '#10b981';
      for (let t = 0; t < 7; t++) {
        ctx.fillRect(23 + t * 2.6, 28, 2, 14 + (t % 3) * 3);
      }
      // Piercing Unholy Yellow Elder Eyes
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(25, 18, 4, 3);
      ctx.fillRect(35, 18, 4, 3);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(26.5, 18, 1, 3);
      ctx.fillRect(36.5, 18, 1, 3);
      return canvas;
    }

    return this.createCanvas(32, 32).canvas;
  }

  /* =========================================================================
     PROJECTILES & ATTACK EFFECTS
     ========================================================================= */
  private static drawProjectile(id: string): HTMLCanvasElement {
    if (id === 'proj_whip_slash') {
      const size = 64;
      const { canvas, ctx } = this.createCanvas(size, size);
      // Beautiful curved crescent blade slash
      const grad = ctx.createRadialGradient(28, 32, 10, 28, 32, 32);
      grad.addColorStop(0, 'rgba(59, 130, 246, 0)');
      grad.addColorStop(0.3, 'rgba(96, 165, 250, 0.5)');
      grad.addColorStop(0.75, 'rgba(250, 204, 21, 0.85)');
      grad.addColorStop(0.95, '#ffffff');
      grad.addColorStop(1, 'rgba(254, 240, 138, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(32, 32, 30, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.arc(20, 32, 14, Math.PI * 0.45, -Math.PI * 0.45, true);
      ctx.closePath();
      ctx.fill();

      // Sharp glowing cutting edge
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(32, 32, 29, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();

      return canvas;
    }

    if (id === 'proj_magic_bolt') {
      // Void Darts / Cosmic Rupture: Void Dart with glowing cosmic eye
      const { canvas, ctx } = this.createCanvas(20, 20);
      const grad = ctx.createRadialGradient(10, 10, 2, 10, 10, 10);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#38bdf8');
      grad.addColorStop(0.7, '#7c3aed');
      grad.addColorStop(1, 'rgba(124, 58, 237, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(10, 10, 9, 0, Math.PI * 2);
      ctx.fill();
      // Eye slit
      ctx.fillStyle = '#090d16';
      ctx.fillRect(9, 7, 2, 6);
      return canvas;
    }

    if (id === 'proj_knife') {
      // Obsidian Fangs: Jet-black obsidian dagger with cyan void runes
      const { canvas, ctx } = this.createCanvas(22, 10);
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.moveTo(0, 5); ctx.lineTo(14, 1); ctx.lineTo(22, 5); ctx.lineTo(14, 9);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Glowing core
      ctx.fillStyle = '#67e8f9';
      ctx.fillRect(4, 4, 10, 2);
      return canvas;
    }

    if (id === 'proj_fireball') {
      // Blackfire Orb & Starfall: Swirling cosmic emerald & void violet plasma
      const { canvas, ctx } = this.createCanvas(22, 22);
      const grad = ctx.createRadialGradient(11, 11, 2, 11, 11, 11);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#10b981');
      grad.addColorStop(0.75, '#7c3aed');
      grad.addColorStop(1, 'rgba(124, 58, 237, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(11, 11, 10, 0, Math.PI * 2);
      ctx.fill();
      // Black Singularity Center
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(11, 11, 3, 0, Math.PI * 2);
      ctx.fill();
      return canvas;
    }

    if (id === 'proj_bible') {
      // Tome of R'lyeh: Ancient whispering parchment with watchful eye
      const { canvas, ctx } = this.createCanvas(22, 22);
      ctx.fillStyle = '#1e1035';
      ctx.fillRect(2, 2, 18, 18);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(2, 2, 18, 18);
      // Central Unholy Eye
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(11, 11, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#090d16';
      ctx.fillRect(10, 8, 2, 6);
      return canvas;
    }

    if (id === 'proj_garlic_aura') {
      // Abyssal Miasma: Pulsating eldritch void mist
      const { canvas, ctx } = this.createCanvas(64, 64);
      const grad = ctx.createRadialGradient(32, 32, 12, 32, 32, 32);
      grad.addColorStop(0, 'rgba(124, 58, 237, 0.4)');
      grad.addColorStop(0.65, 'rgba(16, 185, 129, 0.3)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(32, 32, 31, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      return canvas;
    }

    if (id === 'proj_bone') {
      // Crypt Shards: Jagged cursed skeletal shards with amethyst aura
      const { canvas, ctx } = this.createCanvas(18, 18);
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(2, 9); ctx.lineTo(9, 2); ctx.lineTo(16, 9); ctx.lineTo(9, 16);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(7, 7, 4, 4);
      return canvas;
    }

    // --- CROSS / HEAVEN SWORD: ELDER WARD ---
    if (id === 'proj_cross') {
      // 5-Pointed Elder Sigil Star of Cthulhu
      const { canvas, ctx } = this.createCanvas(26, 26);
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a1 = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const a2 = ((i + 0.5) / 5) * Math.PI * 2 - Math.PI / 2;
        ctx.lineTo(13 + Math.cos(a1) * 12, 13 + Math.sin(a1) * 12);
        ctx.lineTo(13 + Math.cos(a2) * 5, 13 + Math.sin(a2) * 5);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(13, 13, 3, 0, Math.PI * 2);
      ctx.fill();
      return canvas;
    }

    // --- LIGHTNING: COSMIC WRATH ---
    if (id === 'proj_lightning') {
      const { canvas, ctx } = this.createCanvas(24, 64);
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.moveTo(14, 0); ctx.lineTo(6, 24); ctx.lineTo(16, 26);
      ctx.lineTo(8, 64); ctx.lineTo(18, 36); ctx.lineTo(10, 34);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(13, 4); ctx.lineTo(8, 24); ctx.lineTo(14, 26);
      ctx.lineTo(10, 58); ctx.lineTo(16, 36); ctx.lineTo(12, 34);
      ctx.closePath();
      ctx.fill();
      return canvas;
    }

    // --- AXE: CURSED SCYTHE ---
    if (id === 'proj_axe') {
      const { canvas, ctx } = this.createCanvas(26, 26);
      ctx.strokeStyle = '#475569'; // Bone/Dark staff
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(4, 22); ctx.lineTo(20, 6);
      ctx.stroke();
      // Curved Scythe Blade
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(20, 6);
      ctx.quadraticCurveTo(28, 2, 26, 16);
      ctx.quadraticCurveTo(20, 10, 16, 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(19, 7, 2, 4);
      return canvas;
    }

    // --- SCYTHE: REAPER OF R'LYEH ---
    if (id === 'proj_scythe') {
      const { canvas, ctx } = this.createCanvas(36, 36);
      ctx.strokeStyle = '#3b0764';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(6, 30); ctx.lineTo(28, 8);
      ctx.stroke();
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.moveTo(28, 8);
      ctx.quadraticCurveTo(36, 2, 36, 22);
      ctx.quadraticCurveTo(28, 14, 22, 14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e879f9';
      ctx.fillRect(27, 9, 3, 6);
      return canvas;
    }

    // --- PRIMORDIAL SLIME / ICHOR FLASK ---
    if (id === 'proj_holy_water') {
      const { canvas, ctx } = this.createCanvas(48, 48);
      const grad = ctx.createRadialGradient(24, 24, 4, 24, 24, 24);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#10b981');
      grad.addColorStop(0.7, '#7c3aed');
      grad.addColorStop(1, 'rgba(124, 58, 237, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(24, 24, 22, 0, Math.PI * 2);
      ctx.fill();
      // Acidic bubbles
      ctx.fillStyle = '#a7f3d0';
      ctx.beginPath();
      ctx.arc(20, 18, 3, 0, Math.PI * 2);
      ctx.arc(29, 25, 2.5, 0, Math.PI * 2);
      ctx.arc(18, 28, 2, 0, Math.PI * 2);
      ctx.fill();
      return canvas;
    }

    if (id === 'proj_arrow') {
      const { canvas, ctx } = this.createCanvas(20, 6);
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(20, 3); ctx.lineTo(14, 0); ctx.lineTo(14, 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#78350f';
      ctx.fillRect(4, 2, 11, 2);
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, 0, 4, 6);
      return canvas;
    }

    // --- VOID TENDRIL / LEVIATHAN'S GRASP ---
    if (id === 'proj_void_tendril') {
      const { canvas, ctx } = this.createCanvas(48, 48);
      // Sweeping abyssal tentacle with suction cups
      ctx.fillStyle = '#1e1035';
      ctx.beginPath();
      ctx.moveTo(10, 44);
      ctx.quadraticCurveTo(16, 20, 36, 10);
      ctx.quadraticCurveTo(42, 6, 44, 4);
      ctx.quadraticCurveTo(40, 16, 26, 30);
      ctx.quadraticCurveTo(20, 40, 14, 46);
      ctx.closePath();
      ctx.fill();
      // Glowing violet inner marrow
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(12, 44);
      ctx.quadraticCurveTo(20, 24, 40, 8);
      ctx.stroke();
      // Suction cups
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(22, 28, 2.5, 0, Math.PI * 2);
      ctx.arc(30, 20, 2.5, 0, Math.PI * 2);
      ctx.arc(38, 13, 2, 0, Math.PI * 2);
      ctx.fill();
      // Tip stinger glow
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(41, 5, 3, 3);
      return canvas;
    }

    // --- ABYSSAL ANCHOR / WORLDBREAKER ---
    if (id === 'proj_abyssal_anchor') {
      const { canvas, ctx } = this.createCanvas(40, 40);
      ctx.save();
      ctx.translate(20, 20);
      // Rusted Shank
      ctx.fillStyle = '#334155';
      ctx.fillRect(-2.5, -16, 5, 28);
      // Stock Crossbar
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-12, -12, 24, 4);
      // Top Ring
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, -15, 3.5, 0, Math.PI * 2);
      ctx.stroke();
      // Flukes (Curved Bottom)
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 4, 13, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      // Palms (Barbed Tips)
      ctx.fillStyle = '#06b6d4'; // Glowing sea runes
      ctx.fillRect(-15, 6, 4, 4);
      ctx.fillRect(11, 6, 4, 4);
      ctx.restore();
      return canvas;
    }

    // --- SINGULARITY SPHERE / EVENT HORIZON ---
    if (id === 'proj_singularity') {
      const { canvas, ctx } = this.createCanvas(36, 36);
      const grad = ctx.createRadialGradient(18, 18, 2, 18, 18, 18);
      grad.addColorStop(0, '#000000');
      grad.addColorStop(0.35, '#0284c7');
      grad.addColorStop(0.7, '#7c3aed');
      grad.addColorStop(0.95, '#38bdf8');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(18, 18, 17, 0, Math.PI * 2);
      ctx.fill();
      // Central Event Horizon (Pitch Black)
      ctx.fillStyle = '#030712';
      ctx.beginPath();
      ctx.arc(18, 18, 6, 0, Math.PI * 2);
      ctx.fill();
      // Swirling Accretion Spiral
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(18, 18, 10, 0, Math.PI * 1.2);
      ctx.stroke();
      return canvas;
    }

    // --- SANGUINE CHALICE BLOOD RUNE ---
    if (id === 'proj_blood_chalice') {
      const { canvas, ctx } = this.createCanvas(32, 32);
      // Crimson Runic Circle
      ctx.strokeStyle = '#be123c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(16, 16, 13, 0, Math.PI * 2);
      ctx.stroke();
      // Inner Blood Star
      ctx.fillStyle = '#881337';
      ctx.beginPath();
      ctx.arc(16, 16, 9, 0, Math.PI * 2);
      ctx.fill();
      // Thorn cross
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(15, 5, 2, 22);
      ctx.fillRect(5, 15, 22, 2);
      ctx.fillStyle = '#ffe4e6';
      ctx.fillRect(15, 15, 2, 2);
      return canvas;
    }

    return this.createCanvas(16, 16).canvas;
  }

  /* =========================================================================
     PICKUPS, GEMS & CHESTS
     ========================================================================= */
  private static drawPickup(id: string): HTMLCanvasElement {
    if (id.startsWith('gem_')) {
      // Cosmic Void Shards
      const { canvas, ctx } = this.createCanvas(16, 16);
      let color = '#06b6d4';
      let size = 5;

      if (id === 'gem_green') { color = '#10b981'; size = 6; }
      else if (id === 'gem_red') { color = '#f43f5e'; size = 7; }
      else if (id === 'gem_gold') { color = '#fbbf24'; size = 8; }

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(8, 8 - size); ctx.lineTo(8 + size, 8);
      ctx.lineTo(8, 8 + size); ctx.lineTo(8 - size, 8);
      ctx.closePath();
      ctx.fill();

      // Sharp multifaceted spectral highlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(8, 8 - size); ctx.lineTo(8 + size * 0.4, 8);
      ctx.lineTo(8, 8); ctx.lineTo(8 - size * 0.4, 8);
      ctx.closePath();
      ctx.fill();

      // Deep void core
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(8, 8, size * 0.25, 0, Math.PI * 2);
      ctx.fill();
      return canvas;
    }

    if (id === 'pickup_coin') {
      // Sunken Abyssal Coin of R'lyeh
      const { canvas, ctx } = this.createCanvas(16, 16);
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(8, 8, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(8, 8, 5, 0, Math.PI * 2);
      ctx.fill();
      // Ancient rune symbol
      ctx.fillStyle = '#451a03';
      ctx.fillRect(6, 6, 4, 4);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(7, 7, 2, 2);
      return canvas;
    }

    if (id === 'pickup_chest') {
      // Sunken Relic Chest
      const { canvas, ctx } = this.createCanvas(24, 24);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(3, 8, 18, 13);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(4, 9, 16, 11);
      // Gold & Bronze Trims
      ctx.fillStyle = '#d97706';
      ctx.fillRect(3, 8, 18, 3);
      ctx.fillRect(3, 18, 18, 3);
      // Glowing Void Lock
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(10, 10, 4, 5);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(11, 11, 2, 2);
      return canvas;
    }

    if (id === 'pickup_magnet') {
      // Astral Vacuum Relic
      const { canvas, ctx } = this.createCanvas(20, 20);
      ctx.fillStyle = '#7c3aed';
      ctx.beginPath();
      ctx.arc(10, 10, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(10, 10, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(10, 10, 2, 0, Math.PI * 2);
      ctx.fill();
      return canvas;
    }

    if (id === 'pickup_rosary') {
      // Elder Ward Sigil (Screen Wipe)
      const { canvas, ctx } = this.createCanvas(22, 22);
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a1 = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const a2 = ((i + 0.5) / 5) * Math.PI * 2 - Math.PI / 2;
        ctx.lineTo(11 + Math.cos(a1) * 9, 11 + Math.sin(a1) * 9);
        ctx.lineTo(11 + Math.cos(a2) * 4, 11 + Math.sin(a2) * 4);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(11, 11, 3, 0, Math.PI * 2);
      ctx.fill();
      return canvas;
    }

    if (id === 'pickup_meat') {
      // Primordial Vitality Heart / Flask
      const { canvas, ctx } = this.createCanvas(20, 20);
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.arc(7, 7, 5, 0, Math.PI * 2);
      ctx.arc(13, 7, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(2, 8); ctx.lineTo(10, 17); ctx.lineTo(18, 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(6, 6, 2, 2);
      return canvas;
    }

    return this.createCanvas(16, 16).canvas;
  }

  /* =========================================================================
     MAP TILES
     ========================================================================= */
  private static drawTile(id: string): HTMLCanvasElement {
    const size = 64;
    const { canvas, ctx } = this.createCanvas(size, size);

    if (id === 'tile_grass') {
      // Stage 1: Sunken Ruins of R'lyeh (Smooth Dark Basalt Slate - Non-fatiguing)
      // Deep dark slate ocean floor base
      ctx.fillStyle = '#0a0e16';
      ctx.fillRect(0, 0, size, size);

      // Subtle, weathered basalt paving slabs with gentle, low-contrast seams
      ctx.fillStyle = '#0e131d';
      ctx.fillRect(1, 1, 62, 30);
      ctx.fillRect(1, 33, 30, 30);
      ctx.fillRect(33, 33, 30, 30);

      // Soft, very dark hairline seams between stone blocks (no harsh contrast)
      ctx.strokeStyle = '#060910';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, 63, 63);
      ctx.beginPath();
      ctx.moveTo(0, 32); ctx.lineTo(64, 32);
      ctx.moveTo(32, 32); ctx.lineTo(32, 64);
      ctx.stroke();

      // Gentle, low-contrast stone texture flecks (no bright dots!)
      ctx.fillStyle = '#111722';
      ctx.fillRect(8, 8, 12, 6);
      ctx.fillRect(38, 14, 14, 8);
      ctx.fillRect(10, 42, 10, 8);
      ctx.fillRect(44, 46, 10, 6);

      // Very subtle, muted deep-sea water tint (barely perceptible 3% tint)
      ctx.fillStyle = 'rgba(8, 28, 40, 0.25)';
      ctx.fillRect(20, 18, 18, 8);
      ctx.fillRect(6, 36, 16, 6);
    } else if (id === 'tile_stone') {
      // Smooth Submerged Cyclopean Stone
      ctx.fillStyle = '#090d14';
      ctx.fillRect(0, 0, size, size);

      // Low contrast flagstone blocks
      ctx.fillStyle = '#0d121c';
      ctx.fillRect(1, 1, 30, 62);
      ctx.fillRect(33, 1, 30, 62);

      ctx.strokeStyle = '#05070c';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(32, 0); ctx.lineTo(32, 64);
      ctx.stroke();

      ctx.fillStyle = '#111622';
      ctx.fillRect(6, 10, 12, 16);
      ctx.fillRect(40, 32, 14, 18);
    } else if (id === 'tile_molten') {
      // Stage 2: Abyssal Trench (Smooth Volcanic Obsidian & Deep Charcoal)
      ctx.fillStyle = '#0a0810';
      ctx.fillRect(0, 0, size, size);

      // Large basalt rock slabs
      ctx.fillStyle = '#0e0c17';
      ctx.fillRect(1, 1, 62, 62);

      // Faint, muted tectonic cracks (dark muted purple, low contrast)
      ctx.strokeStyle = '#161022';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 24); ctx.lineTo(24, 28); ctx.lineTo(40, 20); ctx.lineTo(64, 26);
      ctx.stroke();

      // Subtle dark charcoal stone variations
      ctx.fillStyle = '#120e1c';
      ctx.fillRect(6, 6, 18, 12);
      ctx.fillRect(34, 36, 20, 16);

      // Very gentle, deep crimson ambient warmth (subtle and non-intrusive)
      ctx.fillStyle = 'rgba(88, 28, 135, 0.08)';
      ctx.fillRect(16, 32, 28, 14);
    } else if (id === 'tile_library') {
      // Stage 3: Miskatonic Void Spire (Smooth Astral Obsidian Floor)
      ctx.fillStyle = '#080610';
      ctx.fillRect(0, 0, size, size);

      // Muted cosmic slate flagstones
      ctx.fillStyle = '#0d0918';
      ctx.fillRect(1, 1, 62, 62);

      // Soft, very dark hairline inlay lines
      ctx.strokeStyle = '#140e24';
      ctx.lineWidth = 1;
      ctx.strokeRect(6, 6, 52, 52);

      // Very subtle stone variations
      ctx.fillStyle = '#110d20';
      ctx.fillRect(12, 12, 14, 14);
      ctx.fillRect(38, 38, 14, 14);
    }

    return canvas;
  }

  /* =========================================================================
     UI & LEVEL UP ICONS
     ========================================================================= */
  private static drawIcon(id: string): HTMLCanvasElement {
    const size = 48;
    const { canvas, ctx } = this.createCanvas(size, size);

    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#4338ca';
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, size - 3, size - 3);

    ctx.save();
    ctx.translate(size / 2, size / 2);

    if (id.includes('whip') || id.includes('bloody')) {
      const isBloody = id.includes('bloody');
      ctx.rotate(-Math.PI / 4);
      // Abyssal / Crimson Runic Blade
      ctx.fillStyle = isBloody ? '#991b1b' : '#0f172a';
      ctx.fillRect(-3, -18, 6, 22);
      ctx.fillStyle = isBloody ? '#ef4444' : '#a855f7';
      ctx.fillRect(-1, -16, 2, 18); // Glowing rune core
      // Blade Point
      ctx.fillStyle = isBloody ? '#dc2626' : '#64748b';
      ctx.beginPath();
      ctx.moveTo(-3, -18); ctx.lineTo(0, -23); ctx.lineTo(3, -18);
      ctx.fill();
      // Crossguard
      ctx.fillStyle = isBloody ? '#450a0a' : '#1e1b4b';
      ctx.fillRect(-8, 4, 16, 4);
      // Grip & Pommel
      ctx.fillStyle = '#090d16';
      ctx.fillRect(-1.5, 8, 3, 7);
      ctx.fillStyle = isBloody ? '#ef4444' : '#06b6d4';
      ctx.beginPath();
      ctx.arc(0, 16.5, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (id.includes('wand') || id.includes('holy_wand')) {
      // Void Darts & Cosmic Rupture: Void orb with glowing eye
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(0, -6, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = id.includes('holy') ? '#38bdf8' : '#a855f7';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Central glowing eye
      ctx.fillStyle = id.includes('holy') ? '#67e8f9' : '#c084fc';
      ctx.beginPath();
      ctx.ellipse(0, -6, 4, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#090d16';
      ctx.fillRect(-1, -7, 2, 3);
      // Bone handle
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-2, 4, 4, 14);
    } else if (id.includes('knife') || id.includes('thousand')) {
      // Obsidian Fangs & Endless Maw
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.moveTo(0, -18); ctx.lineTo(6, 6); ctx.lineTo(0, 14); ctx.lineTo(-6, 6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = id.includes('thousand') ? '#a855f7' : '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = id.includes('thousand') ? '#c084fc' : '#22d3ee';
      ctx.fillRect(-1, -10, 2, 12);
    } else if (id.includes('fire') || id.includes('hellfire')) {
      // Blackfire Orb & Starfall: Swirling eldritch green & purple flame
      ctx.fillStyle = id.includes('hellfire') ? '#7e22ce' : '#052e16';
      ctx.beginPath();
      ctx.arc(0, 2, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = id.includes('hellfire') ? '#c084fc' : '#10b981';
      ctx.beginPath();
      ctx.arc(0, 2, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1, 0, 2, 3);
    } else if (id.includes('bible') || id.includes('vespers')) {
      // Tome of R'lyeh: Grimoire with central eye
      ctx.fillStyle = id.includes('vespers') ? '#2e1065' : '#1e293b';
      ctx.fillRect(-12, -14, 24, 28);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-12, -14, 24, 28);
      // Cosmic eye on cover
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.fillRect(-1, -3, 2, 6);
    } else if (id.includes('garlic') || id.includes('soul')) {
      // Abyssal Miasma / Void Siphon: Swirling eldritch miasma
      ctx.fillStyle = id.includes('soul') ? '#581c87' : '#064e3b';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = id.includes('soul') ? '#a855f7' : '#10b981';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (id.includes('cross') || id.includes('heaven_sword')) {
      // Elder Ward: Star-shaped Cthulhu elder sigil
      ctx.fillStyle = id.includes('heaven') ? '#06b6d4' : '#a855f7';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a1 = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const a2 = ((i + 0.5) / 5) * Math.PI * 2 - Math.PI / 2;
        ctx.lineTo(Math.cos(a1) * 14, Math.sin(a1) * 14);
        ctx.lineTo(Math.cos(a2) * 6, Math.sin(a2) * 6);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (id.includes('lightning') || id.includes('thunder')) {
      // Cosmic Wrath: Deep space void lightning
      ctx.fillStyle = id.includes('thunder') ? '#e879f9' : '#a855f7';
      ctx.beginPath();
      ctx.moveTo(4, -14); ctx.lineTo(-6, 0); ctx.lineTo(2, 2);
      ctx.lineTo(-4, 14); ctx.lineTo(8, -2); ctx.lineTo(0, -4);
      ctx.closePath();
      ctx.fill();
    } else if (id.includes('axe') || id.includes('spiral')) {
      // Cursed Scythe: Curved reaper blade
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 14); ctx.lineTo(0, -10);
      ctx.stroke();
      ctx.fillStyle = id.includes('spiral') ? '#c084fc' : '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.quadraticCurveTo(-14, -16, -12, 0);
      ctx.quadraticCurveTo(-8, -8, 0, -6);
      ctx.closePath();
      ctx.fill();
    } else if (id.includes('water') || id.includes('borra')) {
      // Ichor Flask: Primordial slime vial
      ctx.fillStyle = id.includes('borra') ? '#a855f7' : '#10b981';
      ctx.beginPath();
      ctx.arc(0, 4, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-3, -12, 6, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(1, 2, 2, 2);
    } else if (id.includes('clover')) {
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(-6, -6, 6, 0, Math.PI * 2);
      ctx.arc(6, -6, 6, 0, Math.PI * 2);
      ctx.arc(-6, 6, 6, 0, Math.PI * 2);
      ctx.arc(6, 6, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (id.includes('duplicator')) {
      ctx.fillStyle = '#e879f9';
      ctx.beginPath();
      ctx.arc(-5, 0, 7, 0, Math.PI * 2);
      ctx.arc(5, 0, 7, 0, Math.PI * 2);
      ctx.fill();
    } else if (id.includes('candelabrador')) {
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-10, 6, 20, 4);
      ctx.fillRect(-2, -8, 4, 14);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, -12, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (id.includes('attractorb')) {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (id.includes('heart')) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.bezierCurveTo(-14, -6, -14, -14, 0, -6);
      ctx.bezierCurveTo(14, -14, 14, -6, 0, 8);
      ctx.fill();
    } else if (id.includes('tome')) {
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(-12, -12, 24, 24);
    } else if (id.includes('spinach')) {
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (id.includes('bracer')) {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#d97706';
      ctx.stroke();
    } else if (id.includes('void_tendril') || id.includes('leviathan')) {
      // Void Tendrils / Leviathan's Grasp Icon
      ctx.fillStyle = id.includes('leviathan') ? '#581c87' : '#1e1035';
      ctx.beginPath();
      ctx.moveTo(-6, 14);
      ctx.quadraticCurveTo(-2, -4, 10, -12);
      ctx.quadraticCurveTo(14, -14, 16, -12);
      ctx.quadraticCurveTo(10, 0, -2, 16);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(4, -4, 3, 3);
      ctx.fillRect(-1, 4, 3, 3);
    } else if (id.includes('abyssal_anchor') || id.includes('worldbreaker')) {
      // Abyssal Anchor / Worldbreaker Icon
      ctx.fillStyle = '#334155';
      ctx.fillRect(-2, -14, 4, 22);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-10, -10, 20, 3);
      ctx.strokeStyle = id.includes('worldbreaker') ? '#06b6d4' : '#475569';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 2, 10, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    } else if (id.includes('singularity') || id.includes('event_horizon')) {
      // Singularity Sphere / Event Horizon Icon
      const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 14);
      g.addColorStop(0, '#000000');
      g.addColorStop(0.5, '#0284c7');
      g.addColorStop(1, '#a855f7');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 1.3);
      ctx.stroke();
    } else if (id.includes('blood_chalice') || id.includes('primordial_heart')) {
      // Sanguine Chalice / Primordial Heart Icon
      ctx.fillStyle = '#475569';
      ctx.fillRect(-8, -12, 16, 12);
      ctx.fillRect(-2, 0, 4, 10);
      ctx.fillRect(-6, 10, 12, 3);
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(-6, -10, 12, 8);
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(0, -6, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (id.includes('madness_grimoire')) {
      // Grimoire of Madness
      ctx.fillStyle = '#2e1065';
      ctx.fillRect(-10, -12, 20, 24);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-10, -12, 20, 24);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (id.includes('void_carapace')) {
      // Void Carapace
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-6, -6, 12, 12);
    } else if (id.includes('astral_prism')) {
      // Astral Prism
      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath();
      ctx.moveTo(0, -14); ctx.lineTo(12, 0); ctx.lineTo(0, 14); ctx.lineTo(-12, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -10); ctx.lineTo(6, 0); ctx.lineTo(0, 10); ctx.lineTo(-6, 0);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-8, -8, 16, 16);
    }

    ctx.restore();
    return canvas;
  }

  /* =========================================================================
     MAP OBSTACLES & POWER-UP SHRINES
     ========================================================================= */
  private static drawWorldObject(id: string): HTMLCanvasElement {
    const { canvas, ctx } = this.createCanvas(48, 48);

    if (id === 'obstacle_pillar') {
      // Sunken Basalt Monolith of R'lyeh
      ctx.fillStyle = '#090d16';
      ctx.fillRect(14, 6, 20, 36);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(16, 8, 16, 32);
      ctx.fillStyle = '#1e293b'; // Capital & Base
      ctx.fillRect(12, 4, 24, 6);
      ctx.fillRect(12, 38, 24, 6);
      // Glowing Cyan Eldritch Runes
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(22, 12, 4, 3);
      ctx.fillRect(20, 18, 8, 2);
      ctx.fillRect(22, 23, 4, 6);
      ctx.fillRect(21, 32, 6, 2);
      // Dark Kelp & Barnacles
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(13, 20, 3, 12);
      ctx.fillRect(32, 14, 3, 10);
      return canvas;
    }

    if (id === 'obstacle_boulder') {
      // Cosmic Void Meteorite with Embedded Amethyst Crystals
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(24, 24, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(22, 22, 14, 0, Math.PI * 2);
      ctx.fill();
      // Glowing Void Crystal Spikes
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.moveTo(14, 12); ctx.lineTo(10, 4); ctx.lineTo(18, 10);
      ctx.moveTo(30, 10); ctx.lineTo(34, 2); ctx.lineTo(36, 12);
      ctx.fill();
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(18, 18, 5, 4);
      ctx.fillRect(26, 24, 4, 5);
      return canvas;
    }

    if (id === 'obstacle_tombstone') {
      // Elder Stele of R'lyeh (Carved with Elder Star & Eye)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(24, 16, 10, Math.PI, 0);
      ctx.fillRect(14, 16, 20, 26);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(16, 16, 16, 24);
      // Elder Sigil Star
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a1 = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const a2 = ((i + 0.5) / 5) * Math.PI * 2 - Math.PI / 2;
        ctx.lineTo(24 + Math.cos(a1) * 6, 24 + Math.sin(a1) * 6);
        ctx.lineTo(24 + Math.cos(a2) * 2.5, 24 + Math.sin(a2) * 2.5);
      }
      ctx.closePath();
      ctx.fill();
      // Watchful Void Eye
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.ellipse(24, 34, 4, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#090d16';
      ctx.fillRect(23.5, 33, 1, 2);
      return canvas;
    }

    if (id === 'obstacle_ruin_wall') {
      // Cyclopean Sunken Basalt Wall
      ctx.fillStyle = '#090d16';
      ctx.fillRect(6, 14, 36, 24);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(8, 16, 32, 20);
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(10, 18, 12, 6);
      ctx.strokeRect(24, 18, 12, 6);
      ctx.strokeRect(16, 26, 14, 6);
      // Bioluminescent deep-sea lichen
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(11, 20, 3, 2);
      ctx.fillRect(28, 28, 4, 2);
      return canvas;
    }

    if (id === 'shrine_blood') {
      // Altar of Primordial Ichor
      ctx.fillStyle = '#1e1035';
      ctx.fillRect(10, 18, 28, 22);
      ctx.fillStyle = '#3b0764';
      ctx.fillRect(12, 20, 24, 18);
      // Bubbling cosmic crimson/purple ichor basin
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.arc(24, 14, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(21, 11, 3, 3);
      ctx.fillRect(26, 13, 2, 2);
      // Occult Horns framing basin
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.moveTo(14, 16); ctx.lineTo(10, 6); ctx.lineTo(16, 12);
      ctx.moveTo(34, 16); ctx.lineTo(38, 6); ctx.lineTo(32, 12);
      ctx.fill();
      return canvas;
    }

    if (id === 'shrine_gold') {
      // Sunken Relic Coffer of R'lyeh
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(10, 18, 28, 22);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(12, 20, 24, 18);
      // Barnacled bronze chest with cursed gold aura
      ctx.fillStyle = '#b45309';
      ctx.fillRect(14, 10, 20, 12);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(22, 14, 4, 4);
      // Chains binding chest
      ctx.fillStyle = '#64748b';
      ctx.fillRect(18, 8, 2, 16);
      ctx.fillRect(28, 8, 2, 16);
      return canvas;
    }

    if (id === 'shrine_healing') {
      // Astral Vitality Font (Bioluminescent Cyan Vortex)
      ctx.fillStyle = '#081426';
      ctx.fillRect(10, 18, 28, 22);
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(24, 16, 10, 0, Math.PI * 2);
      ctx.fill();
      // Swirling inner light
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(24, 14, 4, 0, Math.PI * 2);
      ctx.fill();
      // Floating cyan prism
      ctx.fillStyle = '#67e8f9';
      ctx.beginPath();
      ctx.moveTo(24, 4); ctx.lineTo(20, 10); ctx.lineTo(28, 10);
      ctx.closePath();
      ctx.fill();
      return canvas;
    }

    if (id === 'shrine_speed') {
      // Void Warp Obelisk (Emerald/Purple Spatial Rift)
      ctx.fillStyle = '#022c22';
      ctx.fillRect(12, 14, 24, 26);
      ctx.fillStyle = '#065f46';
      ctx.fillRect(14, 16, 20, 22);
      // Spatial rift vortex
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.ellipse(24, 24, 6, 12, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#67e8f9';
      ctx.fillRect(23, 22, 2, 4);
      return canvas;
    }

    if (id === 'shrine_cocoon') {
      // Weaver's Cocoon (Arachnid Silk Pod)
      ctx.fillStyle = '#1e1035';
      ctx.fillRect(12, 18, 24, 22);
      // Giant Silk Cocoon Egg
      ctx.fillStyle = '#3b0764';
      ctx.beginPath();
      ctx.ellipse(24, 20, 14, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      // Glowing Silk Bands
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(24, 20, 14, 18, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Horizontal Silk Strands
      ctx.fillStyle = '#e9d5ff';
      ctx.fillRect(14, 14, 20, 2);
      ctx.fillRect(12, 20, 24, 2);
      ctx.fillRect(15, 26, 18, 2);
      // Glowing spider eye slits inside cocoon
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(20, 18, 3, 2);
      ctx.fillRect(25, 18, 3, 2);
      return canvas;
    }

    if (id === 'shrine_sarcophagus') {
      // Sunken Sarcophagus of Malakor
      ctx.fillStyle = '#083344';
      ctx.fillRect(10, 8, 28, 34);
      ctx.fillStyle = '#0e7490';
      ctx.fillRect(12, 10, 24, 30);
      ctx.strokeStyle = '#155e75';
      ctx.lineWidth = 2;
      ctx.strokeRect(12, 10, 24, 30);
      // Crossbars and verdigris
      ctx.fillStyle = '#042f2e';
      ctx.fillRect(14, 16, 20, 4);
      // Rusted heavy chains
      ctx.fillStyle = '#78350f';
      ctx.fillRect(8, 22, 32, 4);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(14, 20, 3, 8);
      ctx.fillRect(31, 20, 3, 8);
      // Glowing deep-sea cyan runes
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(20, 28, 8, 3);
      ctx.fillRect(22, 33, 4, 3);
      return canvas;
    }

    if (id === 'shrine_blood_font') {
      // Crimson Blood Font of Morrigan
      ctx.fillStyle = '#4c0519';
      ctx.fillRect(8, 20, 32, 20);
      ctx.fillStyle = '#881337';
      ctx.fillRect(10, 22, 28, 16);
      // Boiling Blood Pool
      ctx.fillStyle = '#be123c';
      ctx.beginPath();
      ctx.ellipse(24, 18, 14, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.arc(24, 18, 6, 0, Math.PI * 2);
      ctx.fill();
      // Bone Candles on Left and Right
      ctx.fillStyle = '#ffe4e6';
      ctx.fillRect(10, 10, 3, 10);
      ctx.fillRect(35, 10, 3, 10);
      // Crimson Flames
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(10, 7, 3, 3);
      ctx.fillRect(35, 7, 3, 3);
      return canvas;
    }

    return canvas;
  }
}
