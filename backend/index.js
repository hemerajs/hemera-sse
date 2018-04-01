'use strict'

const fastify = require('fastify')({ logger: { level: 'info' } })
const through = require('through2')
const stringify = require('json-stringify-safe')
const EOL = require('os').EOL

fastify.register(require('fastify-hemera'), {
  hemera: {
    logLevel: 'error'
  }
})

fastify.route({
  method: 'GET',
  url: '/events',
  handler: (req, reply) => {
    reply.header('Access-Control-Allow-Origin', '*')

    const data = { name: 'test' }

    const transformStream = reply.createSSEStream()
    reply.sse(transformStream)

    reply.sendSSE(transformStream, {
      data,
      id: generateId(),
      event: 'ping'
    })

    setInterval(() => {
      reply.sendSSE(transformStream, {
        data,
        id: generateId(),
        event: 'ping'
      })
    }, 1000)
  }
})

function serialize(opts) {
  return through.obj(opts, function(obj, enc, cb) {
    // data only
    if (typeof obj === 'object') {
      cb(null, 'data: ' + stringify(obj) + EOL + EOL)
    } else {
      // SSE instructions
      cb(null, obj + EOL)
    }
  })
}

fastify.decorateRequest('getLastEventId', function(opts) {
  return (
    this.headers['last-event-id'] ||
    this.query.evs_last_event_id ||
    this.query.lastEventId ||
    0
  )
})

fastify.decorateReply('createSSEStream', function(opts) {
  return serialize(opts)
})

fastify.decorateReply('sendSSE', function(stream, msg) {
  if (msg.id) {
    stream.write('id: ' + msg.id)
  }
  if (msg.event) {
    stream.write('event: ' + msg.event)
  }
  if (msg.retryTimeout) {
    stream.write('retry: ' + msg.retryTimeout)
  }
  if (msg.data) {
    stream.write(msg.data)
  }
})

fastify.decorateReply('sse', function(stream) {
  this.code(200)
    .type('text/event-stream;charset=UTF-8')
    .header('content-encoding', 'identity')
    .header('Cache-Control', 'no-cache')
    .header('Connection', 'keep-alive')
    .send(stream)
})

function generateId() {
  return new Date().toLocaleTimeString()
}

async function start() {
  await fastify.listen(3000)
}

start()
  .then(() =>
    console.log(
      `server listening on http://${fastify.server.address().address}:${
        fastify.server.address().port
      }`
    )
  )
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
