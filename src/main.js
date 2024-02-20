import './assets/main.css'
import noImg from './assets/iconNoImg.svg'

import { createApp } from 'vue'
import VueLazyLoad from 'vue3-lazyload'
import App from './App.vue'

createApp(App).use(VueLazyLoad, {
  loading: '',
  error: noImg,
}).mount('#app')
