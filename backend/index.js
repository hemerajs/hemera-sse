'use strict'

const fastify = require('fastify')({ logger: { level: 'debug' } })
const through = require('through2')
const stringify = require('json-stringify-safe')
const EOL = require('os').EOL

fastify.register(require('fastify-hemera'), {
  plugins: [
    require('hemera-joi'),
    {
      plugin: require('hemera-nats-streaming'),
      options: {
        clusterId: 'test-cluster',
        clientId: 'clientTest',
        opts: {}
      }
    }
  ],
  hemera: {
    logLevel: 'error'
  }
})

fastify.route({
  method: 'GET',
  url: '/events/subscribe/:subject',
  schema: {
    params: {
      pattern: { type: 'string' }
    }
  },
  handler: (req, reply) => {
    reply.header('Access-Control-Allow-Origin', '*')

    const lastEventId = parseInt(req.getLastEventId())
    if (lastEventId) {
      req.log.info(req.getLastEventId(), 'Last event id')
    }

    const transformStream = reply.createSSEStream()
    reply.sse(transformStream)

    req.hemera.act(
      {
        topic: 'nats-streaming',
        cmd: 'subscribe',
        subject: req.params.subject,
        queue: 'sse',
        options: {
          setStartAtSequence: lastEventId
        }
      },
      (err, resp) => {
        if (err) {
          req.log.error(err)
        } else {
          req.hemera.add(
            {
              topic: `nats-streaming.${req.params.subject}`
            },
            (hemeraReq, cb) => {
              reply.sendSSE(transformStream, {
                data: hemeraReq.data.message,
                id: hemeraReq.data.sequence,
                event: req.params.subject
              })
              cb()
            }
          )
        }
      }
    )
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
  // the id of the message
  if (msg.id) {
    stream.write('id: ' + msg.id)
  }
  // Assign the next payload to a specific event
  if (msg.event) {
    stream.write('event: ' + msg.event)
  }
  // Tell the clients how long they should wait before reconnecting.
  if (msg.retryTimeout) {
    stream.write('retry: ' + msg.retryTimeout)
  }
  // message payload must be an object
  if (msg.data) {
    stream.write(msg.data)
  }
  // Send a "ping" (empty comment) to all clients, to keep the connections alive
  if (msg.ping) {
    stream.write(':')
  }
})

fastify.decorateReply('sse', function(stream) {
  // keep client connection open
  this.request.req.socket.setTimeout(0)
  this.request.req.socket.setNoDelay(true)
  this.request.req.socket.setKeepAlive(true)

  this.code(200)
    .type('text/event-stream;charset=UTF-8')
    .header('content-encoding', 'identity')
    .header('Cache-Control', 'no-cache')
    .header('Connection', 'keep-alive')
    .send(stream)
})

async function start() {
  await fastify.listen(3000)
  setInterval(() => {
    fastify.hemera.act({
      topic: 'nats-streaming',
      cmd: 'publish',
      subject: 'news',
      data: {
        title: 'hello world'
      }
    })
  }, 2000)
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
