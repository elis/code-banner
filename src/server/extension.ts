import * as vscode from 'vscode'
import ExplorerViewProvider from './providers/explorer.view'
import StatusBar from './providers/statusbar'
import { ParsedFile } from '../types'
import { initPlainWatcher } from './watchers/plain'
import { initExecutableWatcher } from './watchers/executable'
import { initEditorWatcher } from './watchers/editors'

export function activate(context: vscode.ExtensionContext) {
  const explorerPanelProvider = new ExplorerViewProvider(context)
  const statusbarProvider = new StatusBar(context)

  const responses: ParsedFile[][] = []
  const handlers = {
    onReady: (files: ParsedFile[]) => {
      console.log('🌈 FILES READY HANDLE FIRED', { files })
      responses.push(files)
      if (responses.length === penders.length) {
        console.log('🌈 PENDING COMPLETE - UPDATING PENDERS', { files })
        const allFiles = responses.reduce((acc, fa) => [...acc, ...fa], [])
        explorerPanelProvider.updateFiles(allFiles)
        statusbarProvider.updateFiles(allFiles)
      }
    },
    onUpdate: (file: ParsedFile) => {
      console.log('🌈 FILE UPDATED HANDLE FIRED', { file })
      explorerPanelProvider.updateFile(file)
      statusbarProvider.updateFile(file)
    },
  }

  const penders = [
    initPlainWatcher(context, { ...handlers }),
    initExecutableWatcher(context, { ...handlers }),
  ]

  initEditorWatcher(context, {
    onVisibileUpdate: (visibleEditors) => {
      console.log('🌈  Vsibility Updated', { visibleEditors })
      explorerPanelProvider.updateVisible(visibleEditors)
      statusbarProvider.updateVisible(visibleEditors)
    },
    onActiveUpdate: (activeEditor) => {
      console.log('🌈  Active Updated', { activeEditor })
      explorerPanelProvider.updateActive(activeEditor)
      statusbarProvider.updateActive(activeEditor)
    },
  })
}
