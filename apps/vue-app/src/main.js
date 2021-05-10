import { appName } from './publicPath'
import Vue from 'vue'
import App from './App.vue'
import singleSpaVue from 'single-spa-vue'

Vue.config.productionTip = false

if (window.singleApp) {
  const vueLifecycles = singleSpaVue({
    Vue,
    appOptions: {
      render(h) {
        return h(App);
      },
      el: '#' + appName
    },
  });

  window.singleApp.startApp(appName, vueLifecycles);
} else {
  new Vue({
    render: h => h(App)
  }).$mount('#app')
}
