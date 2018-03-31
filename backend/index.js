'use strict'

const fastify = require('fastify')({ logger: { level: 'info' } })
const { Readable } = require('stream')

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

    const s = new Readable()
    // we push data from outside
    s._read = function noop() {}

    reply.sse(s)
    reply.constructSSE(s, generateId(), 'hello world')

    setInterval(() => {
      reply.constructSSE(s, generateId(), 'hello world')
    }, 1000)
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

fastify.decorateReply('sseEnd', function(stream) {
  stream.push(null)
})

fastify.decorateReply('constructSSE', function(stream, id, data) {
  stream.push('id: ' + id + '\n')
  stream.push('data: ' + data + '\n\n')
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
