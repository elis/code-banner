import * as vscode from 'vscode'
import ExplorerPanelViewProvider from './providers/views/explorer.panel.view'
import TestPanelViewProvider from './providers/views/test.panel.view'
import DebugPanelViewProvider from './providers/views/debug.panel.view'
import SCMPanelViewProvider from './providers/views/scm.panel.view'
import StatusBar from './providers/statusbar'
import { ParsedFile, UpdateEditor } from '../types'
import { initFileWatcher } from './watchers/files'
import { initEditorWatcher } from './watchers/editors'

export function activate(context: vscode.ExtensionContext) {
  const explorerPanelProvider = new ExplorerPanelViewProvider(context)
  const debugPanelProvider = new DebugPanelViewProvider(context)
  const testPanelProvider = new TestPanelViewProvider(context)
  const scmPanelProvider = new SCMPanelViewProvider(context)
  const statusbarProvider = new StatusBar(context)

  const responses: ParsedFile[][] = []
  let responses2: UpdateEditor[] = []
  let response3: UpdateEditor | undefined

  const readyCheck = {
    active: false,
    filesPlain: false,
    filesExecutable: false,
    visible: false,
  }
  let booted = false

  const checkit = () => {
    if (
      !booted &&
      !Object.values(readyCheck).filter((ready) => !ready).length
    ) {
      const allFiles = responses.reduce((acc, fa) => [...acc, ...fa], [])
      console.log('🌈 PENDING COMPLETE - CHECKS Clear', {
        readyCheck,
        allFiles,
      })
      explorerPanelProvider.updateFiles(allFiles)
      debugPanelProvider.updateFiles(allFiles)
      testPanelProvider.updateFiles(allFiles)
      scmPanelProvider.updateFiles(allFiles)
      statusbarProvider.updateFiles(allFiles)

      explorerPanelProvider.updateVisible(responses2)
      debugPanelProvider.updateVisible(responses2)
      testPanelProvider.updateVisible(responses2)
      scmPanelProvider.updateVisible(responses2)
      statusbarProvider.updateVisible(responses2)

      explorerPanelProvider.updateActive(response3)
      debugPanelProvider.updateActive(response3)
      testPanelProvider.updateActive(response3)
      scmPanelProvider.updateActive(response3)
      statusbarProvider.updateActive(response3)
      booted = true
    }
  }
  const handlers = {
    onReady: (files: ParsedFile[]) => {
      responses.push(files)
      checkit()
    },
    onUpdate: (file: ParsedFile) => {
      explorerPanelProvider.updateFile(file)
      debugPanelProvider.updateFile(file)
      testPanelProvider.updateFile(file)
      scmPanelProvider.updateFile(file)
      statusbarProvider.updateFile(file)
    },
  }

  // initPlainWatcher(context, {
  //   ...handlers,
  //   onReady: (files) => {
  //     readyCheck.filesPlain = true
  //     handlers.onReady(files)
  //   },
  // })
  initFileWatcher(['**/*.cb', '**/*.cb.json', '**/*.cb.yml'], context, {
    ...handlers,
    onReady: (files) => {
      readyCheck.filesPlain = true
      handlers.onReady(files)
    },
  }, false)

  initFileWatcher(['**/*.pb'], context, {
    ...handlers,
    onReady: (files) => {
      readyCheck.filesExecutable = true
      handlers.onReady(files)
    },
  }, true)
  // initExecutableWatcher(context, {
  //   ...handlers,
  //   onReady: (files) => {
  //     readyCheck.filesExecutable = true
  //     handlers.onReady(files)
  //   },
  // })

  initEditorWatcher(context, {
    onVisibileUpdate: (visibleEditors) => {
      responses2 = visibleEditors
      readyCheck.visible = true
      explorerPanelProvider.updateVisible(visibleEditors)
      debugPanelProvider.updateVisible(visibleEditors)
      testPanelProvider.updateVisible(visibleEditors)
      scmPanelProvider.updateVisible(visibleEditors)
      statusbarProvider.updateVisible(visibleEditors)
      checkit()
    },
    onActiveUpdate: (activeEditor) => {
      response3 = activeEditor
      readyCheck.active = true

      explorerPanelProvider.updateActive(activeEditor)
      debugPanelProvider.updateActive(activeEditor)
      testPanelProvider.updateActive(activeEditor)
      scmPanelProvider.updateActive(activeEditor)
      statusbarProvider.updateActive(activeEditor)
      checkit()
    },
  })
}
