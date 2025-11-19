/**
 * IPC 处理器聚合模块
 */
import { setupWindowIPCHandlers } from './ipc-window'
import { setupPasteIPCHandlers } from './ipc-paste'
import { setupPathsIPCHandlers } from './ipc-paths'
import { setupStoreIPCHandlers } from './ipc-store'
import { setupExecIPCHandlers } from './ipc-exec'
import { setupExecWindowHandlers } from './exec-window'
import { setupCreateIPCHandlers } from './ipc-create'

/**
 * 注册所有 IPC 处理器
 */
export function setupIPCHandlers() {
  setupWindowIPCHandlers()
  setupPasteIPCHandlers()
  setupPathsIPCHandlers()
  setupStoreIPCHandlers()
  setupExecIPCHandlers()
  setupExecWindowHandlers()
  setupCreateIPCHandlers()
}
