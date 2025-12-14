import { ExtensionPackageInfo } from "./render-api"
import { Keyer } from '@/app/keyer'
import * as Keyerext from 'keyerext';
import { ExtensionCommand } from '@/app/keyer/command'
import { ExtensionStore } from "@/app/managers/ExtensionStore";
import Module from "module";
import React from "react";
import * as fs from 'fs';
import path from "path";
import { toastImpl } from "@/app/keyer/toast";

export class ExtensionConfig {
    _keyer: any
    pkgInfo: ExtensionPackageInfo

    constructor(pkgInfo: ExtensionPackageInfo) {
        this.pkgInfo = pkgInfo
    }

    get keyer() {
        if (!this._keyer) {
            this._keyer = new Proxy(Keyer, {
                get: (target, prop) => {
                    if (prop === 'command') return new ExtensionCommand(this.pkgInfo)
                    if (prop === 'store') return new ExtensionStore(this.pkgInfo.name)
                    return target[prop as keyof typeof Keyer]
                }
            })
        }
        return this._keyer
    }
}

export const extensionMap = new Map<string, ExtensionConfig>()
const fileToConfigCache = new Map<string, ExtensionConfig | null>()

const originalLoad = (Module as any)._load
let isGlobalInterceptorSet = false

export function setupGlobalModuleInterceptor() {
    if (isGlobalInterceptorSet) return
    console.log("Setting up global module interceptor")
        ; (Module as any)._load = function (request: string, parent: any) {
            console.log('request', request, extensionMap)
            if (request !== 'react' && request !== 'react/jsx-runtime' && request !== 'keyerext') {
                return originalLoad.apply(this, arguments)
            }

            const filename = parent?.filename
            if (!filename) {
                return originalLoad.apply(this, arguments)
            }

            let config = fileToConfigCache.get(filename)

            if (config === undefined) {
                config = null
                for (const [extDir, extConfig] of extensionMap.entries()) {
                    if (filename.startsWith(extDir)) {
                        config = extConfig
                        break
                    }
                }
                fileToConfigCache.set(filename, config)
            }

            if (config) {
                
                if (request === 'react') return React
                if (request === 'react/jsx-runtime') return require('react/jsx-runtime')
                if (request === 'keyerext') {
                    return {
                        ...Keyerext,
                        Keyer: config.keyer
                    }
                }
            }

            return originalLoad.apply(this, arguments)
        }
    isGlobalInterceptorSet = true
}


export function loadModule(filePath: string) {
    if (!fs.existsSync(filePath)) {
        return null
    }

    console.log("LoadModule filePath:", filePath)

    const pluginCode = fs.readFileSync(filePath, 'utf-8')
    const pluginModule = new Module(filePath, module)

    pluginModule.paths = (Module as any)._nodeModulePaths(path.dirname(filePath))
    pluginModule.filename = filePath

    pluginModule.require = function (id: string) {
        return (Module as any)._load(id, pluginModule, false)
    } as any

    // @ts-ignore - _compile 是内部 API
    pluginModule._compile(pluginCode, filePath)
    return pluginModule
}