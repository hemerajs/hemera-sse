import Vue from 'vue'
import App from './App.vue'

const app = new Vue({
  render: h => h(App)
})

// actually mount to DOM
app.$mount('#app')
