import './assets/main.css'

import { createApp } from 'vue'
// Import Bootstrap and BootstrapVue CSS files (order is important)
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import 'bootstrap/dist/js/bootstrap.bundle.js';
import '@venegrad/vue3-autocomplete/dist/venAutocomplete.css'


import VueVideoPlayer from '@videojs-player/vue'

import 'video.js/dist/video-js.css'
import * as key from 'vue3-shortkey';
import vueAutocomplete from "@venegrad/vue3-autocomplete"



import App from './App.vue'

const app = createApp(App)

app.use(VueVideoPlayer)
app.use(vueAutocomplete);

app.use(key, { prevent: ['input', 'textarea'] })

app.mount('#app')
