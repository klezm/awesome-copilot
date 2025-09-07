import DefaultTheme from 'vitepress/theme'
import Explorer from './components/Explorer.vue'

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    app.component('Explorer', Explorer)
  }
}
