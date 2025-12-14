import { useState } from 'react'
import {
  VStack,
  HStack,
  Text,
  Input,
  Button,
  useNavigation
} from 'keyerext'
import { Keyer } from '@/app/keyer'

export function activeCreateExtension() {
  Keyer.command.registerApp({
    name: 'create_ext',
    title: 'Create Extension',
    desc: 'Create a new extension from template',
    icon: '✨',
  }, () => {
    return <CreateExtPanel />
  })
}

interface ExtensionFormData {
  name: string
  title: string
  desc: string
  targetDir: string
}

export default function CreateExtPanel() {
  const { pop } = useNavigation()
  const [formData, setFormData] = useState<ExtensionFormData>({
    name: '',
    title: '',
    desc: '',
    targetDir: ''
  })
  const [isCreating, setIsCreating] = useState(false)

  const updateField = (field: keyof ExtensionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const selectTargetDirectory = async () => {
    try {
      const result = await Keyer.file.selectDirectory()
      if (result) {
        setFormData(prev => ({ ...prev, targetDir: result }))
      }
    } catch (error) {
      console.error('Failed to select directory:', error)
    }
  }

  const createExtension = async () => {
    if (!formData.name || !formData.title || !formData.targetDir) {
      alert('Please fill in all required fields')
      return
    }

    // Validate extension name (should be kebab-case)
    const nameRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/
    if (!nameRegex.test(formData.name)) {
      alert('Extension name should be in kebab-case (lowercase, hyphens allowed)')
      return
    }

    setIsCreating(true)

    try {
      await Keyer.extensions.create({
        name: formData.name,
        title: formData.title,
        desc: formData.desc,
        targetDir: formData.targetDir
      })

      alert(`Extension "${formData.title}" created successfully!`)
      pop()
    } catch (error) {
      console.error('Failed to create extension:', error)
      alert('Failed to create extension. Check console for details.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <VStack style={{ padding: '10px' }}>
      <Text size="large">Create New Extension</Text>
      <VStack style={{ gap: '16px', marginTop: '20px', flex: 1 }}>
        <HStack>
          <Text style={{ flex: 1 }}>Extension Name *</Text>
          <Input style={{ flex: 2 }}
            placeholder="my-awesome-extension (kebab-case)"
            value={formData.name}
            onChange={(value) => updateField('name', value)}
          />
        </HStack>

        <HStack>
          <Text style={{ flex: 1 }}>Extension Title *</Text>
          <Input style={{ flex: 2 }}
            placeholder="My Awesome Extension"
            value={formData.title}
            onChange={(value) => updateField('title', value)}
          />
        </HStack>

        <HStack>
          <Text style={{ flex: 1 }}>Description</Text>
          <Input style={{ flex: 2 }}
            placeholder="What does this extension do?"
            value={formData.desc}
            onChange={(value) => updateField('desc', value)}
          />
        </HStack>

        <HStack>
          <Text style={{ flex: 1 }}>Target Directory *</Text>
          <HStack style={{ flex: 2 }}>
            <Text
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: 'var(--color-background-secondary)',
                borderRadius: '4px',
                minHeight: '20px',
                color: formData.targetDir ? 'var(--color-text)' : 'var(--color-text-secondary)'
              }}
            >
              {formData.targetDir || 'Select where to create the extension'}
            </Text>
            <Button type='primary' size='small' onClick={selectTargetDirectory}>Browse</Button>
          </HStack>
        </HStack>
      </VStack>

      <HStack style={{ gap: '12px', marginTop: '30px', justifyContent: 'flex-end' }}>
        <Button onClick={pop}>Cancel</Button>
        <Button
          type="primary"
          onClick={createExtension}
          disabled={isCreating || !formData.name || !formData.title || !formData.targetDir}
        >
          {isCreating ? 'Creating...' : 'Create Extension'}
        </Button>
      </HStack>
    </VStack>
  )
}