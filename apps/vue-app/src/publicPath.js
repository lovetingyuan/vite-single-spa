import { name, singleApp } from '../package.json'
if (process.env.NODE_ENV === 'development') {
  __webpack_public_path__ = singleApp.entry // eslint-disable-line
}
export const appName = name;
