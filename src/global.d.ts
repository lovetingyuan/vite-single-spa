import { SingleApp } from './singleApp'

declare global {
  interface Window {
    singleApp: SingleApp
  }
}
