// renderer/api.ts
import { ipcRenderer } from 'electron'
import type { APIType } from "../shared/ipc"

// 支持嵌套 namespace 的 Proxy
function wrapAPI<T>(path: string[] = []): T {
  return new Proxy(function() {} as any, {
    get(_, prop: string) {
      return wrapAPI([...path, prop.toString()])
    },
    apply(_, __, args: any[]) {
      const channel = path.join(".")
      console.log(`📡 IPC call: ${channel} with args:`, args)
      return ipcRenderer.invoke(channel, ...args)
    }
  }) as T
}

// 生成统一 api 对象
export const api = wrapAPI<APIType>()