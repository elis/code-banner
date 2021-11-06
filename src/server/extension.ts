import * as vscode from 'vscode'
import ExplorerViewProvider from './providers/explorer.view'
import StatusBar from './providers/statusbar'
import { ParsedFile } from '../types'
import { initPlainWatcher } from './watchers/plain'
import { initExecutableWatcher } from './watchers/executable'

export function activate(context: vscode.ExtensionContext) {
  const explorerPanelProvider = new ExplorerViewProvider(context)
  const statusbarProvider = new StatusBar(context)

  const handlers = {
    onReady: (files: ParsedFile[]) => {
      explorerPanelProvider.updateFiles(files)
      statusbarProvider.updateFiles(files)
    },
    onUpdate: (file: ParsedFile) => {
      explorerPanelProvider.updateFile(file)
      statusbarProvider.updateFile(file)
    },
  }
  initPlainWatcher(context, { ...handlers })
  initExecutableWatcher(context, { ...handlers })
}
