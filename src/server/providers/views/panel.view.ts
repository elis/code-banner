import * as vscode from 'vscode'
import * as hash from 'object-hash'
import * as path from 'path'

import { getNonce } from '../../utils'
import { ParsedFile, UpdateEditor } from '../../../types'

export type TestingResult = {
  output: string
}

export type APIOutline = {
  testing: (input: string) => Promise<TestingResult>
}

export type ResponseRequest = {
  id: string
  type: string
  payload: Record<string, any>
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
    const respond = (result: any) =>
      this._view?.webview.postMessage({
        type: data.type + '-' + data.id,
        result,
      })

    // ! bootup
    if (data.type === 'bootup') {
      respond({ ...this._cache })
    }

    // ! get-webview-uri
    else if (data.type === 'get-webview-uri') {
      import(data.payload.fullpath)
      this.importMedia(
        data.payload.fullpath,
        data.payload.workspace,
        data.payload.caller
      ).then((importedMedia) => {
        respond(importedMedia)
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

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce()

    return `<!DOCTYPE html>
			<html lang="en">
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
          } https: ${webview.cspSource.replace(
      'https:',
      'vscode-resource:'
    )}  vscode-resource:; script-src ${webview.cspSource}; style-src ${
      webview.cspSource
    };"
        />
      
				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleUri}" rel="stylesheet">
				
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

    const uri = vscode.Uri.parse(fullpath)

    const newpath = vscode.Uri.joinPath(workspace.uri, fullpath)

    const newFolderPath = hash({
      caller,
      workspaceName,
      workspacePath: workspace.uri.fsPath,
    })
    const newFileName = hash({ fullpath, workspaceName })
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
