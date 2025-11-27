import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export interface DrawerProps {
  open: boolean
  onClose: () => void
  placement?: 'left' | 'right'
  width?: number
  showCloseButton?: boolean
  maskClosable?: boolean
  children: React.ReactNode
}

export function Drawer({
  open,
  onClose,
  placement = 'right',
  width = 300,
  showCloseButton = true,
  maskClosable = true,
  children
}: DrawerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (open) {
      setIsVisible(true)
      setTimeout(() => setIsAnimating(true), 10) // 小延迟确保动画效果
    } else {
      setIsAnimating(false)
      setTimeout(() => setIsVisible(false), 300) // 等待动画结束
    }
  }, [open])

  const handleMaskClick = (e: React.MouseEvent) => {
    if (maskClosable && e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleCloseClick = () => {
    onClose()
  }

  if (!isVisible) return null

  const drawerContent = (
    <div
      className="drawer-mask"
      onClick={handleMaskClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        zIndex: 1000,
        opacity: isAnimating ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out'
      }}
    >
      <div
        className="drawer-content"
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          width: width,
          backgroundColor: 'var(--color-bg)',
          boxShadow: placement === 'left' 
            ? '2px 0 8px rgba(0, 0, 0, 0.15)' 
            : '-2px 0 8px rgba(0, 0, 0, 0.15)',
          transform: isAnimating 
            ? 'translateX(0)' 
            : `translateX(${placement === 'left' ? '-100%' : '100%'})`,
          transition: 'transform 0.3s ease-in-out',
          ...(placement === 'left' ? { left: 0 } : { right: 0 }),
          display: 'flex',
          flexDirection: 'column' as const
        }}
      >
        {/* Header with close button */}
        {showCloseButton && (
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center'
            }}
          >
            <button
              onClick={handleCloseClick}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: 'var(--color-subtitle)',
                fontSize: '18px',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                transition: 'color 0.15s, background-color 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-title)'
                e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-subtitle)'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: showCloseButton ? 0 : '16px'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )

  // 使用 portal 渲染到 body
  return createPortal(drawerContent, document.body)
}