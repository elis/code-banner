import * as vscode from 'vscode'

import { posix } from 'path'
import * as YAML from 'yaml'
import * as executables from './executables'
import { getNonce } from './utils'

export function activate(context: vscode.ExtensionContext) {
  const provider = new ColorsViewProvider(context.extensionUri)

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ColorsViewProvider.viewType,
      provider
    )
  )

  const executablesWatcher = executables.init(context)
  console.log('👑 Executable watcher initialized', executablesWatcher)

  const watcher2 = vscode.workspace.createFileSystemWatcher('**/.codebanner')

  // const uriPb = context.asAbsolutePath('.pb')
  context.subscriptions.push(watcher2.onDidChange(provider.fileChanged2))
  // vscode.workspace.onDidChangeTextDocument((e) => {
  // 	console.log('somethinng changed', e);
  // 	provider.contentChanged(e)
  // }));

  context.subscriptions.push(
    vscode.commands.registerCommand('calicoColors.addColor', () => {
      provider.addColor()
    })
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('calicoColors.clearColors', () => {
      provider.clearColors()
    })
  )
}

function esm(code: string) {
  // return 'data:text/javascript;base64,' + btoa(code);

  const dataUri =
    'data:text/javascript;charset=utf-8,' + encodeURIComponent(code)
  return dataUri
}

class ColorsViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'calicoColors.colorsView'

  private _view?: vscode.WebviewView

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public async fileChanged(uri: vscode.Uri) {
    console.log('👌🚨 IS PB CHANGED!', uri)

    const readData = await vscode.workspace.fs.readFile(uri)
    const readStr = Buffer.from(readData).toString('utf8')
    console.log('👹 read result:', readStr)
    // const module = await import(uri.path);
    // console.log('👹 module import result:', module, {...module});
    const name = Math.floor(Math.random() * 1000000000).toString(32)

    const nuri = vscode.Uri.parse(uri.path + name)

    await vscode.workspace.fs.writeFile(nuri, readData)
    const tk = await import(nuri.path)
    console.log('👹 loaded:', tk)
    if (tk.try) {
      console.log('👹 trying..:', tk.try)
      const res = await tk.try()
    }
    await vscode.workspace.fs.delete(nuri)
  }
  public async fileChanged2(uri: vscode.Uri) {
    console.log('👌🚨 IS PB CHANGED!', uri)

    const readData = await vscode.workspace.fs.readFile(uri)
    const readStr = Buffer.from(readData).toString('utf8')
    console.log('👹 read result:', readStr)
    // const module = await import(uri.path);
    // console.log('👹 module import result:', module, {...module});
    const parsed = YAML.parse(readStr)
    console.log('👹 parsed:', parsed)
    // const dataUri = esm(readStr)
    // console.log('👹 data uri for import:', dataUri)
    // import(dataUri)
    // 	.then((namespaceObject) => {
    // 		console.log('namespaceObject', namespaceObject)
    // 	})
    // const Fn = Function(readStr)

    // const fnRes = Fn()

    // console.log('FNN RES:', fnRes)
  }

  public contentChanged(e: vscode.TextDocumentChangeEvent) {
    console.log('CONTENTE CHANGED!', e)
    if (e.document.fileName.match(/\/\.pb$/)) {
      console.log('👌 IS PB FILE!', e.document.fileName)
      console.log('👌 TEXT DOCUMENTS!', vscode.workspace.textDocuments)
    }
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
      switch (data.type) {
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
      vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
    )

    // Do the same for the stylesheet.
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css')
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
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleUri}" rel="stylesheet">
				
				<title>Cat Colors</title>
			</head>
			<body>
				<ul class="color-list">
				</ul>

				<button class="add-color-button">Add Color!</button>
				<button class="do-thang">Do da thang!!</button>

				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`
  }
}
