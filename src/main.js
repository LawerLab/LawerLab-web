import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import './assets/styles/index.css'
import './assets/styles/style.css'
import 'material-icons/iconfont/material-icons.css'

createApp(App).use(router).mount('#app')
