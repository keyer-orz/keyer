import { useState } from 'react'
import { VStack, HStack, Text, Button, Loading, useNavigation, FileSelector } from 'keyerext'
import { Keyer } from '@/app/keyer'

export function activeInstallExtension() {
  Keyer.command.registerApp({
    name: "install",
    title: "安装插件",
    desc: "从本地路径安装插件",
    icon: "📦",
  }, () => {
    return <InstallExtension />
  })
}

export function InstallExtension() {
  const { pop } = useNavigation()
  const [selectedPath, setSelectedPath] = useState('')
  const [validating, setValidating] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [validation, setValidation] = useState<{
    valid: boolean
    error?: string
    info?: any
  } | null>(null)

  const handleValidate = async () => {
    if (!selectedPath) return

    setValidating(true)
    try {
      const result = await Keyer.extensions.validateExtension(selectedPath)
      setValidation(result)
    } catch (error) {
      setValidation({
        valid: false,
        error: error instanceof Error ? error.message : '验证失败'
      })
    } finally {
      setValidating(false)
    }
  }

  const handleInstall = async () => {
    if (!selectedPath || !validation?.valid) return

    setInstalling(true)
    try {
      const success = await Keyer.extensions.installUserExtension(selectedPath)
      if (success) {
        alert('插件安装成功！请重启应用以加载新插件。')
        pop()
      } else {
        alert('插件安装失败')
      }
    } catch (error) {
      alert(`安装失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setInstalling(false)
    }
  }

  return (
    <VStack style={{ padding: 20 }}>
      <Text size="large" color="title">安装插件</Text>
      <FileSelector onChange={(path) => setSelectedPath(path)} mode="directory" />
      {selectedPath && !validation && (
        <Button
          type="primary"
          onClick={handleValidate}
          disabled={validating}
        >
          {validating ? <Loading size="small" /> : '检测插件'}
        </Button>
      )}

      {validation && (
        <VStack style={{ gap: '8px', width: '100%', padding: '12px', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
          {validation.valid ? (
            <>
              <Text color="title">✓ 插件检测通过</Text>
              {validation.info && (
                <VStack style={{ gap: '4px' }}>
                  <Text size="small" color="subtitle">名称: {validation.info.name}</Text>
                  <Text size="small" color="subtitle">标题: {validation.info.title}</Text>
                  {validation.info.desc && (
                    <Text size="small" color="subtitle">描述: {validation.info.desc}</Text>
                  )}
                  {validation.info.version && (
                    <Text size="small" color="subtitle">版本: {validation.info.version}</Text>
                  )}
                </VStack>
              )}
            </>
          ) : (
            <>
              <Text color="title">✗ 插件检测失败</Text>
              <Text size="small" color="subtitle">{validation.error}</Text>
            </>
          )}
        </VStack>
      )}

      {validation?.valid && (
        <HStack style={{ gap: '8px', alignSelf: 'flex-end' }}>
          <Button onClick={pop}>取消</Button>
          <Button
            type="primary"
            onClick={handleInstall}
            disabled={installing}
          >
            {installing ? <Loading size="small" /> : '安装'}
          </Button>
        </HStack>
      )}
    </VStack>
  )
}
