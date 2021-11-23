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
      return true
    }

    const isCBFileExists = async (filePath: any) => {
      try {
        await vscode.workspace.fs.stat(filePath)
        return true
      } catch {
        return false
      }
    }

    const openFileShowMessages = (filePath: any) => {
      vscode.workspace.openTextDocument(filePath).then((doc) => {
        vscode.window.showTextDocument(doc)
      })
      vscode.window.showWarningMessage(
        'Code Banner: Change File Type To YAML, Then Save File'
      )
    }

    const generateFilePath = () => {
      const root = vscode.workspace.workspaceFolders![0]!.uri
      return root.with({ path: posix.join(root.path, '.cb') })
    }

    const createCBFile = async (filePath: any, code: string) => {
      await vscode.workspace.fs.writeFile(filePath, Buffer.from(code))
    }

    const preCreation = async (type: string) => {
      let code = ''
      switch (type) {
        case 'basic':
          code = baseFiles.basic
          break
        case 'advanced':
          code = baseFiles.advanced
          break
        default:
          code = 'Something went wrong in createFile()'
          break
      }
      const filePath = generateFilePath()

      if (await isCBFileExists(filePath)) {
        vscode.window
          .showWarningMessage(
            'Do you want to do overwrite and lose your Code Banner?',
            ...['Yes', 'No']
          )
          .then(async (answer) => {
            if (answer === 'Yes') {
              await createCBFile(filePath, code)
              openFileShowMessages(filePath)
            } else return null
          })
      } else {
        await createCBFile(filePath, code)
        openFileShowMessages(filePath)
      }
    }
    // Command palette menus
    context.subscriptions.push(
      vscode.commands.registerCommand(
        'code-banner.generateBasicCBFile',
        async () => {
          if (!isWorkspaceOpen()) return null
          preCreation('basic')
        }
      )
    )

    context.subscriptions.push(
      vscode.commands.registerCommand(
        'code-banner.generateAdvancedCBFIle',
        async () => {
          if (!isWorkspaceOpen()) return null
          preCreation('advanced')
        }
      )
    )

    context.subscriptions.push(
      vscode.commands.registerCommand('code-banner.showReadMe', async () => {
        const readmePath = context.asAbsolutePath('README.md')
        vscode.commands.executeCommand(
          'markdown.showPreview',
          vscode.Uri.file(readmePath)
        )
      })
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

const baseFiles = {
  basic: `explorer:
  rows:
    - items:
        - type: container
          style:
            display: flex
            flexDirection: row
            padding: 3px
            columnGap: 3px
          items:
            - type: svg
              elementStyle:
                width: 50
              url: https://cdn.worldvectorlogo.com/logos/typescript-2.svg
            - type: container
              style:
                marginLeft: 8px
                display: flex
                flexDirection: column
                justifyContent: center
                rowGap: 3px
              items:
                - type: text
                  text: Title
                  style:
                    fontSize: 20px
                - type: text
                  text: See Readme for more info about Code Banner
`,
  advanced: `explorer:
  rows:
    - items:
        - type: container
          style:
            display: flex
            flexDirection: row
            padding: 3px
            columnGap: 3px
          items:
            - type: svg
              elementStyle:
                width: 50
              url: https://cdn.worldvectorlogo.com/logos/typescript-2.svg
            - type: container
              style:
                marginLeft: 8px
                display: flex
                flexDirection: column
                justifyContent: center
                rowGap: 3px
              items:
                - type: text
                  text: Title
                  style:
                    fontSize: 20px
                - type: text
                  text: See Readme for more info about Code Banner
    - glob:
        - "**/.cb"
        - "**/*.js"
      items:
        - type: svg
          style:
            flex: 0 0 30px
            padding: 4px
          elementStyle:
            borderRadius: 3px
            overflow: hidden
          svg: https://cdn.worldvectorlogo.com/logos/logo-javascript.svg
        - type: svg
          style:
            flex: 0 0 30px
            padding: 4px
          elementStyle:
            borderRadius: 3px
            overflow: hidden
            transform: rotate(180deg)
          url: https://cdn.worldvectorlogo.com/logos/visual-studio-code-1.svg
        - type: markdown
          markdown: This will show only when \`*.js\` or \`.cb\` files have visible editors
`,
}
