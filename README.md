# hemera-sse
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)

Stream Updates with HTTP/2 Server-Sent Events & Hemera

* Frontend with [`Vuejs`](https://vuejs.org/), [`Parcel bundler`](https://parceljs.org/)
* Backend with [`NATS messaging system`](https://nats.io/), [`Hemera`](https://hemerajs.github.io/hemera/) and [`Fastify`](https://www.fastify.io/)

## Getting started

```
npm start
```

## Goals

* Subscribe to Hemera events and **[Named events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)** in the frontend
* Subscribe to durable message queue via Hemera/[NATS-Streaming](https://github.com/hemerajs/hemera-nats-streaming)
* Reply message at special HTTP header (Last-Event-ID) in NATS-Streaming
* Use HTTP2 to be more efficient multiplexing, header-compression ...
* Stream JSON

## TODO

- [X] Setup frontend
- [X] Setup backend
- [X] Try SSE with HTTP/1
- [ ] Use HTTP/2
- [ ] Use Hemera
