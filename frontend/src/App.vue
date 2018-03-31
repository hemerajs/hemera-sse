<template>
  <div>
  <h1>Event Stream</h1>
  <collector-component/>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import CollectorComponent from './components/Collector.vue'

export default Vue.extend({
  data() {
    return { name: "World" }
  },
  components: {
    CollectorComponent
  }
})
</script>
