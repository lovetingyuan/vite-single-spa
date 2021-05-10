import type { LifeCycles } from 'single-spa'
import * as SingleSpa from 'single-spa'

interface AssetInfo {
  tag: 'script' | 'link' | 'style'
  textContent: string
  attrs: { name: string, value: string }[]
}

interface AppConfig {
  // name?: string
  app: () => Promise<typeof import("*.app")>,
  activeWhen: string
}

export interface SingleApp {
  startApp: (appName: string, lifeCycles: LifeCycles) => void,
  singleSpa: typeof SingleSpa,
  init: boolean
}

const EventPrefix = '@APP_LOADED:'

const toggleStyles = (appName: string, disable?: boolean) => {
  document.querySelectorAll(`style[data-app-name="${appName}"]`).forEach(style => {
    style.setAttribute('type', disable ? '_text/css' : 'text/css')
  })
  document.querySelectorAll(`link[data-app-name="${appName}"]`).forEach(link => {
    link.setAttribute('rel', disable ? '_stylesheet' : 'stylesheet')
  })
}

function getAssets(html: string, entry: string) {
  const domparser = new DOMParser()
  const doc = domparser.parseFromString(html, 'text/html')
  const scriptTypes = [
    '',
    'text/javascript',
    'text/ecmascript',
    'application/javascript',
    'application/ecmascript',
    'module'
  ]
  const assets: AssetInfo[] = []
  Array.prototype.concat(
    Array.from(doc.head.children),
    Array.from(doc.body.children)
  ).map((el: Element) => {
    const tag = el.tagName.toLowerCase()
    let element: Element | null = null
    if (tag === 'script' && scriptTypes.includes((el as HTMLScriptElement).type)) {
      const ele = el as HTMLScriptElement
      if (ele.hasAttribute('src') && entry.startsWith('http')) {
        ele.src = new URL(ele.getAttribute('src') || '', entry).toString()
      }
      element = ele
    }
    if (tag === 'link' && (el as HTMLLinkElement).rel === 'stylesheet') {
      const ele = el as HTMLLinkElement
      if (entry.startsWith('http')) {
        ele.href = new URL(ele.getAttribute('href') || '', entry).toString()
      }
      element = ele
    }
    if (tag === 'style') {
      element = el
    }
    if (element) {
      assets.push({
        tag,
        textContent: element.textContent,
        attrs: Array.from(element.attributes).map(v => ({ name: v.name, value: v.value }))
      } as AssetInfo)
    }
  })
  return assets
}

window.singleApp = {
  singleSpa: SingleSpa,
  startApp(appName, lifeCycles) {
    document.dispatchEvent(new CustomEvent(EventPrefix + appName, {
      detail: lifeCycles
    }))
  },
  init: false
}

async function loadApp(appName: string, entry: string) {
  const lifeCycles = new Promise<LifeCycles>(resolve => {
    document.addEventListener(EventPrefix + appName, (evt: CustomEventInit) => {
      const lifeCycles: LifeCycles = typeof evt.detail === 'function' ? evt.detail({
        appName
      }) : evt.detail
      const { mount: _mount, unmount: _unmount } = lifeCycles
      if (typeof _mount === 'function') {
        lifeCycles.mount = function mount (...args: any) {
          toggleStyles(appName, false)
          return _mount.apply(this, args)
        }
      }
      if (typeof _unmount === 'function') {
        lifeCycles.unmount = function unmount (...args: any) {
          toggleStyles(appName, true)
          return _unmount.apply(this, args)
        }
      }
      resolve(lifeCycles)
    })
  })
  const fragment = document.createDocumentFragment()
  const scriptTasks: Promise<void>[] = []
  const resource = process.env.NODE_ENV === 'development' ? `./?_proxy=${encodeURIComponent(entry)}` : entry
  const html = await fetch(resource).then(r => r.text())
  const appAssets = getAssets(html, entry)
  appAssets.forEach(asset => {
    const el = document.createElement(asset.tag)
    el.dataset.appName = appName
    el.textContent = asset.textContent;
    asset.attrs.forEach(({ name, value }) => {
      el.setAttribute(name, value)
    })
    if (asset.tag === 'script' && el.hasAttribute('src')) {
      scriptTasks.push(new Promise((resolve, reject) => {
        el.onload = () => resolve()
        el.onerror = reject
      }))
    }
    fragment.appendChild(el)
  })
  document.head.appendChild(fragment)
  await Promise.all(scriptTasks)
  return lifeCycles
}

// fix hot update cors issue
const rawOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open  = function open(this: any, method: string, url: string, ...args: any) {
  const _url = url.endsWith('.hot-update.json') ? 
    location.origin + '?_proxy=' + encodeURIComponent(url)
  : url
  return (rawOpen as any).call(this, method, _url, ...args);
}

const rawHeadAppend = HTMLHeadElement.prototype.appendChild
HTMLHeadElement.prototype.appendChild = function <T extends Node>(this: HTMLHeadElement, dom: T) {
  if (
    dom instanceof HTMLStyleElement || dom instanceof HTMLScriptElement ||
    (dom instanceof HTMLLinkElement && dom.rel === 'stylesheet')
  ) {
    const appName = document.currentScript && document.currentScript.dataset.appName
    if (appName && !dom.dataset.appName) {
      dom.dataset.appName = appName
    }
  }
  return rawHeadAppend.call(this, dom) as T
}

const fakeLifeCycles = {
  async bootstrap() { },
  async mount() { },
  async unmount() { },
}

export default function initApps(appsConfigs: AppConfig[]) {
  appsConfigs.forEach(config => {
    const fakeName = '_' + Math.random()
    SingleSpa.registerApplication({
      name: fakeName,
      app: async () => {
        const { default: { name, entry } } = await config.app();
        const appNames = SingleSpa.getAppNames()
        if (appNames.includes(fakeName)) {
          await SingleSpa.unregisterApplication(fakeName);
        }
        if (!appNames.includes(name)) {
          SingleSpa.registerApplication({
            name,
            app: () => loadApp(name, entry),
            activeWhen: config.activeWhen
          })
        }
        return fakeLifeCycles
      },
      activeWhen: config.activeWhen
    })
  })

  window.singleApp.init || document.body.addEventListener('click', (e: any) => {
    if (e.target.tagName === 'A' && e.target.href.startsWith('app:')) {
      e.preventDefault();
      SingleSpa.navigateToUrl(e.target.href.slice(4));
    }
  })
  window.singleApp.init = true;
  return () => {
    SingleSpa.start()
  }
}
