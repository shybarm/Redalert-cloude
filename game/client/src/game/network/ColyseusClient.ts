import { Client, Room } from 'colyseus.js'

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'ws://localhost:2567'

let _client: Client | null = null

function getClient(): Client {
  if (!_client) _client = new Client(SERVER_URL)
  return _client
}

export async function joinSoloRoom(): Promise<Room> {
  return getClient().joinOrCreate('defense', { mode: 'solo' })
}

export async function joinCoopRoom(): Promise<Room> {
  return getClient().joinOrCreate('defense', { mode: 'coop' })
}

export function leaveRoom(room: Room): void {
  room.leave()
}
