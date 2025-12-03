import { HStack, ICommand, IExtension, IExtensionStore, Text, Keyer, useExtensionContext, VStack } from "keyerext"
import React from "react"

export default class Ext implements IExtension {
    store?: IExtensionStore;
    enabledPreview = true;

    load(): ICommand[] {
        return [
            {
                icon: '😂',
                name: 'test',
                title: 'Test Command',
                desc: 'This is a test command',
            },
            {
                icon: '📋',
                name: 'context',
                title: 'Extension Context Demo',
                desc: 'Show extension context information',
            }
        ]
    }

    preview(input: string): React.ReactElement | null {
        if (input === '1+1=') {
            return <HStack style={{ paddingLeft: 20 }}><div style={{ fontSize: 36 }}>2</div></HStack>
        }
        return null
    }

    run(name: string): React.ReactElement | null {
        console.log('run command:', name)
        if (name == 'hello') {
            Keyer.clipboard.writeText("hello")
        }
        if (name == 'cmd-window') {
            Keyer.exec('ping www.baidu.com', {
                mode: 'window'
            })
            return null
        }
        if (name == 'cmd-shell') {
            Keyer.exec('ping www.baidu.com', {
                mode: 'terminal'
            })
            return null
        }
        if (name == 'context') {
            return <DemoUI />
        }
        this.store?.set('last-run-command', name)
        return <div>11</div>
    }
}

function DemoUI() {
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