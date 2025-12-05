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
const RenderAPI = {
  clipboard: clipboardImpl
}

/**
* Keyer 实例
* 组合主进程 API 和渲染进程 API
*
* 注意：不能使用对象展开 {...MainAPI}，因为 MainAPI 是 Proxy 对象，
* 展开运算符不会触发 Proxy 的 get trap，会得到空对象
*/
export const Keyer: _IMainAPI & _IRenderAPI = new Proxy(RenderAPI as any, {
  get(target, prop) {
    // 优先从 RenderAPI 获取
    if (prop in target) {
      return target[prop]
    }
    // 其他属性从 MainAPI (Proxy) 获取
    return MainAPI[prop as keyof _IMainAPI]
  }
})
