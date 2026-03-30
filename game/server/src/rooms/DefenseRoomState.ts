import { Schema, MapSchema, ArraySchema, type } from '@colyseus/schema'

export class PlayerState extends Schema {
  @type('string') sessionId: string = ''
  @type('float32') defX: number = 400
  @type('int32') score: number = 0
}

export class EnemyState extends Schema {
  @type('string') id: string = ''
  @type('string') type: string = 'missile'
  @type('float32') x: number = 0
  @type('float32') y: number = 0
  @type('float32') vx: number = 0
  @type('float32') vy: number = 0
  @type('int8') targetCityIndex: number = 0
  @type('float32') spawnTime: number = 0
}

export class CityState extends Schema {
  @type('int8') index: number = 0
  @type('int8') health: number = 3
}

export class RoomState extends Schema {
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>()
  @type({ map: EnemyState }) enemies = new MapSchema<EnemyState>()
  @type([CityState]) cities = new ArraySchema<CityState>()
  @type('int32') wave: number = 1
  @type('string') phase: string = 'lobby'
}
