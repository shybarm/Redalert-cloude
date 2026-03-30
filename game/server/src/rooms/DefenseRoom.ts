import { Room, Client } from 'colyseus'
import { RoomState, PlayerState, EnemyState, CityState } from './DefenseRoomState'

const CITY_POSITIONS = [130, 400, 670]
const GROUND_Y = 515
const COOLDOWN_MS = 1500
const WAVE_INTERVAL_MS = 20000

interface ServerEnemy {
  id: string
  type: 'missile' | 'drone'
  x: number
  y: number
  vx: number
  vy: number
  targetCityIndex: number
  spawnTime: number
  speed: number
}

let nextEnemyId = 0

export class DefenseRoom extends Room<RoomState> {
  maxClients = 2

  private serverEnemies = new Map<string, ServerEnemy>()
  private playerCooldowns = new Map<string, number>()
  private spawnTimer = 0
  private waveTimer = 0
  private groundCheckInterval: ReturnType<typeof setInterval> | null = null
  private spawnInterval: ReturnType<typeof setInterval> | null = null

  onCreate(options: { mode?: string }) {
    this.setState(new RoomState())
    this.initCities()

    this.onMessage('fire', (client: Client, data: { enemyId: string; interceptX: number; interceptY: number }) => {
      this.handleFire(client, data)
    })

    this.onMessage('ping', (client: Client) => {
      client.send('pong', { serverTime: this.clock.currentTime })
    })

    // Solo mode: start immediately
    if (options.mode === 'solo') {
      this.maxClients = 1
      this.startGame()
    }
  }

  onJoin(client: Client) {
    const p = new PlayerState()
    p.sessionId = client.sessionId
    p.defX = this.clients.length === 1 ? 300 : 500
    this.state.players.set(client.sessionId, p)
    this.playerCooldowns.set(client.sessionId, 0)

    console.log(`[Room] ${client.sessionId} joined (${this.clients.length}/${this.maxClients})`)
    client.send('pong', { serverTime: this.clock.currentTime })

    if (this.clients.length === 2 && this.state.phase === 'lobby') {
      this.startGame()
    } else if (this.state.phase === 'playing') {
      // Late-join: send current enemy state (already in schema)
      client.send('lateJoin', { serverTime: this.clock.currentTime })
    }
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId)
    this.playerCooldowns.delete(client.sessionId)
    console.log(`[Room] ${client.sessionId} left`)
    if (this.state.phase === 'playing') {
      // Partner left — end game
      this.endGame()
    }
  }

  onDispose() {
    if (this.spawnInterval) clearInterval(this.spawnInterval)
    if (this.groundCheckInterval) clearInterval(this.groundCheckInterval)
  }

  // ── game lifecycle ────────────────────────────────────────────────

  private initCities() {
    for (let i = 0; i < 3; i++) {
      const c = new CityState()
      c.index = i
      c.health = 3
      this.state.cities.push(c)
    }
  }

  private startGame() {
    this.state.phase = 'playing'
    this.broadcast('gameStart', { serverTime: this.clock.currentTime })

    const spawnTick = () => {
      if (this.state.phase !== 'playing') return
      this.spawnTimer += 500
      this.waveTimer += 500

      if (this.waveTimer >= WAVE_INTERVAL_MS) {
        this.waveTimer = 0
        this.state.wave++
        this.broadcast('waveStart', { wave: this.state.wave })
      }

      const spawnRate = Math.max(1500, 4000 - this.state.wave * 300)
      if (this.spawnTimer >= spawnRate) {
        this.spawnTimer = 0
        this.spawnEnemy(Math.random() > 0.4 ? 'missile' : 'drone')
        if (this.state.wave >= 3) {
          this.spawnEnemy(Math.random() > 0.5 ? 'missile' : 'drone')
        }
      }
    }

    const groundTick = () => {
      if (this.state.phase !== 'playing') return
      const now = this.clock.currentTime
      const toRemove: string[] = []

      for (const [id, e] of this.serverEnemies) {
        const elapsed = (now - e.spawnTime) / 16.67
        const predictedY = e.y + e.vy * elapsed

        if (predictedY >= GROUND_Y) {
          const predictedX = e.x + e.vx * elapsed
          this.broadcast('groundStrike', { enemyId: id, x: predictedX, y: GROUND_Y })
          this.damageCityNear(predictedX)
          toRemove.push(id)
        } else if (e.x + e.vx * elapsed < -80 || e.x + e.vx * elapsed > 880) {
          toRemove.push(id)
        }
      }

      toRemove.forEach(id => {
        this.serverEnemies.delete(id)
        this.state.enemies.delete(id)
      })

      if (this.state.cities.every(c => c.health <= 0)) {
        this.endGame()
      }
    }

    this.spawnInterval = setInterval(spawnTick, 500)
    this.groundCheckInterval = setInterval(groundTick, 500)

    // Spawn first two immediately
    this.spawnEnemy('missile')
    this.spawnEnemy('drone')
  }

  private endGame() {
    this.state.phase = 'gameover'
    if (this.spawnInterval) { clearInterval(this.spawnInterval); this.spawnInterval = null }
    if (this.groundCheckInterval) { clearInterval(this.groundCheckInterval); this.groundCheckInterval = null }
    this.broadcast('gameOver', {})
  }

  // ── spawning ─────────────────────────────────────────────────────

  private spawnEnemy(type: 'missile' | 'drone') {
    const targetCityIndex = Math.floor(Math.random() * 3)
    const targetX = CITY_POSITIONS[targetCityIndex]
    const id = String(nextEnemyId++)
    const spawnTime = this.clock.currentTime

    let x: number, y: number, vx: number, vy: number, speed: number

    if (type === 'missile') {
      x = 30 + Math.random() * 740
      y = -20
      speed = 1.5 + Math.random() * 1.0 + this.state.wave * 0.08
      const dx = targetX - x
      const dy = GROUND_Y - y
      const dist = Math.sqrt(dx * dx + dy * dy)
      vx = (dx / dist) * speed * 0.8
      vy = (dy / dist) * speed
    } else {
      const fromLeft = Math.random() > 0.5
      x = fromLeft ? -30 : 830
      y = 80 + Math.random() * 270
      speed = 1.2 + Math.random() * 0.8 + this.state.wave * 0.08
      const dx = targetX - x
      const dy = GROUND_Y - y
      const dist = Math.sqrt(dx * dx + dy * dy)
      vx = (dx / dist) * speed
      vy = (dy / dist) * speed * 0.3
    }

    const se: ServerEnemy = { id, type, x, y, vx, vy, targetCityIndex, spawnTime, speed }
    this.serverEnemies.set(id, se)

    const es = new EnemyState()
    es.id = id
    es.type = type
    es.x = x
    es.y = y
    es.vx = vx
    es.vy = vy
    es.targetCityIndex = targetCityIndex
    es.spawnTime = spawnTime
    this.state.enemies.set(id, es)
  }

  // ── intercept handling ────────────────────────────────────────────

  private handleFire(client: Client, data: { enemyId: string; interceptX: number; interceptY: number }) {
    const now = this.clock.currentTime
    const cooldownUntil = this.playerCooldowns.get(client.sessionId) ?? 0

    if (now < cooldownUntil) return  // still on cooldown
    if (!this.serverEnemies.has(data.enemyId)) return  // already dead

    const enemy = this.serverEnemies.get(data.enemyId)!
    const player = this.state.players.get(client.sessionId)

    // Remove enemy
    this.serverEnemies.delete(data.enemyId)
    this.state.enemies.delete(data.enemyId)

    // Update score
    const points = enemy.type === 'missile' ? 10 : 15
    if (player) player.score += points

    // Set cooldown
    this.playerCooldowns.set(client.sessionId, now + COOLDOWN_MS)

    // Broadcast kill effect to both clients
    this.broadcast('kill', {
      enemyId: data.enemyId,
      x: data.interceptX,
      y: data.interceptY,
      killedBy: client.sessionId,
      score: player?.score ?? 0,
    })
  }

  // ── city damage ───────────────────────────────────────────────────

  private damageCityNear(x: number) {
    let closest = 0
    let minD = 999
    CITY_POSITIONS.forEach((cx, i) => {
      const d = Math.abs(cx - x)
      if (d < minD) { minD = d; closest = i }
    })
    if (minD < 140 && this.state.cities[closest].health > 0) {
      this.state.cities[closest].health--
      this.broadcast('cityDamaged', { index: closest, health: this.state.cities[closest].health })
    }
  }
}
