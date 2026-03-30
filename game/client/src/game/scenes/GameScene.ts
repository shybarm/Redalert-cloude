import Phaser from 'phaser'
import type { Room } from 'colyseus.js'

// ── constants ─────────────────────────────────────────────────────

const GROUND_Y = 515
const DEFENDER_X = 400
const DEFENDER_Y = 495
const INTERCEPT_RADIUS = 20
const INTERCEPTOR_SPEED = 7
const FIRE_COOLDOWN_MS = 1500
const CITY_POSITIONS = [130, 400, 670]
const CITY_MAX_HEALTH = 3

let nextEnemyId = 0

// ── types ─────────────────────────────────────────────────────────

interface Enemy {
  gfx: Phaser.GameObjects.Graphics
  id: number
  networkId?: string   // server ID in co-op mode
  x: number
  y: number
  type: 'missile' | 'drone'
  vx: number
  vy: number
  speed: number
  targetCityIndex: number
  spawnTime: number    // local time.now at spawn (for steering)
}

interface Interceptor {
  gfx: Phaser.GameObjects.Graphics
  x: number
  y: number
  fromX: number
  fromY: number
  targetEnemyId: number
  speed: number
  dead: boolean
}

interface City {
  x: number
  y: number
  health: number
  gfx: Phaser.GameObjects.Graphics
  pipGfx: Phaser.GameObjects.Graphics
}

// ── scene ─────────────────────────────────────────────────────────

export class GameScene extends Phaser.Scene {
  // state
  private enemies: Enemy[] = []
  private interceptors: Interceptor[] = []
  private cities: City[] = []
  private score = 0
  private wave = 1
  private gameOver = false
  private fireCooldown = 0

  // solo timers
  private spawnTimer = 0
  private waveTimer = 0
  private readonly WAVE_INTERVAL = 20000

  // graphics
  private defGfx!: Phaser.GameObjects.Graphics
  private cooldownGfx!: Phaser.GameObjects.Graphics
  private cursorGfx!: Phaser.GameObjects.Graphics
  private hudBg!: Phaser.GameObjects.Graphics
  private cityHudGfx!: Phaser.GameObjects.Graphics
  private partner2Gfx!: Phaser.GameObjects.Graphics

  // text
  private scoreText!: Phaser.GameObjects.Text
  private waveText!: Phaser.GameObjects.Text

  // multiplayer
  private room: Room | null = null
  private mySessionId = ''
  private serverTimeOffset = 0   // localNow - serverNow (for enemy fast-forward)
  private networkEnemyMap = new Map<string, number>() // networkId → local Enemy.id

  constructor() {
    super({ key: 'GameScene' })
  }

  // Called by GameCanvas after room is available
  setRoom(room: Room | null) {
    this.room = room
    if (room) {
      this.mySessionId = room.sessionId
      this.setupRoomListeners(room)
    }
  }

  create() {
    this.gameOver = false
    this.score = 0
    this.wave = 1
    this.fireCooldown = 0
    this.enemies = []
    this.interceptors = []
    this.spawnTimer = 0
    this.waveTimer = 0
    this.networkEnemyMap.clear()

    this.drawBackground()
    this.drawTerrain()
    this.initCities()

    this.defGfx = this.add.graphics().setDepth(3)
    this.cooldownGfx = this.add.graphics().setDepth(12)
    this.cursorGfx = this.add.graphics().setDepth(20)
    this.partner2Gfx = this.add.graphics().setDepth(3)

    this.drawDefender()
    this.createHUD()

    // Solo: spawn initial enemies immediately
    if (!this.room) {
      this.spawnEnemy('missile')
      this.spawnEnemy('drone')
    }

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onFire(p))

    // Restart key
    this.input.keyboard?.addKey('R').on('down', () => {
      if (this.gameOver) this.scene.restart()
    })
  }

  update(_t: number, delta: number) {
    if (this.gameOver) return
    const dt = delta / 16.67

    if (this.fireCooldown > 0) this.fireCooldown -= delta
    this.drawCooldownBar()
    this.updateCursor()

    if (!this.room) {
      // Solo mode: run local loop
      this.spawnTimer += delta
      this.waveTimer += delta
      this.tickWave()
      this.moveEnemies(dt)
    } else {
      // Co-op: enemies are driven by server (via schema onAdd/onRemove)
      // We still render them by updating positions with local physics
      this.moveEnemiesCoop(dt)
    }

    this.moveInterceptors(dt)

    if (!this.room && this.cities.every(c => c.health <= 0)) {
      this.doGameOver()
    }
  }

  // ── wave / spawn (solo) ───────────────────────────────────────────

  private tickWave() {
    if (this.waveTimer >= this.WAVE_INTERVAL) {
      this.waveTimer = 0
      this.wave++
      this.waveText.setText(`Wave ${this.wave}`)
      this.flashWaveBanner()
    }
    const rate = Math.max(1500, 4000 - this.wave * 300)
    if (this.spawnTimer >= rate) {
      this.spawnTimer = 0
      this.spawnEnemy(Math.random() > 0.4 ? 'missile' : 'drone')
      if (this.wave >= 3) this.spawnEnemy(Math.random() > 0.5 ? 'missile' : 'drone')
    }
  }

  private spawnEnemy(type: 'missile' | 'drone', overrides?: Partial<Enemy>): Enemy {
    const targetCityIndex = overrides?.targetCityIndex ?? Math.floor(Math.random() * 3)
    const targetX = CITY_POSITIONS[targetCityIndex]
    const gfx = this.add.graphics().setDepth(2)
    let x: number, y: number, vx: number, vy: number, speed: number

    if (type === 'missile') {
      x = overrides?.x ?? Phaser.Math.Between(30, 770)
      y = overrides?.y ?? -20
      speed = overrides?.speed ?? Phaser.Math.FloatBetween(1.5, 2.5) * (1 + this.wave * 0.08)
      const dx = targetX - x, dy = GROUND_Y - y
      const dist = Math.sqrt(dx * dx + dy * dy)
      vx = overrides?.vx ?? (dx / dist) * speed * 0.8
      vy = overrides?.vy ?? (dy / dist) * speed
    } else {
      const fromLeft = (overrides?.vx ?? 1) > 0
      x = overrides?.x ?? (fromLeft ? -30 : 830)
      y = overrides?.y ?? Phaser.Math.Between(80, 350)
      speed = overrides?.speed ?? Phaser.Math.FloatBetween(1.2, 2.0) * (1 + this.wave * 0.08)
      const dx = targetX - x, dy = GROUND_Y - y
      const dist = Math.sqrt(dx * dx + dy * dy)
      vx = overrides?.vx ?? (dx / dist) * speed
      vy = overrides?.vy ?? (dy / dist) * speed * 0.3
    }

    const e: Enemy = {
      gfx, id: nextEnemyId++,
      networkId: overrides?.networkId,
      x, y, type, vx, vy, speed, targetCityIndex,
      spawnTime: this.time.now,
    }

    // Fast-forward if spawning late (co-op)
    if (overrides?.spawnTime !== undefined) {
      const elapsed = (this.time.now - overrides.spawnTime) / 16.67
      e.x += e.vx * elapsed
      e.y += e.vy * elapsed
    }

    this.enemies.push(e)
    return e
  }

  // ── enemy movement ────────────────────────────────────────────────

  private moveEnemies(dt: number) {
    const dead: Enemy[] = []
    for (const e of this.enemies) {
      this.steerMissile(e, dt)
      e.x += e.vx * dt
      e.y += e.vy * dt
      this.renderEnemy(e)

      if (e.y >= GROUND_Y) {
        this.explode(e.x, GROUND_Y, 0xff4400, 35)
        this.damageCityNear(e.x)
        this.cameras.main.shake(200, 0.008)
        dead.push(e)
      } else if (e.x < -80 || e.x > 880) {
        dead.push(e)
      }
    }
    this.removeEnemies(dead)
  }

  private moveEnemiesCoop(dt: number) {
    // Same physics, but enemies come from server; no local spawn
    const dead: Enemy[] = []
    for (const e of this.enemies) {
      this.steerMissile(e, dt)
      e.x += e.vx * dt
      e.y += e.vy * dt
      this.renderEnemy(e)
      if (e.y >= GROUND_Y || e.x < -80 || e.x > 880) {
        dead.push(e)
      }
    }
    this.removeEnemies(dead)
  }

  private steerMissile(e: Enemy, dt: number) {
    if (e.type !== 'missile') return
    const targetX = CITY_POSITIONS[e.targetCityIndex]
    const dx = targetX - e.x
    // Gentle horizontal correction only
    e.vx += Math.sign(dx) * 0.015 * dt
    e.vx = Phaser.Math.Clamp(e.vx, -3, 3)
  }

  // ── interceptors ──────────────────────────────────────────────────

  private moveInterceptors(dt: number) {
    const deadIcp: Interceptor[] = []
    const deadEnemies: Enemy[] = []

    for (const icp of this.interceptors) {
      if (icp.dead) { deadIcp.push(icp); continue }

      const target = this.enemies.find(e => e.id === icp.targetEnemyId)
      if (!target) {
        // Target already gone (server removed it) — fizzle
        icp.dead = true
        deadIcp.push(icp)
        continue
      }

      const dx = target.x - icp.x
      const dy = target.y - icp.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      icp.x += (dx / dist) * icp.speed * dt
      icp.y += (dy / dist) * icp.speed * dt

      icp.gfx.clear()
      this.renderInterceptor(icp, target.x, target.y)

      if (dist < INTERCEPT_RADIUS) {
        // HIT
        this.interceptEffect(target.x, target.y)
        deadEnemies.push(target)
        deadIcp.push(icp)
        if (!this.room) {
          // Solo: award points locally
          this.score += target.type === 'missile' ? 10 : 15
          this.scoreText.setText(`Score: ${this.score}`)
        }
      }

      // Self-destruct if overshot
      if (target.y >= GROUND_Y) {
        deadIcp.push(icp)
      }
    }

    this.removeEnemies(deadEnemies)
    this.removeInterceptors(deadIcp)
  }

  private launchInterceptor(target: Enemy) {
    const gfx = this.add.graphics().setDepth(7)
    this.interceptors.push({
      gfx,
      x: DEFENDER_X,
      y: DEFENDER_Y - 32,
      fromX: DEFENDER_X,
      fromY: DEFENDER_Y - 32,
      targetEnemyId: target.id,
      speed: INTERCEPTOR_SPEED,
      dead: false,
    })
    // Muzzle flash
    const flash = this.add.graphics().setDepth(8)
    flash.fillStyle(0xaaffaa, 0.9)
    flash.fillCircle(DEFENDER_X, DEFENDER_Y - 32, 9)
    this.tweens.add({ targets: flash, alpha: 0, duration: 120, onComplete: () => flash.destroy() })
  }

  // ── player fire ───────────────────────────────────────────────────

  private onFire(ptr: Phaser.Input.Pointer) {
    if (this.gameOver || this.fireCooldown > 0) return

    let best: Enemy | null = null
    let bestD = 160
    for (const e of this.enemies) {
      const d = Phaser.Math.Distance.Between(ptr.x, ptr.y, e.x, e.y)
      if (d < bestD) { bestD = d; best = e }
    }
    if (!best) return

    this.fireCooldown = FIRE_COOLDOWN_MS
    this.launchInterceptor(best)

    if (this.room) {
      // Co-op: tell server
      this.room.send('fire', {
        enemyId: best.networkId ?? String(best.id),
        interceptX: best.x,
        interceptY: best.y,
      })
    }
  }

  // ── multiplayer listeners ─────────────────────────────────────────

  private setupRoomListeners(room: Room) {
    // Clock sync
    room.onMessage('pong', (data: { serverTime: number }) => {
      this.serverTimeOffset = this.time.now - data.serverTime
    })

    // Enemy spawned on server → add locally
    room.state.enemies.onAdd = (es: any, networkId: string) => {
      const localSpawnTime = es.spawnTime + this.serverTimeOffset
      const e = this.spawnEnemy(es.type as 'missile' | 'drone', {
        x: es.x, y: es.y, vx: es.vx, vy: es.vy,
        targetCityIndex: es.targetCityIndex,
        spawnTime: localSpawnTime,
        networkId,
        speed: Math.sqrt(es.vx * es.vx + es.vy * es.vy),
      })
      this.networkEnemyMap.set(networkId, e.id)
    }

    // Enemy removed by server (killed by partner or hit ground)
    room.state.enemies.onRemove = (_: any, networkId: string) => {
      const localId = this.networkEnemyMap.get(networkId)
      if (localId !== undefined) {
        const e = this.enemies.find(e => e.id === localId)
        if (e) {
          this.enemies.splice(this.enemies.indexOf(e), 1)
          e.gfx.destroy()
        }
        // Also mark any flying interceptor for this enemy as done
        const icp = this.interceptors.find(i => i.targetEnemyId === localId)
        if (icp) icp.dead = true
        this.networkEnemyMap.delete(networkId)
      }
    }

    // Kill confirmed by server → score update + effect
    room.onMessage('kill', (data: { enemyId: string; x: number; y: number; killedBy: string; score: number }) => {
      if (data.killedBy === this.mySessionId) {
        this.score = data.score
        this.scoreText.setText(`Score: ${this.score}`)
      } else {
        // Partner's kill — show effect at their intercept position
        this.interceptEffect(data.x, data.y)
      }
    })

    // Ground strike → explosion effect (city health comes from cityDamaged)
    room.onMessage('groundStrike', (data: { enemyId: string; x: number; y: number }) => {
      this.explode(data.x, data.y, 0xff4400, 35)
      this.cameras.main.shake(200, 0.008)
    })

    // City HP update from server
    room.onMessage('cityDamaged', (data: { index: number; health: number }) => {
      const city = this.cities[data.index]
      if (city) {
        city.health = data.health
        this.renderCity(city)
      }
    })

    // Wave increment
    room.onMessage('waveStart', (data: { wave: number }) => {
      this.wave = data.wave
      this.waveText.setText(`Wave ${this.wave}`)
      this.flashWaveBanner()
    })

    // Partner defender position
    room.state.players.onChange = (player: any, sessionId: string) => {
      if (sessionId !== this.mySessionId) {
        this.drawPartnerDefender(player.defX)
      }
    }

    // Game over from server
    room.onMessage('gameOver', () => {
      this.doGameOver()
    })

    // Request clock sync
    room.send('ping')
  }

  // ── city ──────────────────────────────────────────────────────────

  private damageCityNear(x: number) {
    let closest = 0, minD = 999
    CITY_POSITIONS.forEach((cx, i) => {
      const d = Math.abs(cx - x)
      if (d < minD) { minD = d; closest = i }
    })
    if (minD < 140 && this.cities[closest].health > 0) {
      this.cities[closest].health--
      this.renderCity(this.cities[closest])
    }
  }

  // ── game over ─────────────────────────────────────────────────────

  private doGameOver() {
    if (this.gameOver) return
    this.gameOver = true
    this.cameras.main.shake(400, 0.012)

    const ov = this.add.graphics().setDepth(30)
    ov.fillStyle(0x000000, 0.72)
    ov.fillRect(0, 0, 800, 600)

    this.add.text(400, 200, 'GAME OVER', {
      fontSize: '56px', color: '#ff2222', fontFamily: 'monospace', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(31)

    this.add.text(400, 290, `Score: ${this.score}`, {
      fontSize: '30px', color: '#ffdd44', fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(31)

    this.add.text(400, 350, `Wave: ${this.wave}`, {
      fontSize: '22px', color: '#aaaaff', fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(31)

    this.add.text(400, 440, 'Press R to play again', {
      fontSize: '18px', color: '#00ffaa', fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(31)
  }

  // ── rendering ─────────────────────────────────────────────────────

  private renderEnemy(e: Enemy) {
    e.gfx.clear()
    if (e.type === 'missile') this.renderMissile(e)
    else this.renderDrone(e)
  }

  private renderMissile(e: Enemy) {
    const { gfx: g, x, y } = e
    // Trail
    g.fillStyle(0xff6600, 0.22)
    g.fillRect(x - 3, y - 26, 6, 24)
    g.fillStyle(0xff8800, 0.12)
    g.fillRect(x - 5, y - 40, 10, 18)
    // Body
    g.fillStyle(0xccddee)
    g.fillRect(x - 3.5, y, 7, 20)
    // 3D right face
    g.fillStyle(0x8899aa)
    g.fillPoints([
      { x: x + 3.5, y }, { x: x + 3.5, y: y + 20 },
      { x: x + 6, y: y + 18 }, { x: x + 6, y: y + 2 },
    ], true)
    // Nose
    g.fillStyle(0xff3333)
    g.fillTriangle(x - 3.5, y, x + 3.5, y, x, y - 10)
    // Fins
    g.fillStyle(0x9aacbe)
    g.fillTriangle(x - 3.5, y + 16, x - 9, y + 20, x - 3.5, y + 20)
    g.fillTriangle(x + 3.5, y + 16, x + 9, y + 20, x + 3.5, y + 20)
  }

  private renderDrone(e: Enemy) {
    const { gfx: g, x, y } = e
    const dir = e.vx >= 0 ? 1 : -1
    g.fillStyle(0x000000, 0.15)
    g.fillEllipse(x, GROUND_Y - 2, 28, 7)
    g.fillStyle(0x445566)
    g.fillEllipse(x, y, 28, 12)
    g.fillStyle(0x5a6a7a)
    g.fillEllipse(x, y - 4, 24, 8)
    ;[[-14, -3], [14, -3], [-10, 3], [10, 3]].forEach(([rx, ry]) => {
      g.fillStyle(0x778899, 0.8)
      g.fillEllipse(x + rx * dir, y + ry, 10, 4)
    })
    g.fillStyle(0xff2222)
    g.fillCircle(x + dir * 8, y, 3)
    g.fillStyle(0x333344)
    g.fillRect(x - 5, y + 4, 10, 6)
  }

  private renderInterceptor(icp: Interceptor, tx: number, ty: number) {
    const g = icp.gfx
    const angle = Math.atan2(ty - icp.y, tx - icp.x)
    // Smoke trail from launch point
    g.lineStyle(1, 0x88ffcc, 0.3)
    g.lineBetween(icp.fromX, icp.fromY, icp.x, icp.y)
    // Moving dot
    g.fillStyle(0xaaffee, 0.95)
    g.fillCircle(icp.x, icp.y, 3.5)
    g.fillStyle(0x44ffaa, 0.4)
    g.fillCircle(icp.x, icp.y, 6)
    // Forward glow in direction of travel
    const nx = Math.cos(angle) * 6, ny = Math.sin(angle) * 6
    g.fillStyle(0xffffff, 0.7)
    g.fillCircle(icp.x + nx, icp.y + ny, 2)
  }

  private interceptEffect(x: number, y: number) {
    const g = this.add.graphics().setDepth(8)
    g.fillStyle(0x44aaff, 0.9)
    g.fillCircle(x, y, 24)
    g.fillStyle(0xaaddff, 1)
    g.fillCircle(x, y, 14)
    g.fillStyle(0xffffff, 1)
    g.fillCircle(x, y, 6)
    g.lineStyle(1.5, 0x88ccff, 0.7)
    for (let a = 0; a < 8; a++) {
      const ang = (a / 8) * Math.PI * 2
      g.lineBetween(x, y, x + Math.cos(ang) * 30, y + Math.sin(ang) * 30)
    }
    this.tweens.add({
      targets: g, alpha: 0, scaleX: 1.9, scaleY: 1.9,
      duration: 380, ease: 'Quad.Out',
      onComplete: () => g.destroy()
    })
  }

  private explode(x: number, y: number, color: number, size: number) {
    const g = this.add.graphics().setDepth(5)
    g.fillStyle(color, 0.65)
    g.fillCircle(x, y, size)
    g.fillStyle(0xff8800, 0.8)
    g.fillCircle(x, y, size * 0.65)
    g.fillStyle(0xffee00, 0.9)
    g.fillCircle(x, y, size * 0.38)
    g.fillStyle(0xffffff, 1)
    g.fillCircle(x, y, size * 0.16)
    const ring = this.add.graphics().setDepth(5)
    ring.lineStyle(2, 0xff8800, 0.8)
    ring.strokeCircle(x, y, size * 0.55)
    this.tweens.add({
      targets: [g, ring], alpha: 0, scaleX: 2.2, scaleY: 2.2,
      duration: 450, ease: 'Quad.Out',
      onComplete: () => { g.destroy(); ring.destroy() }
    })
  }

  private drawCooldownBar() {
    this.cooldownGfx.clear()
    const pct = Math.max(0, 1 - this.fireCooldown / FIRE_COOLDOWN_MS)
    const bx = DEFENDER_X - 22, by = DEFENDER_Y + 18
    this.cooldownGfx.fillStyle(0x222222, 0.8)
    this.cooldownGfx.fillRect(bx, by, 44, 5)
    const color = pct >= 1 ? 0x00ffaa : pct > 0.5 ? 0xffdd00 : 0xff6600
    this.cooldownGfx.fillStyle(color)
    this.cooldownGfx.fillRect(bx, by, 44 * pct, 5)
    // Ready indicator dot
    if (pct >= 1) {
      this.cooldownGfx.fillStyle(0x00ffaa, 0.9)
      this.cooldownGfx.fillCircle(DEFENDER_X, by - 8, 4)
    }
  }

  private updateCursor() {
    this.cursorGfx.clear()
    if (this.gameOver) return
    const ptr = this.input.activePointer

    let best: Enemy | null = null, bestD = 160
    for (const e of this.enemies) {
      const d = Phaser.Math.Distance.Between(ptr.x, ptr.y, e.x, e.y)
      if (d < bestD) { bestD = d; best = e }
    }

    if (best) {
      const ready = this.fireCooldown <= 0
      const col = ready ? 0x00ffaa : 0xff8800
      this.cursorGfx.lineStyle(1.5, col, 0.85)
      this.cursorGfx.strokeCircle(best.x, best.y, 18)
      // Crosshair ticks
      ;[0, Math.PI / 2, Math.PI, 3 * Math.PI / 2].forEach(a => {
        const cx = best!.x + Math.cos(a)
        const cy = best!.y + Math.sin(a)
        this.cursorGfx.lineBetween(
          cx + Math.cos(a) * 10, cy + Math.sin(a) * 10,
          cx + Math.cos(a) * 24, cy + Math.sin(a) * 24
        )
      })
      // Faint targeting line from defender
      if (ready) {
        this.cursorGfx.lineStyle(1, 0x44ffaa, 0.2)
        this.cursorGfx.lineBetween(DEFENDER_X, DEFENDER_Y - 32, best.x, best.y)
      }
    }
  }

  private drawPartnerDefender(x: number) {
    this.partner2Gfx.clear()
    const y = DEFENDER_Y
    this.partner2Gfx.fillStyle(0x3a3a8a, 0.85)
    this.partner2Gfx.fillRect(x - 18, y - 4, 36, 10)
    this.partner2Gfx.fillStyle(0x5555aa)
    this.partner2Gfx.fillRect(x - 3, y - 28, 6, 26)
    this.partner2Gfx.fillStyle(0x88aaff)
    this.partner2Gfx.fillCircle(x, y - 30, 5)
    // "P2" tag
    this.partner2Gfx.fillStyle(0x4488ff)
    this.partner2Gfx.fillCircle(x, y - 44, 4)
  }

  // ── background / terrain (unchanged) ─────────────────────────────

  private drawBackground() {
    const g = this.add.graphics()
    const skyColors = [0x020510, 0x040a1a, 0x071020, 0x0a1828, 0x0d2035, 0x132840]
    skyColors.forEach((c, i) => { g.fillStyle(c); g.fillRect(0, i * 80, 800, 80) })
    g.fillStyle(0xffffff)
    const rng = new Phaser.Math.RandomDataGenerator(['seed42'])
    for (let i = 0; i < 60; i++) {
      g.fillRect(rng.integerInRange(0, 799), rng.integerInRange(0, 460), 1, 1)
    }
  }

  private drawTerrain() {
    const g = this.add.graphics()
    g.fillStyle(0x1a3a50, 0.4); g.fillRect(0, 490, 800, 30)
    g.fillStyle(0x2a5a18); g.fillRect(0, 510, 800, 90)
    g.fillStyle(0x3a7a22); g.fillRect(0, 508, 800, 4)
    g.fillStyle(0x3a3a2a); g.fillRect(0, 530, 800, 8)
    g.fillStyle(0xaaaa44)
    for (let x = 0; x < 800; x += 40) g.fillRect(x, 533, 20, 2)
  }

  private initCities() {
    this.cities = []
    for (const cx of CITY_POSITIONS) {
      const city: City = {
        x: cx, y: 508, health: CITY_MAX_HEALTH,
        gfx: this.add.graphics().setDepth(1),
        pipGfx: this.add.graphics().setDepth(2),
      }
      this.cities.push(city)
      this.renderCity(city)
    }
  }

  private renderCity(city: City) {
    city.gfx.clear()
    city.pipGfx.clear()
    const { x, y, health } = city
    const alpha = health > 0 ? 1 : 0.35

    const buildings = [{ ox: -28, w: 22, h: 32 }, { ox: -4, w: 28, h: 45 }, { ox: 26, w: 20, h: 28 }]
    buildings.forEach(b => {
      const bx = x + b.ox, by = y - b.h
      city.gfx.fillStyle(0x000000, 0.35 * alpha)
      city.gfx.fillRect(bx + 4, by + 4, b.w, b.h)
      const fc = health === 3 ? 0x4a6a9a : health === 2 ? 0x6a5a3a : 0x5a3a3a
      city.gfx.fillStyle(fc, alpha); city.gfx.fillRect(bx, by, b.w, b.h)
      const tc = health === 3 ? 0x6a8aba : health === 2 ? 0x8a7a5a : 0x7a5a5a
      city.gfx.fillStyle(tc, alpha)
      city.gfx.fillPoints([{ x: bx, y: by }, { x: bx + b.w, y: by }, { x: bx + b.w + 6, y: by - 6 }, { x: bx + 6, y: by - 6 }], true)
      city.gfx.fillStyle(0x2a3a5a, alpha)
      city.gfx.fillPoints([{ x: bx + b.w, y: by }, { x: bx + b.w, y: by + b.h }, { x: bx + b.w + 6, y: by + b.h - 6 }, { x: bx + b.w + 6, y: by - 6 }], true)
      if (health > 0) {
        city.gfx.fillStyle(0xffff88, 0.8)
        for (let row = 0; row < 3; row++)
          for (let col = 0; col < 2; col++)
            city.gfx.fillRect(bx + 4 + col * 9, by + 5 + row * 9, 4, 5)
      }
    })

    // Health pips above city
    for (let i = 0; i < CITY_MAX_HEALTH; i++) {
      const filled = i < health
      const pipColor = i === 0 ? 0xff2200 : i === 1 ? 0xffaa00 : 0x00ff44
      city.pipGfx.fillStyle(filled ? pipColor : 0x333333)
      city.pipGfx.fillRect(x - 10 + i * 12, y - 58, 8, 8)
      if (filled) {
        city.pipGfx.lineStyle(1, 0xffffff, 0.4)
        city.pipGfx.strokeRect(x - 10 + i * 12, y - 58, 8, 8)
      }
    }
  }

  private drawDefender() {
    this.defGfx.clear()
    const x = DEFENDER_X, y = DEFENDER_Y
    this.defGfx.fillStyle(0x000000, 0.3); this.defGfx.fillEllipse(x, y + 10, 55, 10)
    this.defGfx.fillStyle(0x1a2a1a); this.defGfx.fillRect(x - 22, y + 3, 44, 8)
    this.defGfx.fillStyle(0x2a3a2a)
    for (let i = 0; i < 5; i++) this.defGfx.fillRect(x - 20 + i * 9, y + 2, 6, 10)
    this.defGfx.fillStyle(0x3a6a3a); this.defGfx.fillRect(x - 18, y - 4, 36, 10)
    this.defGfx.fillStyle(0x4a8a4a)
    this.defGfx.fillPoints([{ x: x - 18, y: y - 4 }, { x: x + 18, y: y - 4 }, { x: x + 22, y: y - 8 }, { x: x - 14, y: y - 8 }], true)
    this.defGfx.fillStyle(0x2a5a2a); this.defGfx.fillRect(x - 3, y - 28, 6, 26)
    this.defGfx.fillStyle(0x3a7a3a)
    this.defGfx.fillPoints([{ x: x - 3, y: y - 28 }, { x: x + 3, y: y - 28 }, { x: x + 5, y: y - 30 }, { x: x - 1, y: y - 30 }], true)
    this.defGfx.fillStyle(0x88cc88); this.defGfx.fillCircle(x, y - 30, 5)
    this.defGfx.fillStyle(0xaaffaa); this.defGfx.fillCircle(x, y - 30, 3)
    this.defGfx.fillStyle(0x7a9a7a); this.defGfx.fillEllipse(x + 14, y - 8, 12, 8)
  }

  // ── HUD ───────────────────────────────────────────────────────────

  private createHUD() {
    this.hudBg = this.add.graphics().setDepth(10)
    this.hudBg.fillStyle(0x000000, 0.62)
    this.hudBg.fillRect(0, 0, 800, 40)

    this.scoreText = this.add.text(12, 10, 'Score: 0', {
      fontSize: '16px', color: '#00ffaa', fontFamily: 'monospace', fontStyle: 'bold'
    }).setDepth(11)

    this.add.text(400, 10, 'IRON SHIELD', {
      fontSize: '18px', color: '#ffdd44', fontFamily: 'monospace', fontStyle: 'bold'
    }).setOrigin(0.5, 0).setDepth(11)

    this.waveText = this.add.text(788, 10, 'Wave 1', {
      fontSize: '16px', color: '#ff8844', fontFamily: 'monospace', fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(11)

    this.add.text(400, 572, 'CLICK an enemy to intercept  •  R = restart', {
      fontSize: '11px', color: '#556677', fontFamily: 'monospace'
    }).setOrigin(0.5, 0).setDepth(11)

    this.cityHudGfx = this.add.graphics().setDepth(11)
  }

  private flashWaveBanner() {
    const txt = this.add.text(400, 300, `WAVE ${this.wave}`, {
      fontSize: '52px', color: '#ff8844', fontFamily: 'monospace', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(25).setAlpha(0)
    this.tweens.add({
      targets: txt, alpha: { from: 0, to: 1 },
      duration: 280, yoyo: true, hold: 700,
      onComplete: () => txt.destroy()
    })
  }

  // ── cleanup ───────────────────────────────────────────────────────

  private removeEnemies(dead: Enemy[]) {
    for (const e of dead) {
      const idx = this.enemies.indexOf(e)
      if (idx !== -1) this.enemies.splice(idx, 1)
      e.gfx.destroy()
      if (e.networkId) this.networkEnemyMap.delete(e.networkId)
    }
  }

  private removeInterceptors(dead: Interceptor[]) {
    for (const icp of dead) {
      const idx = this.interceptors.indexOf(icp)
      if (idx !== -1) this.interceptors.splice(idx, 1)
      icp.gfx.destroy()
    }
  }
}
