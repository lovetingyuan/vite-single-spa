import singleApp from './singleApp'

const start = singleApp([
  {
    app: () => import('../apps/vue-app.app'),
    activeWhen: '/vue-app'
  },
  {
    app: () => import('../apps/react-app.app'),
    activeWhen: '/react-app'
  },
  {
    app: () => import('../apps/vite-app.app'),
    activeWhen: '/vite-app'
  },
  {
    app: () => import('../apps/vite-svelte-app.app'),
    activeWhen: '/vite-svelte-app'
  }
])

document.getElementById('single-app')!.innerHTML = `
<img alt="Vite logo" width="80" src="https://vitejs.dev/logo.svg" />
<img alt="single-spa logo" width="80" src="https://single-spa.js.org/img/logo-white-bgblue.svg" />
<ul>
  <li>
    <a href="app:/">Home</a>
  </li>
  <li>
    <a href="app:/vue-app/">vue app</a>
  </li>
  <li>
    <a href="app:/react-app/">react app</a>
  </li>
  <li>
    <a href="app:/vite-app/">vite vue app</a>
  </li>
  <li>
    <a href="app:/vite-svelte-app/">vite svelte app</a>
  </li>
</ul>
<div>
  <div id="vue-app"></div>
  <div id="react-app"></div>
  <div id="vite-app"></div>
  <div id="vite-svelte-app"></div>

</div>
`

start();
