import Store from 'electron-store';
export const store = new Store()
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'] || ''