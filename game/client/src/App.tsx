import { useState } from 'react'
import type { Room } from 'colyseus.js'
import GameCanvas from './game/components/GameCanvas'
import { joinSoloRoom, joinCoopRoom, leaveRoom } from './game/network/ColyseusClient'

type Screen = 'menu' | 'connecting' | 'waiting' | 'playing'

const styles: Record<string, React.CSSProperties> = {
  root: {
    background: '#04091a',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'monospace',
    color: '#fff',
  },
  title: {
    fontSize: 52,
    color: '#ffdd44',
    fontWeight: 'bold',
    letterSpacing: 6,
    marginBottom: 12,
    textShadow: '0 0 20px #ffaa00',
  },
  subtitle: {
    fontSize: 14,
    color: '#6699aa',
    marginBottom: 48,
    letterSpacing: 2,
  },
  btn: {
    display: 'block',
    width: 240,
    padding: '14px 0',
    marginBottom: 16,
    background: 'transparent',
    border: '2px solid',
    borderRadius: 4,
    fontSize: 16,
    letterSpacing: 3,
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  btnSolo: { color: '#00ffaa', borderColor: '#00ffaa' },
  btnCoop: { color: '#4488ff', borderColor: '#4488ff' },
  status: { fontSize: 14, color: '#667788', marginTop: 16 },
  hint: { fontSize: 12, color: '#445566', marginTop: 8 },
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [room, setRoom] = useState<Room | null>(null)
  const [error, setError] = useState('')

  const playSolo = async () => {
    setScreen('connecting')
    setError('')
    try {
      const r = await joinSoloRoom()
      setRoom(r)
      r.onLeave(() => { setScreen('menu'); setRoom(null) })
      r.onError((_code, msg) => setError(msg ?? 'Connection error'))
      setScreen('playing')
    } catch {
      // Server not running — play fully offline
      setRoom(null)
      setScreen('playing')
    }
  }

  const playCoop = async () => {
    setScreen('connecting')
    setError('')
    try {
      const r = await joinCoopRoom()
      setRoom(r)
      r.onLeave(() => { setScreen('menu'); setRoom(null) })
      r.onError((_code, msg) => { setError(msg ?? 'Connection error'); setScreen('menu') })
      // Wait for server to signal game start
      r.onMessage('gameStart', () => setScreen('playing'))
      setScreen('waiting')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Cannot connect to server'
      setError(msg)
      setScreen('menu')
    }
  }

  const backToMenu = () => {
    if (room) leaveRoom(room)
    setRoom(null)
    setScreen('menu')
  }

  if (screen === 'playing') {
    return (
      <div style={{ background: '#000', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <GameCanvas room={room} />
        <button onClick={backToMenu} style={{ marginTop: 10, background: 'none', border: '1px solid #334', color: '#445', fontFamily: 'monospace', fontSize: 12, cursor: 'pointer', padding: '4px 12px' }}>
          ← menu
        </button>
      </div>
    )
  }

  return (
    <div style={styles.root}>
      <div style={styles.title}>IRON SHIELD</div>
      <div style={styles.subtitle}>DEFEND · INTERCEPT · SURVIVE</div>

      {screen === 'menu' && (
        <>
          <button
            style={{ ...styles.btn, ...styles.btnSolo }}
            onMouseEnter={e => (e.currentTarget.style.background = '#00ffaa22')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            onClick={playSolo}
          >
            ▶ SOLO
          </button>
          <button
            style={{ ...styles.btn, ...styles.btnCoop }}
            onMouseEnter={e => (e.currentTarget.style.background = '#4488ff22')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            onClick={playCoop}
          >
            ⚡ CO-OP
          </button>
          {error && <div style={{ color: '#ff4444', fontSize: 13, marginTop: 12 }}>{error}</div>}
          <div style={styles.hint}>CO-OP requires the server running on :2567</div>
        </>
      )}

      {screen === 'connecting' && (
        <div style={styles.status}>Connecting...</div>
      )}

      {screen === 'waiting' && (
        <>
          <div style={styles.status}>Waiting for second player...</div>
          <div style={styles.hint}>Share this session — when they join, the game starts</div>
          <button onClick={backToMenu} style={{ ...styles.btn, ...styles.btnSolo, marginTop: 24 }}>
            Cancel
          </button>
        </>
      )}
    </div>
  )
}
