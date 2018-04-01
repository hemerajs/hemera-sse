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

    const transformStream = reply.constructSSEStream()
    reply.sse(transformStream)

    reply.constructSSE(transformStream, {
      data,
      id: generateId(),
      event: 'ping'
    })

    setInterval(() => {
      reply.constructSSE(transformStream, {
        data,
        id: generateId(),
        event: 'ping'
      })
    }, 1000)
  }
})

function serialize(opts) {
  return through.obj(opts, function(obj, enc, cb) {
    if (typeof obj === 'object') {
      cb(null, 'data: ' + stringify(obj) + EOL + EOL)
    } else {
      cb(null, obj + EOL)
    }
  })
}

fastify.decorateReply('constructSSEStream', function(opts) {
  return serialize(opts)
})

fastify.decorateReply('constructSSE', function(stream, { id, event, data }) {
  if (id) {
    stream.write('id: ' + id)
  }
  if (event) {
    stream.write('event: ' + event)
  }
  if (data) {
    stream.write(data)
  }
})

fastify.decorateReply('sse', function(stream) {
  this.code(200)
    .type('text/event-stream')
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
