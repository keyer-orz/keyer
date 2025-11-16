/**
 * Store Component Wrapper
 * 包装 StorePanel 以便在系统命令中使用
 */
import React, { useState, useEffect } from 'react'
import { StorePanel } from './StorePanel'
import { StoreManager } from '../managers/StoreManager'

// 全局 StoreManager 实例
let storeManagerInstance: StoreManager | null = null

const Store: React.FC = () => {
  const [storeManager, setStoreManager] = useState<StoreManager | null>(null)

  useEffect(() => {
    // 初始化或复用 StoreManager
    if (!storeManagerInstance) {
      storeManagerInstance = new StoreManager()
      storeManagerInstance.initialize()
    }
    setStoreManager(storeManagerInstance)
  }, [])

  const handleClose = () => {
    // 关闭面板（通过隐藏窗口）
    const { ipcRenderer } = window.require('electron')
    ipcRenderer.invoke('hide-window')
  }

  if (!storeManager) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>
        Initializing store...
      </div>
    )
  }

  return <StorePanel storeManager={storeManager} onClose={handleClose} />
}

export default Store
