import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import type { Room } from 'colyseus.js'
import { createPhaserConfig } from '../config'
import { GameScene } from '../scenes/GameScene'

interface Props {
  room: Room | null
}

export default function GameCanvas({ room }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return
    gameRef.current = new Phaser.Game(createPhaserConfig(containerRef.current))
    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  // Wire the room into the scene when available
  useEffect(() => {
    if (!gameRef.current) return
    const scene = gameRef.current.scene.getScene('GameScene') as GameScene | null
    if (scene?.scene.isActive()) {
      scene.setRoom(room)
    } else {
      // Wait for scene to be ready
      gameRef.current.events.once('ready', () => {
        const s = gameRef.current?.scene.getScene('GameScene') as GameScene | null
        s?.setRoom(room)
      })
    }
  }, [room])

  return <div ref={containerRef} />
}
