import App from './App.svelte'
import singleSpaSvelte from 'single-spa-svelte';
import { name as appName } from '../package.json'

if ((window as any).singleApp) {
  const svelteLifecycles = singleSpaSvelte({
    component: App,
    domElementGetter: () => document.getElementById(appName),
  });
  (window as any).singleApp.startApp(appName, svelteLifecycles)
} else {
  new App({
    target: document.getElementById('app')
  })
}
