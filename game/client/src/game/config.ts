import Phaser from 'phaser'
import { GameScene } from './scenes/GameScene'

export const GAME_WIDTH = 800
export const GAME_HEIGHT = 600

export function createPhaserConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent,
    backgroundColor: '#050a1a',
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
    scene: [GameScene],
  }
}
