# Tank Battle 3D - Game Specification

## Project Overview
- **Name**: Tank Battle 3D
- **Type**: 3D Action Game
- **Core Functionality**: Player controls a customizable tank, battles NPCs/enemies, earns points and unlocks new weapons
- **Target Users**: Casual gamers who enjoy action and strategy games

## Visual & Rendering Specification

### Scene Setup
- **Camera**: Third-person follow camera with smooth tracking
- **Lighting**:
  - Ambient light (soft blue-gray, intensity 0.4)
  - Directional light (sun-like, warm white, intensity 1.0, casting shadows)
  - Point lights on explosions (orange/red, dynamic)
- **Environment**:
  - Ground plane with grid texture (dark military green tones)
  - Skybox with gradient (dark blue to gray)
  - Fog for depth (matching sky colors)

### Materials & Effects
- **Tank Materials**:
  - Hull: Metallic PBR with roughness 0.6
  - Turret: Slightly darker metallic
  - Tracks: Dark rubber-like material
- **Projectiles**:
  - Standard bullet: Small emissive sphere (yellow/orange glow)
  - Missile: Elongated with smoke trail particle effect
  - Laser: Thin beam with additive blending
- **Explosions**: Particle system with orange/red/yellow colors, expanding rings
- **Post-processing**: Subtle bloom for projectiles and explosions

### 3D Assets (Procedural)
- Tank: Built from primitive geometries (boxes, cylinders)
- Enemies: Similar tank models with red accent colors
- Ground: Large plane with subtle grid pattern
- Obstacles: Concrete barriers, metal crates (destructible)

### Color Palette
- Primary: Military green (#2d4a2d)
- Secondary: Dark gray (#1a1a1a)
- Accent Player: Gold/Yellow (#d4a017)
- Accent Enemy: Crimson (#8b0000)
- UI: Dark semi-transparent panels with cyan accents (#00ffff)

## Simulation Specification

### Physics
- **Type**: Simplified rigid body with custom collision
- **Tank Movement**:
  - Forward/backward with acceleration/deceleration
  - Rotation speed depends on current velocity
  - Max speed: 15 units/sec
- **Projectiles**:
  - Bullet: 50 units/sec, no gravity
  - Missile: 30 units/sec, slight arc trajectory
  - Laser: Instant hit, no travel time
- **Collision Detection**: AABB for tanks, sphere for projectiles
- **Performance Target**: 60 FPS, up to 20 tanks on screen

### Game Parameters
- **Arena Size**: 200x200 units
- **Spawn Zones**: Corners for enemies, center for player
- **Respawn**: 3 second delay after destruction

## Interaction Specification

### Controls
- **Movement**: WASD or Arrow keys
- **Aim**: Mouse movement (tank turret follows cursor)
- **Fire**: Left mouse button (hold for continuous fire with cooldown)
- **Weapon Select**: Number keys 1-5 or scroll wheel
- **Pause**: ESC or P key

### Equipment System
Each tank can equip:
1. **Primary Weapon** (always equipped):
   - Machine Gun (fast fire, low damage)
   - Cannon (slow fire, high damage, small AoE)
   - Laser (instant hit, medium damage)

2. **Secondary Weapon** (unlockable):
   - Missile Launcher (homing projectiles)
   - Railgun (piercing through multiple enemies)
   - Flamethrower (close range, DoT)

3. **Passive Upgrades**:
   - Armor Plating (reduce damage taken)
   - Speed Boost (faster movement)
   - Rapid Fire (faster cooldown)

### Equipment Stats
| Weapon | Damage | Fire Rate | Ammo | Unlock Cost |
|--------|--------|-----------|------|-------------|
| Machine Gun | 5 | 0.1s | Infinite | Default |
| Cannon | 40 | 1.5s | 20 | 500 pts |
| Laser | 15 | 0.5s | 50 | 300 pts |
| Missile | 60 | 2.0s | 10 | 1000 pts |
| Railgun | 25 | 3.0s | 5 | 2000 pts |
| Flamethrower | 3/tick | 0.05s | 100 | 750 pts |

### NPC Behavior
- **Patrol**: Move in random patterns within territory
- **Aggro**: Chase player within 50 unit radius
- **Attack**: Fire at player when in range (30 units)
- **Difficulty Scaling**: NPCs get +10% damage per wave

### Enemy Types
1. **Scout**: Fast, low HP, low damage
2. **Soldier**: Medium stats
3. **Heavy**: Slow, high HP, high damage

## UI Specification

### HUD Elements
- **Health Bar**: Top-left, horizontal bar with numeric display
- **Ammo Counter**: Below health bar
- **Score Display**: Top-right corner
- **Wave Counter**: Below score
- **Weapon Slots**: Bottom center, showing equipped weapons
- **Minimap**: Bottom-right, showing nearby enemies

### Customization Menu
- **Access**: Press TAB or click loadout button
- **Layout**:
  - Left panel: Current loadout display
  - Center: Available weapons list with stats
  - Right: Purchase/unlock buttons
- **Preview**: 3D model preview that rotates slowly

### Game States
1. **Main Menu**: Title, Start Game, Customize, Settings
2. **Playing**: Active gameplay with HUD
3. **Paused**: Overlay menu with Resume/Quit
4. **Game Over**: Final score, Restart button

## Audio (Optional Visual Feedback)
- Muzzle flash on fire (emissive burst)
- Screen shake on taking damage
- UI sound indicators (not implemented in v1)

## Acceptance Criteria

### Core Gameplay
- [ ] Player tank moves smoothly with WASD
- [ ] Turret rotates to follow mouse cursor
- [ ] Player can fire equipped weapons
- [ ] At least 3 enemy types spawn in waves
- [ ] Enemies patrol, chase, and attack player
- [ ] Collision detection works for all entities
- [ ] Score increases when enemies are destroyed
- [ ] Health depletes when hit, game over at 0

### Equipment System
- [ ] Player starts with machine gun equipped
- [ ] Customization menu opens with TAB
- [ ] Player can purchase new weapons with points
- [ ] Purchased weapons are available in loadout
- [ ] Weapon switching works during gameplay

### UI/UX
- [ ] HUD displays health, ammo, score, wave
- [ ] Minimap shows enemy positions
- [ ] Game over screen shows final score
- [ ] Restart returns to initial state

### Visual Quality
- [ ] Tanks render with metallic materials
- [ ] Projectiles have emissive glow
- [ ] Explosions use particle effects
- [ ] Camera follows player smoothly
- [ ] Consistent military-themed color palette

### Performance
- [ ] Maintains 60 FPS with 15+ enemies
- [ ] No memory leaks during extended play
- [ ] Responsive controls (< 50ms input lag)