'use strict'

// https://technology.amis.nl/2017/02/19/node-js-application-using-sse-server-sent-events-to-push-updates-read-from-kafka-topic-to-simple-html-client-application/

const fastify = require('fastify')({ logger: { level: 'debug' } })
const through = require('through2')
const stringify = require('json-stringify-safe')
const EOL = require('os').EOL
const connections = new Set()

fastify.register(require('fastify-hemera'), {
  hemera: {
    logLevel: 'error'
  }
})

fastify.route({
  method: 'GET',
  url: '/events/news',
  schema: {
    params: {
      pattern: { type: 'string' }
    }
  },
  beforeHandler: function(request, reply, done) {
    reply
      .code(200)
      .type('text/event-stream;charset=UTF-8')
      .header('Access-Control-Allow-Origin', '*')
      .header('Cache-Control', 'no-cache')
      .header('Connection', 'keep-alive')
    // Add connections
    connections.add(reply.res)
    done()
  },
  handler: (req, reply) => {
    const lastEventId = parseInt(req.getLastEventId())
    if (lastEventId) {
      req.log.info(req.getLastEventId(), 'Last event id')
    }

    const transformStream = reply.createSSEStream()
    reply.send(transformStream)

    reply.sendSSE(transformStream, {
      data: { title: 'New news' },
      id: '1',
      event: 'news'
    })
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
