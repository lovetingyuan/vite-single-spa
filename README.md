# Vite + SingleSpa

* 开发环境子应用需要支持资源请求使用完整url
* 构建环境子应用需要配置资源路径前缀为应用名称
* 子应用需要在`package.json`中配置`singleApp`选项
```typescript
{
  singleApp: {
    name?: string // 默认使用package.json的name字段
    entry: string // 开发阶段应用的入口地址
    dev?: string // 应用启动命令，默认使用npm dev
    build?: string // 应用构建命令，默认使用npm build
    dist?: string // 应用构建产物输出目录，默认使用dist
  }
}
```
* 子应用需要条件使用`startApp`来进行初始化
