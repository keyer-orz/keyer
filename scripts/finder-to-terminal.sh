#!/bin/bash

# @keyer.id com.keyer.finder-to-terminal
# @keyer.name Finder到终端
# @keyer.desc 在终端中打开当前Finder所在目录

# 获取当前 Finder 窗口的路径
finderPath=$(osascript -e 'tell application "Finder" to if (count of Finder windows) > 0 then get POSIX path of (target of front Finder window as text)')

if [ -z "$finderPath" ]; then
    echo "没有打开的 Finder 窗口"
    exit 1
fi

# 在终端中打开该路径
osascript -e "tell application \"Terminal\"
    activate
    do script \"cd \\\"$finderPath\\\"\"
end tell"

echo "已在终端中打开: $finderPath"
