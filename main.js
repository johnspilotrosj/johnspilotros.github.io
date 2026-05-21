import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import LobbyView from './views/LobbyView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: LobbyView },
  ],
})

createApp(App).use(router).mount('#app')
