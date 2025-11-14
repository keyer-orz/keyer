/**
 * IPC 处理器聚合模块
 */
import { setupWindowIPCHandlers } from './ipc-window'
import { setupPasteIPCHandlers } from './ipc-paste'
import { setupPathsIPCHandlers } from './ipc-paths'

/**
 * 注册所有 IPC 处理器
 */
export function setupIPCHandlers() {
  setupWindowIPCHandlers()
  setupPasteIPCHandlers()
  setupPathsIPCHandlers()
}
