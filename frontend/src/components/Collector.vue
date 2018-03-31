<template>
    <div>
      <ul id="example-1">
        <li v-for="event in events">
          {{ event }}
        </li>
      </ul>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

@Component()
export default class Collector extends Vue {
  events: Array = []
  setupStream() {
      // Not a real URL, just using for demo purposes
      let es = new EventSource('http://localhost:3000/events')

      es.addEventListener('message', event => {
          this.events.push(event.data)
      }, false)

      es.addEventListener('error', event => {
          if (event.readyState == EventSource.CLOSED) {
              console.log('Event was closed')
              console.log(EventSource)
          }
      }, false)
  }
  created() {
      this.setupStream()
  }
}
</script>

<style>
</style>
