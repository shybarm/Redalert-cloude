import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'colyseus'
import { monitor } from '@colyseus/monitor'
import { DefenseRoom } from './rooms/DefenseRoom'

const app = express()
app.use(cors())
app.use(express.json())

const httpServer = createServer(app)
const gameServer = new Server({ server: httpServer })

gameServer.define('defense', DefenseRoom)

app.use('/colyseus', monitor())
app.get('/health', (_req, res) => res.json({ status: 'ok' }))

const PORT = Number(process.env.PORT) || 2567
httpServer.listen(PORT, () => {
  console.log(`[IronShield] Server on http://localhost:${PORT}`)
  console.log(`[IronShield] Monitor: http://localhost:${PORT}/colyseus`)
})
