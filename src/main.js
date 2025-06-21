import { createApp } from 'vue'
import { createPinia } from "pinia";
import router from "./router/router";
import App from './App.vue'


const pinia = createPinia();
app.use(pinia);
app.use(router);
createApp(App).mount('#app')
