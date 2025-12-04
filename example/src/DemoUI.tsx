import React from 'react'
import { VStack, HStack, Text, useExtensionContext } from 'keyerext'

/**
 * 演示如何使用 ExtensionContext
 * 扩展可以通过 useExtensionContext() 获取全局属性
 */
export function DemoUI() {
  // 获取扩展上下文
  const { meta } = useExtensionContext()

  return (
    <VStack spacing={16} style={{ padding: '20px', alignItems: 'flex-start' }}>
      <Text size="large" color="title" style={{ fontWeight: 600 }}>
        扩展信息
      </Text>

      <VStack spacing={8} style={{ alignItems: 'flex-start' }}>
        <HStack spacing={8}>
          <Text color="subtitle">扩展dir：</Text>
          <Text color="title">{meta.dir}</Text>
        </HStack>
 
      </VStack>

      <Text size="small" color="subtitle" style={{ marginTop: '20px' }}>
        💡 提示：这些信息由 Keyer 框架自动注入，扩展无需手动配置
      </Text>
    </VStack>
  )
}
