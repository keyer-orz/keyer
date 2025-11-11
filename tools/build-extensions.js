#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const extensionsDir = path.join(__dirname, '../extensions');

// 获取所有扩展目录
const extensions = fs.readdirSync(extensionsDir).filter(file => {
  const fullPath = path.join(extensionsDir, file);
  return fs.statSync(fullPath).isDirectory() &&
         fs.existsSync(path.join(fullPath, 'package.json'));
});

console.log(`Found ${extensions.length} extensions to build:`);
extensions.forEach(ext => console.log(`  - ${ext}`));

// 构建每个扩展
let buildErrors = [];
for (const ext of extensions) {
  const extPath = path.join(extensionsDir, ext);
  const packageJson = JSON.parse(fs.readFileSync(path.join(extPath, 'package.json'), 'utf-8'));

  console.log(`\nBuilding ${ext} (${packageJson.title || packageJson.name})...`);

  try {
    // 检查是否有 build 脚本
    if (packageJson.scripts && packageJson.scripts.build) {
      execSync('npm run build', {
        cwd: extPath,
        stdio: 'inherit'
      });
      console.log(`✓ ${ext} built successfully`);
    } else {
      console.log(`⊘ ${ext} has no build script, skipping`);
    }
  } catch (error) {
    const errorMsg = `✗ ${ext} build failed`;
    console.error(errorMsg);
    buildErrors.push(errorMsg);
  }
}

console.log('\n' + '='.repeat(50));
if (buildErrors.length > 0) {
  console.error(`Build completed with ${buildErrors.length} error(s):`);
  buildErrors.forEach(err => console.error(`  ${err}`));
  process.exit(1);
} else {
  console.log('All extensions built successfully!');
}
