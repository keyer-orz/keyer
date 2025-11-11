import { useState } from 'react'
import { useStore } from 'keyerext'

// Dashboard 组件 - 演示如何使用 Store
export function Dashboard(props: { title?: string }) {
  // 使用简化版 Store Hook，自动获取当前 extension ID
  const [clickCount, setClickCount] = useStore<number>('dashboard-clicks', 0)

  const [localCounter, setLocalCounter] = useState(0)

  const handleCardClick = async () => {
    // 更新 Store 中的计数
    await setClickCount((clickCount || 0) + 1)
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: 'var(--color-text)' }}>
          {props.title || 'System Dashboard'}
        </h2>
        <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          总点击次数: {clickCount || 0} | 本次: {localCounter}
        </div>
      </div>

      <p style={{ marginBottom: '20px', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
        💡 点击任意卡片查看 Store 演示（数据会持久化保存）
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div
          style={{
            padding: '16px',
            borderRadius: '8px',
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
          onClick={() => {
            handleCardClick()
            setLocalCounter(localCounter + 1)
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
          <h3 style={{ color: 'var(--color-text)', marginBottom: '4px' }}>CPU 使用率</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
            45%
          </p>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            正常
          </p>
        </div>

        <div
          style={{
            padding: '16px',
            borderRadius: '8px',
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
          onClick={() => {
            handleCardClick()
            setLocalCounter(localCounter + 1)
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>💾</div>
          <h3 style={{ color: 'var(--color-text)', marginBottom: '4px' }}>内存使用</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
            8.2 GB
          </p>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            / 16 GB
          </p>
        </div>

        <div
          style={{
            padding: '16px',
            borderRadius: '8px',
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
          onClick={() => {
            handleCardClick()
            setLocalCounter(localCounter + 1)
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌐</div>
          <h3 style={{ color: 'var(--color-text)', marginBottom: '4px' }}>网络状态</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#4ade80' }}>
            已连接
          </p>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            100 Mbps
          </p>
        </div>

        <div
          style={{
            padding: '16px',
            borderRadius: '8px',
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
          onClick={() => {
            handleCardClick()
            setLocalCounter(localCounter + 1)
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔋</div>
          <h3 style={{ color: 'var(--color-text)', marginBottom: '4px' }}>电池状态</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#4ade80' }}>
            87%
          </p>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            健康度 96%
          </p>
        </div>
      </div>
    </div>
  )
}

// SimpleList 组件
export function SimpleList() {
  const items = [
    { id: '1', icon: '📄', title: '项目文档', subtitle: '查看完整的项目文档和API参考' },
    { id: '2', icon: '⚙️', title: '设置', subtitle: '配置应用程序设置和偏好' },
    { id: '3', icon: '❓', title: '帮助中心', subtitle: '获取帮助和支持' },
    { id: '4', icon: 'ℹ️', title: '关于', subtitle: 'Keyer v1.0.0 - 强大的应用启动器' },
    { id: '5', icon: '💬', title: '反馈', subtitle: '报告问题或提出建议' }
  ]

  return (
    <div style={{ padding: '12px' }}>
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            padding: '12px',
            marginBottom: '8px',
            borderRadius: '6px',
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-bg-hover)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--color-bg-secondary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '24px' }}>{item.icon}</div>
            <div>
              <div style={{ color: 'var(--color-text)', fontWeight: '500' }}>
                {item.title}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {item.subtitle}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// SystemInfo 组件
export function SystemInfo() {
  const items = [
    { id: '1', icon: '📊', title: '系统监控', subtitle: '实时查看系统资源使用情况', stats: ['CPU: 23%', '内存: 8.2 GB'] },
    { id: '2', icon: '🌐', title: '网络状态', subtitle: '检查网络连接和速度', stats: ['已连接', '100 Mbps'] },
    { id: '3', icon: '🔋', title: '电池状态', subtitle: '查看电池健康和充电状态', stats: ['87%', '正常'] },
    { id: '4', icon: '💾', title: '存储空间', subtitle: '管理磁盘空间和文件', stats: ['已用 256GB', '可用 256GB'] },
    { id: '5', icon: '🌡️', title: '温度监控', subtitle: '监控系统温度', stats: ['CPU 45°C', 'GPU 38°C'] },
    { id: '6', icon: '⚡', title: '进程管理', subtitle: '查看和管理运行中的进程', stats: ['342个进程', '1856个线程'] }
  ]

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              cursor: 'pointer'
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{item.icon}</div>
            <h3 style={{ color: 'var(--color-text)', fontSize: '16px', marginBottom: '4px' }}>
              {item.title}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
              {item.subtitle}
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {item.stats.map((stat, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text-secondary)'
                  }}
                >
                  {stat}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 导出所有组件
export default {
  Dashboard,
  SimpleList,
  SystemInfo
}
