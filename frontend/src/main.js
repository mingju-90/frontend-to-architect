import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import './styles.css'

/**
 * 创建并挂载 Vue 应用。
 * @returns {void}
 */
function bootstrap() {
  const app = createApp(App)
  app.use(ElementPlus)
  app.mount('#app')
}

bootstrap()
