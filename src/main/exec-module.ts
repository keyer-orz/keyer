import { APIType, ExecResult } from '@/shared/ipc'
import { executeInTerminal, executeInWindow } from './command-executor'

export const execHandler: APIType['exec'] = {
  terminal: async (cmd: string, cwd?: string): Promise<ExecResult> => {
    return executeInTerminal(cmd, cwd)
  },

  window: async (cmd: string): Promise<ExecResult> => {
    return executeInWindow(cmd)
  }
}
