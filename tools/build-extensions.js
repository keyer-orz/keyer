#!/usr/bin/env node

/**
 * 构建所有扩展
 */
const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const extensionsDir = path.join(__dirname, '../../extensions')

if (!fs.existsSync(extensionsDir)) {
  console.log('No extensions directory found, skipping...')
  process.exit(0)
}

const extensions = fs.readdirSync(extensionsDir).filter(name => {
  const extPath = path.join(extensionsDir, name)
  return fs.statSync(extPath).isDirectory() && fs.existsSync(path.join(extPath, 'package.json'))
})

console.log(`Found ${extensions.length} extensions`)

extensions.forEach(ext => {
  const extPath = path.join(extensionsDir, ext)
  console.log(`Building extension: ${ext}`)

  try {
    execSync('npm run build', {
      cwd: extPath,
      stdio: 'inherit'
    })
    console.log(`✓ Built ${ext}`)
  } catch (error) {
    console.error(`✗ Failed to build ${ext}:`, error.message)
  }
})

console.log('All extensions built')
