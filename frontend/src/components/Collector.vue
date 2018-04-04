<template>
    <div>
      <ul id="example-1">
        <li v-for="event in events">
          {{ event.title }}
        </li>
      </ul>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

@Component({})
export default class Collector extends Vue {
  events: Array<object> = []
  setupStream() {
    // Not a real URL, just using for demo purposes
    let es = new EventSource('http://localhost:3000/events/news')

    es.addEventListener(
      'news',
      event => {
        const msg = JSON.parse(event.data)
        this.events.push(msg)
      },
      false
    )

    es.addEventListener(
      'error',
      event => {
        if (event.readyState == EventSource.CLOSED) {
          console.log('Event was closed')
          console.log(EventSource)
        }
      },
      false
    )
  }
  created() {
    this.setupStream()
  }
}
</script>

<style>

</style>
