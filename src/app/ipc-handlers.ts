/**
 * IPC 处理器聚合模块
 */
import { setupWindowIPCHandlers } from '../main/ipc-window'
import { setupPasteIPCHandlers } from '../main/ipc-paste'
import { setupPathsIPCHandlers } from '../main/ipc-paths'
import { setupNetIPCHandlers } from '../main/ipc-net'
import { setupStoreIPCHandlers } from '../main/ipc-store'

/**
 * 注册所有 IPC 处理器
 */
export function setupIPCHandlers() {
  setupWindowIPCHandlers()
  setupPasteIPCHandlers()
  setupPathsIPCHandlers()
  setupNetIPCHandlers()
  setupStoreIPCHandlers()
}
