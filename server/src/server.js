/*
 * server.js -- Main server entry-point.
 */
'use strict'

const path = require('path')
const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const expressSession = require('express-session')
const sharedSession = require('express-socket.io-session')
const MySQLStore = require('express-mysql-session')(expressSession)
require('dotenv').config()

const sockets = {}

const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.SESSION_DB
})

const session = expressSession({
  key: 'sessionId',
  secret: '89 5e 70 dd 53 37 7e 2c a4 55',
  store: sessionStore,
  resave: false,
  saveUninitialized: true
})

app.use(session)
io.use(sharedSession(session, { autoSave: true }))

io.on('connection', (sock, test) => {
  if (!sock.handshake.session.id) {
    sock.disconnect(true)
    return
  }

  sockets[sock.handshake.session.id] = sock

  sock.on('disconnect', () => {
    console.log('socket disconnected')
    delete sockets[sock.handshake.session.id]
  })
})

app.use(require('body-parser').json())
app.use(require('./public-api'))
app.use((req, res, next) => {
  if (!req.session || !req.session.id) {
    console.log('unauthorized user')
    res.send({ success: false, message: 'You are not authorized' })
    return
  }
  req.sockets = sockets
  next()
})
app.use(require('./authenticated-api'))

app.use('/', express.static(path.join(__dirname, '../../client/dist')))
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'))
})

const port = process.env.PORT || 8081
server.listen(port)
console.log(`Listening on port ${port}`)

module.exports = server
