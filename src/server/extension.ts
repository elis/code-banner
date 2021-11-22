import * as vscode from 'vscode'
import ExplorerPanelViewProvider from './providers/views/explorer.panel.view'
import TestPanelViewProvider from './providers/views/test.panel.view'
import DebugPanelViewProvider from './providers/views/debug.panel.view'
import SCMPanelViewProvider from './providers/views/scm.panel.view'
import StatusBar from './providers/statusbar'
import { ParsedFile, UpdateEditor } from '../types'
import initFileWatcher from './watchers/files'
import initEditorWatcher from './watchers/editors'
import initThemeWatcher from './watchers/theme'
import { posix } from 'path'

export function activate(context: vscode.ExtensionContext) {
  const explorerPanelProvider = new ExplorerPanelViewProvider(context)
  const debugPanelProvider = new DebugPanelViewProvider(context)
  const testPanelProvider = new TestPanelViewProvider(context)
  const scmPanelProvider = new SCMPanelViewProvider(context)
  const statusbarProvider = new StatusBar(context)

  const responses: ParsedFile[][] = []
  let visibleEditors: UpdateEditor[] = []
  let activeEditor: UpdateEditor | undefined
  let activeTheme: vscode.ColorTheme | undefined
  const channel = vscode.window.createOutputChannel('code-banner')

  channel.appendLine('Code Banner Loading...')

  const extConfig = vscode.workspace.getConfiguration('codeBanner')
  channel.appendLine('Extension Configuration: ' + extConfig)
  // console.log('🌈 🌈 🌈  EXT CONFIGURATION', { extConfig })

  const readyCheck = {
    active: false,
    filesPlain: false,
    filesExecutable: false,
    visible: false,
    theme: false,
  }
  let booted = false

  const checkit = () => {
    // console.log('🌈 Checks...', {
    //   readyCheck,
    // })
    if (
      !booted &&
      !Object.values(readyCheck).filter((ready) => !ready).length
    ) {
      const allFiles = responses.reduce((acc, fa) => [...acc, ...fa], [])
      console.log('🌈 PENDING COMPLETE - CHECKS Clear', {
        readyCheck,
        allFiles,
        visibleEditors,
        activeEditor,
        activeTheme,
      })
      channel.appendLine('🌈 PENDING COMPLETE - CHECKS Clear')

      explorerPanelProvider.updateTheme(activeTheme)
      debugPanelProvider.updateTheme(activeTheme)
      testPanelProvider.updateTheme(activeTheme)
      scmPanelProvider.updateTheme(activeTheme)

      explorerPanelProvider.updateFiles(allFiles)
      debugPanelProvider.updateFiles(allFiles)
      testPanelProvider.updateFiles(allFiles)
      scmPanelProvider.updateFiles(allFiles)
      statusbarProvider.updateFiles(allFiles)

      explorerPanelProvider.updateVisible(visibleEditors)
      debugPanelProvider.updateVisible(visibleEditors)
      testPanelProvider.updateVisible(visibleEditors)
      scmPanelProvider.updateVisible(visibleEditors)
      statusbarProvider.updateVisible(visibleEditors)

      explorerPanelProvider.updateActive(activeEditor)
      debugPanelProvider.updateActive(activeEditor)
      testPanelProvider.updateActive(activeEditor)
      scmPanelProvider.updateActive(activeEditor)
      statusbarProvider.updateActive(activeEditor)
      booted = true
    }

    const isWorkspaceOpen = () => {
      if (!vscode.workspace.workspaceFolders) {
        vscode.window.showErrorMessage('No Folders Open')
        return false
      }
    }

    // Command palette menus
    context.subscriptions.push(
      vscode.commands.registerCommand(
        'code-banner.generateBasicCBFile',
        async () => {
          if (!isWorkspaceOpen()) return null
          vscode.window.showInformationMessage('Generate Basic File')
          const root = vscode.workspace.workspaceFolders![0]!.uri
          const uri = root.with({ path: posix.join(root.path, '.cb') })
          await vscode.workspace.fs.writeFile(uri, Buffer.from(''))
        }
      )
    )

    context.subscriptions.push(
      vscode.commands.registerCommand(
        'code-banner.generateExtensionSpecificCBFile',
        async () => {
          if (!isWorkspaceOpen()) return null
          vscode.window.showInformationMessage(
            'Generate Extension Specific File'
          )
        }
      )
    )

    context.subscriptions.push(
      vscode.commands.registerCommand(
        'code-banner.guidedSetUpCBFile',
        async () => {
          if (!isWorkspaceOpen()) return null
          vscode.window.showInformationMessage('Guided Set-Up')
        }
      )
    )
  }
  const handlers = {
    onReady: (files: ParsedFile[]) => {
      responses.push(files)
      checkit()
    },
    onUpdate: (file: ParsedFile | undefined) => {
      if (!file) return

      explorerPanelProvider.updateFile(file)
      debugPanelProvider.updateFile(file)
      testPanelProvider.updateFile(file)
      scmPanelProvider.updateFile(file)
      statusbarProvider.updateFile(file)
    },
  }

  // Plain (.cb, .cb.json, .cb.yml)
  initFileWatcher(
    ['**/*.cb', '**/*.cb.json', '**/*.cb.yml'],
    context,
    {
      ...handlers,
      onReady: (files) => {
        channel.appendLine('Plain files ready')
        readyCheck.filesPlain = true
        handlers.onReady(files)
      },
    },
    false,
    channel
  )

  // Executable (.pb)
  initFileWatcher(
    ['**/*.pb'],
    context,
    {
      onUpdate: (file: ParsedFile) => {
        const extConfig = vscode.workspace.getConfiguration('codeBanner')
        // console.log('🌈 🌈 🌈  EXT CONFIGURATION', { extConfig })

        handlers.onUpdate(
          vscode.workspace.isTrusted && extConfig.allowExecutableConfiguration
            ? file
            : undefined
        )
      },
      onReady: (files) => {
        const extConfig = vscode.workspace.getConfiguration('codeBanner')
        // console.log('🌈 🌈 🌈  EXT CONFIGURATION', { extConfig })
        channel.appendLine('Executable files ready')

        if (
          !(
            vscode.workspace.isTrusted && extConfig.allowExecutableConfiguration
          )
        )
          channel.appendLine('Executable files ignored - untrusted workspace')

        readyCheck.filesExecutable = true
        handlers.onReady(
          vscode.workspace.isTrusted && extConfig.allowExecutableConfiguration
            ? files
            : []
        )
      },
    },
    true,
    channel
  )

  initEditorWatcher(context, {
    onVisibileUpdate: (editors) => {
      visibleEditors = editors
      // console.log('🌈 🌈 🌈  VISIBLE EDITORS UPDATED', { editors })
      readyCheck.visible = true
      explorerPanelProvider.updateVisible(editors)
      debugPanelProvider.updateVisible(editors)
      testPanelProvider.updateVisible(editors)
      scmPanelProvider.updateVisible(editors)
      statusbarProvider.updateVisible(editors)
      checkit()
    },
    onActiveUpdate: (editor) => {
      activeEditor = editor
      // console.log('🌈 🌈 🌈  ACTIVE EDITOR UPDATED', { editor })
      readyCheck.active = true

      explorerPanelProvider.updateActive(editor)
      debugPanelProvider.updateActive(editor)
      testPanelProvider.updateActive(editor)
      scmPanelProvider.updateActive(editor)
      statusbarProvider.updateActive(editor)
      checkit()
    },
  })

  initThemeWatcher(context, {
    onReady: (theme: vscode.ColorTheme) => {
      readyCheck.theme = true
      activeTheme = theme
    },
    onUpdate: (theme: vscode.ColorTheme) => {
      activeTheme = theme

      explorerPanelProvider.updateTheme(theme)
      debugPanelProvider.updateTheme(theme)
      testPanelProvider.updateTheme(theme)
      scmPanelProvider.updateTheme(theme)
    },
  })
}
