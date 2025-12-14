/**
 * Keyer 核心能力实现
 *
 * 实现 keyerext 中声明的 IKeyer 接口
 * 提供剪贴板操作、应用控制等核心能力
 */
import { ipcRenderer } from 'electron';

import { _IMainAPI } from '@/shared/main-api'
import { _IRenderAPI } from '@/shared/render-api';

import { clipboardImpl } from './clipboard';
import { commandImpl } from './command';
import { extensionsImpl } from './extensions';
import { toastImpl } from './toast';
import { ExtensionStore } from '../managers/ExtensionStore';

// 支持嵌套 namespace 的 Proxy
function wrapAPI<T>(path: string[] = []): T {
  return new Proxy(function () { } as any, {
    get(_, prop: string) {
      return wrapAPI([...path, prop.toString()])
    },
    apply(_, __, args: any[]) {
      const channel = path.join(".")
      return ipcRenderer.invoke(channel, ...args)
    }
  }) as T
}

// 生成统一 api 对象
const MainAPI = wrapAPI<_IMainAPI>()
const RenderAPI: _IRenderAPI = {
  clipboard: clipboardImpl,
  command: commandImpl,
  extensions: extensionsImpl as any,
  store: new ExtensionStore(""),
  toast: toastImpl
}

/**
* Keyer 实例
* 组合主进程 API 和渲染进程 API
*/
export const Keyer: _IMainAPI & _IRenderAPI = new Proxy(RenderAPI as any, {
  get(target, prop) {
    if (prop in target) {
      return target[prop]
    }
    return MainAPI[prop as keyof _IMainAPI]
  }
})
