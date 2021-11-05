import * as vscode from 'vscode'

import { posix } from 'path'
import * as YAML from 'yaml'
import { getNonce } from './utils'
import { Config, ParsedFile } from './executables'

export type TestingResult = {
  output: string
}

export type APIOutline = {
  testing: (input: string) => Promise<TestingResult>
}
class ExplorerViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'codeBanner.explorerPanel'

  private _view?: vscode.WebviewView
  private _context: vscode.ExtensionContext
  private _extensionUri: vscode.Uri

  constructor(context: vscode.ExtensionContext) {
    this._extensionUri = context.extensionUri
    this._context = context
    this.attach()
  }

  private attach() {
    this._context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        ExplorerViewProvider.viewType,
        this
      )
    )
  }

  public async updateFiles(files: ParsedFile[]) {
    console.log('👌🚨 Files updated!', files, { view: this._view })
    if (this._view)
      this._view.webview.postMessage({ type: 'files-updated', files })
  }
  public async updateFile(file: ParsedFile) {
    console.log('👌🚨 File updated!', file, { view: this._view })
    if (this._view)
      this._view.webview.postMessage({ type: 'file-updated', file })
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

    webviewView.webview.postMessage({ type: 'goat', goat: 'behehhheee' })
    webviewView.webview.onDidReceiveMessage((data) => {
      console.log('🦮 Message from webview:', data)
      switch (data.type) {
        case 'get-webview-uri': {
          const onDiskPath = vscode.Uri.file(data.fullpath)
          const result = webviewView.webview.asWebviewUri(onDiskPath)
          console.log('🧪 result of webview uri get:', result)
          console.log('🧪 result of webview uri get as string', result.toString())
          webviewView.webview.postMessage({ type: 'get-webview-uri-' + data.id, result })
          break
        }
        case 'colorSelected': {
          vscode.window.activeTextEditor?.insertSnippet(
            new vscode.SnippetString(`#${data.value}`)
          )
          break
        }
        case 'thangDone': {
          this.thangDoer(context)
          break
        }
      }
    })
  }

  public async thangDoer(context: vscode.WebviewViewResolveContext) {
    const tsUri = vscode.window.activeTextEditor?.document.uri
    if (!tsUri) return
    const jsPath = posix.join(tsUri.path, '..', posix.basename(tsUri.path))
    const jsUri = tsUri.with({ path: jsPath })

    console.log('PATH:', { jsUri, jsPath, tsUriPath: tsUri.path })
    console.log('👹 vscode:', vscode.workspace.workspaceFolders)
    console.log('👹 context:', context)

    try {
      const readData = await vscode.workspace.fs.readFile(jsUri)
      const readStr = Buffer.from(readData).toString('utf8')
      console.log('👹 read result:', readStr)

      const statResult = await vscode.workspace.fs.stat(jsUri)
      console.log('👹 stat result:', statResult)
      // vscode.window.showTextDocument(jsUri, { viewColumn: vscode.ViewColumn.Beside });
    } catch (error) {
      console.log('👹 error:', error)

      vscode.window.showInformationMessage(
        `${jsUri.toString(true)} file does *not* exist`
      )
    }
  }

  public async addRow(conf: Config) {
    // add ew row
    if (!this._view) {
      console.log('🕓 View not ready...', { conf })
    } else {
      console.log('🕓 Adding row...', { conf })
      const result = await this._view.webview.postMessage({ type: 'addRow' })
      console.log('🕓 Add row result:', { result })
    }
  }

  public addColor() {
    if (this._view) {
      this._view.show?.(true) // `show` is not implemented in 1.49 but is for 1.50 insiders
      this._view.webview.postMessage({ type: 'addColor' })
    }
  }

  public clearColors() {
    if (this._view) {
      this._view.webview.postMessage({ type: 'clearColors' })
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
          content="default-src 'none'; img-src ${webview.cspSource} https: ${webview.cspSource.replace('https:', 'vscode-resource:')}  vscode-resource:; script-src ${webview.cspSource}; style-src ${webview.cspSource};"
        />
      
				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleUri}" rel="stylesheet">
				
				<title>Cat Colors</title>
			</head>
			<body>
        <div id="root"></div>
				Ok 🐝

				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`
  }
}

export default ExplorerViewProvider
