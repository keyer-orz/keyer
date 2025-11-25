// src/app/utils/log.ts

const isDev = process.env.NODE_ENV !== 'production'

export default class Log {
    static log(...args: any[]) {
        if (isDev) console.log(...args)
    }

    static warn(...args: any[]) {
        if (isDev) console.warn(...args)
    }

    static error(...args: any[]) {
        console.error(...args)
    }
}
