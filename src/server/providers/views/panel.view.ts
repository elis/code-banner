import * as vscode from 'vscode'
import * as hash from 'object-hash'
import * as objectPath from 'object-path'
import * as path from 'path'
import * as YAML from 'yaml'

import { escapeRegex, getNonce } from '../../utils'
import { ParsedFile, UpdateEditor } from '../../../types'
import { dirname } from 'path'

export type TestingResult = {
  output: string
}

export type APIOutline = {
  testing: (input: string) => Promise<TestingResult>
}

export type ResponseRequest = {
  id: string
  type: string
  payload: {
    caller?: string
    workspace?: string
    [key: string]: any
  }
}
class PanelViewProvider implements vscode.WebviewViewProvider {
  protected viewContainer = 'custom'

  protected _view?: vscode.WebviewView
  protected _context: vscode.ExtensionContext
  protected _extensionUri: vscode.Uri

  protected _cache: {
    files: ParsedFile[]
    visibleEditors: UpdateEditor[]
    activeEditor?: UpdateEditor
    activeTheme?: vscode.ColorTheme
  } = {
    files: [],
    visibleEditors: [],
  }

  constructor(context: vscode.ExtensionContext) {
    this._extensionUri = context.extensionUri
    this._context = context
    this.attach()
  }

  protected attach() {
    // noop
  }

  public async updateTheme(theme?: vscode.ColorTheme) {
    this._cache.activeTheme = theme

    if (this._view)
      this._view.webview.postMessage({ type: 'theme-updated', theme })
  }

  public async updateFiles(files: ParsedFile[]) {
    this._cache.files = files

    if (this._view)
      this._view.webview.postMessage({ type: 'files-updated', files })
  }
  public async updateFile(file: ParsedFile) {
    this._cache.files = this._cache.files.map((ec) =>
      ec.relative === file.relative && ec.workspace === file.workspace
        ? { ...ec, conf: file.conf }
        : ec
    )
    if (this._view)
      this._view.webview.postMessage({ type: 'file-updated', file })
  }

  public async updateVisible(editors: UpdateEditor[]) {
    this._cache.visibleEditors = editors
    if (this._view)
      this._view.webview.postMessage({ type: 'visible-updated', editors })
  }

  public async updateActive(editor?: UpdateEditor) {
    this._cache.activeEditor = editor
    if (this._view)
      this._view.webview.postMessage({ type: 'active-updated', editor })
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    }

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview)

    webviewView.webview.onDidReceiveMessage((data) => {
      if (data.id) {
        // Request expecting response
        this._handleClientRequest(data)
        return
      }
    })
  }

  private async _handleClientRequest(data: ResponseRequest) {
    const respond = (result: any) => {
      this._view?.webview.postMessage({
        type: data.type + '-' + data.id,
        result,
      })
    }
    // ! bootup
    if (data.type === 'bootup') {
      respond({ ...this._cache })
    }

    // ! parse-text-content
    else if (data.type === 'parse-text-content') {
      const text = data.payload.text?.toString()
      let response = text
      const replacables = text.match(/(\$\(([^)]*)+\))+/g)
      if (replacables?.length > 0)
        for (const item of replacables) {
          const [, x] = item.match(/^\$\(([^)]+)\)$/)
          const [v, defs, missing] = x.split(', ')

          // Support for $(dir/file.yaml, some.path)
          if (v.match(/.(json|ya?ml)$/)) {
            const workspace = vscode.workspace.workspaceFolders?.find(
              (f) => f.name === data.payload.workspace
            )
            if (!workspace) continue

            const callerDirname = this._cache.files.find(
              (file) => file.relative === data.payload.caller
            )?.dirname

            const jsonUri = vscode.Uri.file(
              path.join(workspace?.uri.fsPath, callerDirname || '', v)
            )

            try {
              const buffer = await vscode.workspace.fs.readFile(jsonUri)
              const jsonData = buffer.toString()

              const json =
                ['yml', 'yaml'].indexOf(v.match(/.(json|ya?ml)$/)[1]) >= 0
                  ? YAML.parse(jsonData)
                  : JSON.parse(jsonData)
              const result =
                objectPath.get(json, defs) ||
                objectPath.get(json, defs.split(':'), missing)
              response = response.replace(
                new RegExp(`${escapeRegex(item)}`, 'g'),
                result
              )
            } catch (err) {
              response = { error: err }
            }
          }

          // Support for `$(package.some.path)`
          else if (v.match(/^package\./)) {
            const workspace = vscode.workspace.workspaceFolders?.find(
              (f) => f.name === data.payload.workspace
            )
            if (!workspace) continue

            const packageUri = vscode.Uri.file(
              path.join(workspace?.uri.fsPath, 'package.json')
            )

            try {
              const buffer = await vscode.workspace.fs.readFile(packageUri)
              const jsonData = buffer.toString()

              const packagej = JSON.parse(jsonData)
              const result =
                objectPath.get({ package: packagej }, v) || defs || missing
              response = response.replace(
                new RegExp(`${escapeRegex(item)}`, 'g'),
                result
              )
            } catch (err) {
              console.log(
                'Error loading package.json in root workspace:',
                { err },
                { packageUri, v }
              )
              response = { error: err }
            }
          }
        }

      respond(response)
    }

    // ! execute-command
    else if (data.type === 'open-external') {
      const uri = vscode.Uri.parse(data.payload.url || data.payload.path)
      vscode.env.openExternal(uri).then(
        () => respond('success'),
        (error) => {
          vscode.window.showErrorMessage('Unable to open external: ' + error)
          respond({ error })
        }
      )
    }

    // ! execute-command
    else if (data.type === 'execute-command') {
      console.log('🧑‍🦳 Execute command:', { data })

      const makeCommand = (
        command: string,
        args?: string[],
        caller?: string,
        workspaceName?: string
      ) => {
        if (!command) throw new Error('Command not provided')

        const [fullpath] = command
        const workspace = vscode.workspace.workspaceFolders?.find(
          ({ name }) => name === workspaceName
        )
        const callerDirname = dirname(caller || '')

        if (command === 'vscode.openFolder') {
          const uri = vscode.Uri.file(
            workspace
              ? vscode.Uri.joinPath(
                  workspace.uri,
                  callerDirname,
                  args?.[0] || ''
                ).fsPath
              : args?.[0] || ''
          )
          return { command, args: [uri] }
        } else if (command === 'vscode.open') {
          const uri = vscode.Uri.file(
            workspace
              ? vscode.Uri.joinPath(
                  workspace.uri,
                  callerDirname,
                  args?.[0] || ''
                ).fsPath
              : args?.[0] || ''
          )
          return { command, args: [uri] }
        }

        return { command, args }
      }

      const { command, args } = makeCommand(
        data.payload.command,
        data.payload.args,
        data.payload.caller,
        data.payload.workspace
      )
      
      // const commands = await vscode.commands.getCommands()
      if (command === 'workbench.action.terminal.newWithCwd') {
        vscode.commands
          .executeCommand(command, {
            cwd: args?.[0] || '',
          })
          .then(() => {
            respond('success')
          })
      } else if (command === 'workbench.action.terminal.sendSequence') {
        const hexToBytes = (hex: string) => {
          // eslint-disable-next-line no-var
          for (var bytes = [], c = 0; c < hex.length; c += 2)
            bytes.push(parseInt(hex.substr(c, 2), 16))
          return bytes
        }
        const repped =
          typeof args?.[0] === 'string'
            ? args[0].replace(/(\\u([0-9a-f]{4}))/gi, (...args) => {
                return String.fromCharCode(...hexToBytes(args[2]))
              })
            : args?.[0]
            
        vscode.commands
          .executeCommand(command, {
            text: repped || 'echo Not Found\u000D',
          })
          .then(() => {
            respond('success')
          })
      } else {
        vscode.commands
          .executeCommand(command, ...(args || []))
          .then(() => {
            respond('success')
          })
      }
    }

    // ! get-webview-uri
    else if (data.type === 'get-webview-uri') {
      this.importMedia(
        data.payload.fullpath,
        data.payload.workspace || '',
        data.payload.caller || ''
      )
        .then((importedMedia) => {
          respond(importedMedia)
        })
        .catch((error) => {
          respond({ error })
        })
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
    const scriptUri = webview.asWebviewUri(
      // vscode.Uri.joinPath(this._extensionUri, 'media', 'code-banner.js')
      vscode.Uri.joinPath(this._extensionUri, 'out/client/', 'code-banner.js')
    )
    // Do the same for the stylesheet.
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'out/client/', 'code-banner.css')
    )
    const codiconsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        'node_modules',
        '@vscode/codicons',
        'dist',
        'codicon.css'
      )
    )

    const tailwindsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        'node_modules',
        'tailwindcss',
        'dist',
        'tailwind.css'
      )
    )

    // const uitoolkitUri = webview.asWebviewUri(
    //   vscode.Uri.joinPath(
    //     this._extensionUri,
    //     'node_modules',
    //     '@vscode',
    //     'webview-ui-toolkit',
    //     'dist',
    //     'toolkit.js'
    //   )
    // )
    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce()

    return `<!DOCTYPE html>
			<html class="${
        this._cache.activeTheme?.kind === vscode.ColorThemeKind.Dark
          ? 'dark'
          : ''
      }" lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
        <meta
          http-equiv="Content-Security-Policy"
          content="default-src 'none'; img-src ${
            webview.cspSource
          } https:; font-src ${webview.cspSource}; script-src ${
      webview.cspSource
    }; style-src ${webview.cspSource};"
        />
      
				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleUri}" rel="stylesheet">
				<link href="${codiconsUri}" rel="stylesheet">
				<link href="${tailwindsUri}" rel="stylesheet">
				
				<title>Cat Colors</title>
			</head>
			<body>
        <div id="root" data-view-container="${this.viewContainer}"></div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`
  }

  public async importMedia(
    fullpath: string,
    workspaceName: string,
    caller: string
  ) {
    const workspace = vscode.workspace.workspaceFolders?.find(
      ({ name }) => name === workspaceName
    )

    if (!workspace)
      return { error: 'No active workspace found ' + workspaceName }

    const relPath = fullpath.replace(workspace.uri.fsPath, '')

    const callerDirname = this._cache.files.find(
      (file) => file.relative === caller
    )?.dirname

    const newpath = vscode.Uri.joinPath(
      workspace.uri,
      callerDirname || '',
      relPath
    )

    const newFolderPath = hash({
      caller,
      workspaceName,
      workspacePath: workspace.uri.fsPath,
    })
    const newFileName = hash({ relPath, workspaceName })
    const ext = path.extname(fullpath)
    const newFullpath = vscode.Uri.joinPath(
      this._extensionUri,
      'media/cache',
      newFolderPath,
      `${newFileName}${ext}`
    )

    await (async () => {
      return vscode.workspace.fs.delete(newFullpath).then(
        () => {
          // noop
        },
        () => {
          // noop
        }
      )
    })()
    await vscode.workspace.fs.copy(newpath, newFullpath)

    const webviewUri = this._view?.webview.asWebviewUri(newFullpath)

    return webviewUri
  }
}

export default PanelViewProvider
