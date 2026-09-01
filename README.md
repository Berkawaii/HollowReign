# Hollow Reign

A high-performance, web-based cosmic horror and Lovecraftian dark fantasy horde survival roguelite engine.

Built from scratch in TypeScript and HTML5 Canvas, Hollow Reign implements a data-oriented Entity-Component-System (ECS) architecture, zero-garbage-collection object pooling, and spatial hash grid partitioning capable of simulating and rendering thousands of concurrent active entities, projectiles, and particle effects at a steady 60 frames per second directly in the browser.

* Live Deployment: https://playhollowreign.web.app
* Alternative Domain: https://playhollowreign.firebaseapp.com

---

## Technical Highlights and Architecture

### 1. Canvas2D Rendering Pipeline
* Single-context, double-buffered Canvas2D rendering loop optimized for high-density 2D bullet hell simulation.
* Frustum and viewport culling: Entities and terrain chunks outside the camera viewport bounding box are culled before draw dispatch.
* Procedural Vector & Pixel Asset Engine: Generates all character sprites, 64x64 high-detail portraits, enemies, bosses, weapon projectiles, map tiles, and UI icons at runtime via HTML5 Canvas rasterization, eliminating external asset loading latency.
* Layered composite rendering: Ground tiles, atmospheric radial vignettes, decals and pools, drops and collectibles, drop shadows, enemy wobbles, hero auras, weapon trails, shockwaves, and floating combat text are rendered in discrete depth passes.

### 2. Entity-Component-System (ECS) Architecture
The game engine decouples state from logic through discrete systems operating on flat entity arrays:

* MovementSystem: Manages directional velocity vector integration, drag, player input acceleration, knockback deceleration curves, and boundary clamping.
* CombatSystem: Resolves offensive interactions, weapon damage scaling, critical hit rolls, armor mitigation, hit invulnerability frames (i-frames), and floating combat text generation.
* CollisionSystem: Employs a 2D Spatial Hash Grid to reduce collision detection complexity from O(N^2) to amortized O(N). Efficiently evaluates broad-phase neighborhood queries and narrow-phase circle/AABB intersections for over 2,000 active enemies.
* AbilitySystem: Drives automatic weapon cooldown timers, orbital math (e.g., rotating tomes), forward projectile physics, piercing limits, dynamic melee crescent slashes, and nearest-target homing heuristics.
* PickupSystem: Manages magnetic attraction physics, gem collection ranges, vacuum pulses, and interactive world shrine detection.
* ParticleSystem: High-throughput circular object pool handling burst sparks, necrotic fluid splatters, blackfire embers, cosmic smoke, and shockwave expansions with zero heap allocations during gameplay.
* SpawnDirector: Oversees time-based procedural difficulty curves, off-screen annulus spawning rings, ambient swarm waves, and scripted boss events at 5:00, 10:00, 15:00, 25:00, and 30:00.
* RenderSystem: Coordinates camera transform translations, sprite animation squashes, visual trails, ground pools, and custom UI canvas elements.

### 3. Audio Engine (Web Audio API)
* Built on the native Web Audio API with zero external sound library dependencies.
* Dynamic Pitch Shifting: Sequential XP gem collection dynamically pitches upward to provide satisfying auditory feedback during continuous collection streaks.
* Polyphony Limiter & Ducking: Prevents audio distortion and clipping during high-density combat encounters by prioritizing sound channels and capping concurrent playback instances.

### 4. Cloud Backend & Persistence (Firebase)
* Cloud Firestore: Real-time global leaderboard (`leaderboard` collection) indexed by survival duration, level, kill count, and timestamp.
* Firebase Authentication: Anonymous authentication provides immediate, friction-free player sessions without login prompts while securing database writes.
* Security Rules (`firestore.rules`): Validates incoming payload types, constraints, and timestamps to prevent leaderboard tampering.
* Firebase Hosting: Production distribution backed by global CDN edge caching, SSL, and HTTP/2 compression.

---

## Game Systems & Content

### 1. Heroes and Archetypes
* Valerius (Abyssal Warden): Starts with Abyssal Edge. High base armor, +1 Armor every 10 levels, and a protective void barrier aura.
* Sylvia (Astral Occultist): Starts with Void Darts. High projectile speed, reduced cooldowns, +1 Projectile every 20 levels, and celestial starlight aura.
* Ignis (Blackfire Pyromancer): Starts with Blackfire Orb. High base area and might, applies burning damage over time on critical hits.
* Kaelen (Void Stalker): Starts with Obsidian Fangs. High base movement speed; gains a +40% speed surge when health falls below 30%.
* Mortimer (Necro-Alchemist): Starts with Crypt Shards. High experience gain multiplier; triggers a screen-wide necrotic shockwave every 500 kills.

### 2. Weapons and Super Evolutions
Weapons reach maximum potential when upgraded to Level 8 and combined with their matching passive item through Treasure Chests:

* Abyssal Edge + Heart of Dagon -> Blood Carver: Slices in wide crescents; heals the player on critical strikes.
* Void Darts + Tome of the Void -> Cosmic Rupture: Fires rapid void projectiles with piercing rifts.
* Obsidian Fangs + Astral Bracer -> Thousand Fangs: Fires an endless stream of obsidian daggers with zero cooldown.
* Blackfire Orb + Eldritch Grimoire -> Starfall: Rains down high-impact cosmic emerald and violet plasma meteorites.
* Tome of R'lyeh + Occult Spellbinder -> Grimoire of the Deep: Creates an impenetrable rotating barrier of whispering eldritch pages.
* Abyssal Miasma + Primordial Flesh -> Soul Leech: Expands a deadly necrotic cloud that drains vitality from nearby horrors.
* Crypt Shards: Bounces between multiple targets, fracturing on impact.
* Elder Ward: A spinning five-pointed Cthulhu star that pierces hordes and returns like a boomerang.
* Cosmic Wrath: Summons vertical void lightning strikes upon random clusters of enemies.
* Cursed Scythe: Thrown in high ballistic arcs, cleaving through aerial and ground targets.
* Ichor Flask / Primordial Slime: Shatters on the ground to create bubbling acidic slime pools that dissolve incoming waves.

### 3. World Exploration and Shrines
* Infinite Chunk-Based Map: Generates procedural basalt terrain, submerged cyclopean ruins, hydrothermal trenches, and astral void tiles.
* World Obstacles: Basalt monoliths, void meteorites, and elder steles that block projectile paths and channel horde movement.
* Interactive Shrines:
  * [Ichor Altar] Primordial Font: Sacrifice 25% current HP to permanently gain +15% Might.
  * [Relic Coffer] R'lyeh Cache: Offer 75 Gold to gain 1 instant Level Up.
  * [Void Rift] Spatial Obelisk: Offer 50 Gold to permanently gain +15% Movement Speed.
  * [Astral Well] Vitality Spring: Free interaction to fully restore Health.

### 4. Slot Machine Mystery Chests
* Bosses and elite monsters drop ancient relic chests.
* Chest opening presents a three-reel slot machine interface that calculates random rewards:
  * Single Relic: 1 weapon/passive upgrade.
  * Triple Alignment: 3 simultaneous upgrades and bonus gold.
  * Cosmic Jackpot: 5 upgrades, massive gold payout, and full heal.

### 5. Meta-Progression Shop & Achievements
* Persistent gold collected across runs can be invested in permanent character attributes (Might, Armor, Max Health, Recovery, Cooldown, Area, Speed, Duration, Amount, Revival, Reroll, Banish).
* 100% Refund System: Players can refund all invested gold at any time with zero penalty to experiment with different builds.
* Unlock Milestones: Over 14 structured achievements that unlock new heroes, weapons, passives, and stages upon completing specific in-run objectives.

### 6. Internationalization (i18n)
Full localization support with immediate in-memory language switching across 10 languages:
* English, Turkish, Spanish, German, French, Japanese, Korean, Simplified Chinese, Portuguese, and Russian.

---

## Developer and Debug Tools

Hollow Reign includes a developer console and cheat panel designed for balancing and testing. To protect public production environments, the panel is hidden by default.

### Accessing the Developer Panel:
1. URL Parameter: Append `?admin=true` to the URL:
   `https://playhollowreign.web.app/?admin=true`
   Visiting this URL persists the authorization flag in `localStorage`.
2. Browser Console: Open DevTools (`F12`) and run:
   ```javascript
   enableAdmin()
   ```
   To disable:
   ```javascript
   disableAdmin()
   ```
3. Local Environment: The panel trigger is enabled by default when running on `localhost` or `127.0.0.1`.
4. Hotkey: Press `Backquote` (`) or `F1` during gameplay to toggle the overlay.

Features available in the panel:
* Invincibility (God Mode toggle)
* Instant Level Up (+1 / +10 levels)
* Direct Gold injection (+1,000 / +10,000)
* Wave Nuke (kill all active enemies)
* Direct equipment and instant max-leveling of any weapon, evolution, or passive
* Game simulation speed multipliers (1x, 2x, 4x)
* Direct spawning of bosses, elites, shrines, and chests

---

## Project Structure

```
bullet-heaven-game/
├── public/
│   └── assets/              # Static icons, sprites, and audio assets
├── src/
│   ├── config/              # Game balance, data definitions, and configuration
│   │   ├── achievements.ts  # Milestones and unlockable conditions
│   │   ├── enemies.ts       # Enemy stat curves, archetypes, and behaviors
│   │   ├── heroes.ts        # Hero baseline stats, auras, and lore
│   │   ├── passives.ts      # Passive item upgrade tiers and modifiers
│   │   ├── shop.ts          # Permanent shop attributes, costs, and caps
│   │   ├── stages.ts        # Stage biomes, palettes, hazards, and boss schedules
│   │   └── weapons.ts       # Weapon mechanics, projectile behaviors, and evolutions
│   ├── core/                # Core engine loops and subsystems
│   │   ├── AudioEngine.ts   # Web Audio API implementation and sound synthesizers
│   │   ├── Camera.ts        # Viewport tracking, screen-to-world math, and bounds
│   │   ├── Game.ts          # Main game loop, state transitions, and frame pacing
│   │   ├── InputManager.ts  # Keyboard, mouse, touch joystick, and gamepad bindings
│   │   ├── SpatialGrid.ts   # 2D spatial hash grid broad-phase collision solver
│   │   └── WorldMap.ts      # Procedural chunk manager, obstacles, and shrines
│   ├── ecs/                 # Entity-Component-System implementation
│   │   ├── Components.ts    # Entity data structures (Player, Enemy, Projectile, Gem)
│   │   ├── EntityManager.ts # Entity life-cycle manager and object pools
│   │   └── Systems/         # Modular game systems
│   │       ├── AbilitySystem.ts
│   │       ├── CollisionSystem.ts
│   │       ├── CombatSystem.ts
│   │       ├── MovementSystem.ts
│   │       ├── ParticleSystem.ts
│   │       ├── PickupSystem.ts
│   │       ├── RenderSystem.ts
│   │       └── SpawnDirector.ts
│   ├── i18n/                # Internationalization engine and translation files
│   │   ├── index.ts
│   │   └── translations.ts
│   ├── services/            # Persistence and external integrations
│   │   ├── FirebaseService.ts # Firestore leaderboard and auth integration
│   │   └── StorageService.ts  # LocalStorage save states, achievements, and stats
│   ├── ui/                  # DOM-based modal overlays and HUD components
│   │   ├── AchievementsModal.ts
│   │   ├── AdminPanel.ts
│   │   ├── ChestModal.ts
│   │   ├── GameOverModal.ts
│   │   ├── HeroSelectModal.ts
│   │   ├── HUD.ts
│   │   ├── InventoryModal.ts
│   │   ├── LeaderboardModal.ts
│   │   ├── LevelUpModal.ts
│   │   ├── PauseModal.ts
│   │   ├── ShopModal.ts
│   │   └── UIManager.ts
│   ├── utils/               # Procedural asset generators and mathematical helpers
│   │   ├── MathUtils.ts
│   │   └── ProceduralAssets.ts
│   ├── index.css            # Tailwind CSS styling and theme definitions
│   └── main.ts              # Application bootstrap and initialization
├── firebase.json            # Firebase Hosting and Firestore configuration
├── firestore.indexes.json   # Cloud Firestore composite indexes
├── firestore.rules          # Cloud Firestore security rules
├── package.json             # NPM dependencies and project scripts
├── tsconfig.json            # TypeScript compiler configuration
└── vite.config.ts           # Vite build pipeline and dev server configuration
```

---

## Getting Started

### Prerequisites
* Node.js version 18.0.0 or higher
* NPM version 9.0.0 or higher

### Installation
Clone the repository and install project dependencies:

```bash
git clone https://github.com/Berkawaii/HollowReign.git
cd HollowReign
npm install
```

### Local Development
Start the local Vite development server with hot module replacement:

```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### Production Build
Compile TypeScript and bundle optimized production assets:

```bash
npm run build
```
Compiled output is generated in the `dist/` directory.

### Preview Production Build
Serve the production bundle locally for validation:

```bash
npm run preview
```

### Deployment to Firebase
Deploy both Firebase Hosting assets and Firestore security rules/indexes:

```bash
npx firebase-tools deploy --project playhollowreign
```

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.
