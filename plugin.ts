import { resolve, dirname, isAbsolute } from 'path'
import { readFileSync, existsSync } from 'fs'
import type { Plugin, ResolvedConfig } from 'vite'
import { createProxyMiddleware } from 'http-proxy-middleware';
import p from 'phin'
import execa from 'execa'
import fse from 'fs-extra'

function waitOn(url, time = 300): Promise<boolean> {
  return new Promise(resolve => {
    const timer = setInterval(() => {
      p({
        url,
        headers: {
          accept: 'text/html'
        },
        method: 'head'
      }).then(() => {
        clearInterval(timer)
        resolve(true)
      }, () => {})
    }, time);
  })
}

interface SingleAppConfig {
  name?: string
  entry: string,
  dist?: string
  dev?: string,
  build?: string
}

export default (): Plugin => {
  let config: ResolvedConfig

  return {
    name: 'vite-mfe',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const { searchParams } = new URL(req.url, 'http://' + req.headers.host)
        if (searchParams.has('_proxy')) {
          try {
            const hpm: any = createProxyMiddleware({
              logLevel: 'warn',
              target: searchParams.get('_proxy'),
              ignorePath: true
            })
            hpm(req, res, next)
          } catch (err) {
            return next(err)
          }
        } else {
          return next()
        }
      })
    },
    resolveId(id, importer) {
      if (id.endsWith('.app')) {
        if (isAbsolute(id)) {
          return resolve(config.root, '.' + id)
        }
        return resolve(dirname(importer), id)
      }
    },
    buildStart() {
      if (config.isProduction) {
        fse.emptyDirSync(config.build.outDir)
      }
    },
    config(config) {
      config.build = config.build || {}
      config.build.emptyOutDir = false;
    },
    renderDynamicImport(info) { // not called during build
      if (info.targetModuleId.endsWith('.app')) {
        const appDir = info.targetModuleId.replace('.app', '/')
        const { name, singleApp }: {
          name: string, singleApp: SingleAppConfig
        } = JSON.parse(readFileSync(resolve(appDir, 'package.json'), 'utf8'))
        const _name = singleApp.name || name;
        const subApp = {
          ...singleApp,
          name: _name,
          entry: `/${_name}/index.html`
        }
        return {
          left: `Promise.resolve(${JSON.stringify({ default: subApp })},`,
          right: `)`
        }
      }
    },
    generateBundle(options, bundles) { // not called during build
      Object.keys(bundles).forEach(f => {
        const bundle = bundles[f];
        if (bundle.type === 'chunk' && (bundle.facadeModuleId || '').endsWith('.app')) {
          delete bundles[f]
        }
      })
    },
    async load(id) {
      if (id.endsWith('.app')) {
        const appDir = id.replace('.app', '/')
        const { name, singleApp }: {
          name: string, singleApp: SingleAppConfig
        } = JSON.parse(readFileSync(resolve(appDir, 'package.json'), 'utf8'))
        singleApp.name = singleApp.name || name
        const tool = existsSync(resolve(appDir, 'yarn.lock')) ? 'yarn' : 'npm'
        if (config.command === 'build') {
          const index = resolve(config.build.outDir, singleApp.name, 'index.html')
          if (!existsSync(index)) {
            const buildTask = execa.command(singleApp.build || `${tool} build`, {
              cwd: appDir
            })
            buildTask.stdout.pipe(process.stdout)
            buildTask.then(() => {
              return fse.copy(resolve(appDir, singleApp.dist || 'dist'), dirname(index))
            })
          }
          return 'export default null';
        }
        try {
          await p({
            url: singleApp.entry,
            headers: {
              Accept: 'text/html'
            },
            method: 'head',
            timeout: 500
          })
        } catch (e) {
          execa.command(singleApp.dev || `${tool} dev`, {
            cwd: appDir
          }).stdout.pipe(process.stdout)
          await waitOn(singleApp.entry)
        }
        return `export default ${JSON.stringify(singleApp)}`
      }
    },
    configResolved(resolvedConfig) {
      config = resolvedConfig
    }
  }
}
