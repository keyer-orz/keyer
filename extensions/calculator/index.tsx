import * as React from 'react'
import { IExtension, ICommand } from 'keyerext'

class CalculatorExtension implements IExtension {
  enabledPreview = true

  async onPrepare(): Promise<Partial<ICommand>[]> {
    return []
  }

  doAction(name: string): null {
    return null
  }

  onPreview(input: string): React.ReactElement | null {
    // 只处理以等号结尾的表达式
    if (!input || !input.endsWith('=')) {
      return null
    }

    // 去掉等号
    const expression = input.slice(0, -1).trim()

    if (!expression) {
      return null
    }

    try {
      // 计算表达式
      const result = this.calculate(expression)

      if (result === null) {
        return null
      }

      // 直接返回 React 元素（使用 JSX）
      return (
        <div
          style={{
            padding: '12px 16px',
            fontSize: '32px',
            fontWeight: 500,
            backgroundColor: 'var(--bg-secondary, #f0f0f0)',
            borderRadius: '8px',
            marginBottom: '8px'
          }}
        >
        {result}
        </div>
      )
    } catch (error) {
      return null
    }
  }

  private calculate(expression: string): number | null {
    try {
      // 清理表达式，只保留数字、运算符和小数点
      const sanitized = expression.replace(/[^0-9+\-*/.() ]/g, '')

      if (!sanitized || sanitized !== expression) {
        return null
      }

      // 使用 Function 构造函数安全地计算表达式
      // 这比 eval 更安全，因为它在独立的作用域中执行
      const result = new Function('return ' + sanitized)()

      // 验证结果是有效的数字
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        // 四舍五入到10位小数
        return Math.round(result * 10000000000) / 10000000000
      }

      return null
    } catch (error) {
      return null
    }
  }
}

export default new CalculatorExtension()
