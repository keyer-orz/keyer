import { APIType } from "@/shared/ipc"
import { app } from "electron"

export const appHandler: APIType["app"] = {
  getVersion: () => Promise.resolve(app.getVersion()),
  getName: () => Promise.resolve(app.getName()),

////////////////////////////////////////////////////////////////////////////////