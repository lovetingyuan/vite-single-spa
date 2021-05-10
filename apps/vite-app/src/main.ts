import { createApp } from 'vue';
import singleSpaVue from 'single-spa-vue';
import App from './App.vue';
import { name as appName } from '../package.json'

if ((window as any).singleApp) {
  App.el = '#' + appName;
  (window as any).singleApp.startApp(appName, singleSpaVue({
    createApp,
    appOptions: App,
    handleInstance: (app) => {
      // app.use(router);
    }
  }))
} else {
  createApp(App).mount('#app')
}
