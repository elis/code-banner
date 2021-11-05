import * as vscode from 'vscode'

import { posix } from 'path'
import * as YAML from 'yaml'
import { getNonce } from './utils'
import { Config, ParsedFile } from './executables'

import * as fs from 'fs'
import * as path from 'path'
import * as hash from 'object-hash'

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

    type ImportMediaRequest = {
      type: 'get-webview-uri'

      id: string
      fullpath: string
      workspace: string
    }
    const doImport = async (data: ImportMediaRequest) => {
      const id = data.id
      this.importMedia(data.fullpath, data.workspace)
        .then((importedMedia) => {
          console.log('🧪 result of importedMedia:', { importedMedia, id })
          // const result = webviewView.webview.asWebviewUri(onDiskPath)
          // console.log('🧪 result of webview uri get:', result)
          // console.log(
          //   '🧪 result of webview uri get as string',
          //   result.toString()
          // )
          if (this._view) {
            console.log('🧪 posting message:', {
              importedMedia,
              id,
              type: 'get-webview-uri-' + id,
            })
            this._view.webview.postMessage({
              type: 'get-webview-uri-' + id,
              result: importedMedia,
            })
          }
        })
        .catch((err) => {
          console.log('error with import:', err)
        })
    }
    webviewView.webview.onDidReceiveMessage((data) => {
      console.log('🦮 Message from webview:', data)
      switch (data.type) {
        case 'get-webview-uri': {
          doImport(data)
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
        <div id="root"></div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`
  }

  // const ingest =
  // (context: vscode.ExtensionContext, api: Basics) =>
  // async (uri: vscode.Uri) => {
  //   const loaded = await importFile(uri)
  //   const relative = vscode.workspace.asRelativePath(uri)

  //   // console.log('🦄 Loaded:', { path: uri.path, relative }, loaded)
  //   const conf = {}
  //   if (loaded.explorer) {
  //     if (typeof loaded.explorer === 'function') {
  //       const explorer = await loaded.explorer(uri, context)
  //       Object.assign(conf, { explorer })
  //     } else Object.assign(conf, { explorer: loaded.explorer })
  //   }

  //   return {
  //     uri,
  //     conf,
  //   }

  public async importMedia(fullpath: string, workspaceName: string) {
    console.log('❤️ vscode.workspace.workspaceFolders:', {
      folders: vscode.workspace.workspaceFolders,
      workspaceName,
    })
    const workspace = vscode.workspace.workspaceFolders?.find(
      ({ name }) => name === workspaceName
    )
    if (!workspace)
      return { error: 'No active workspace found ' + workspaceName }
    console.log('❤️ workspace:', { fullpath }, workspace)

    const uri = vscode.Uri.parse(fullpath)
    console.log('❤️ uri of fullpath:', { fullpath }, uri)

    const newpath = vscode.Uri.joinPath(workspace.uri, fullpath)

    console.log('❤️ uri of newpath:', { fullpath }, newpath)

    const newFolderPath = hash({
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

    // const existingFileStat = await fs.promises.stat(newFullpath.fsPath)

    const hashed = hash({ testing: 'yes' })
    console.log('❤️ pathsssssss:', {
      hashed,
      newFolderPath,
      newFileName,
      ext,
      newFullpath,
    })

    await (async () => {
      return vscode.workspace.fs.delete(newFullpath).then(
        () => {
          console.log('file deleted successfuly', newFullpath)
        },
        () => {
          console.log('no file detected', newFullpath)
        }
      )
    })()
    await vscode.workspace.fs.copy(newpath, newFullpath)

    const webviewUri = this._view?.webview.asWebviewUri(newFullpath)

    console.log('❤️❤️❤️❤️ pathsssssss:', {
      ext,
      webviewUri,
      // newFullpath,
      // existingFileStat
    })

    return webviewUri

    // const readData = await vscode.workspace.fs.readFile(uri)

    // console.log('❤️ readed data length:', readData?.length)
    // const hashprops = { fullpath, project: vscode.workspace.name }
    // console.log('❤️ hash props:', hashprops)
    // const tempname = hash({ fullpath, project: vscode.workspace.name })
    // console.log('❤️ hash tempname:', tempname)
    // const ext = path.ext(fullpath)
    // console.log('❤️ ext tempname:', ext)
    // const mediaPath = vscode.Uri.joinPath(
    //   this._extensionUri,
    //   'media/temp/',
    //   tempname + '.' + ext
    // )
    // console.log('❤️ mediapath:', { mediaPath })

    // await vscode.workspace.fs.writeFile()
    // const name = Math.floor(Math.random() * 1000000000).toString(32)

    // const nuri = vscode.Uri.parse(uri.path + name)

    // await vscode.workspace.fs.writeFile(nuri, readData)
    // const tk = await import(nuri.path)
    // await vscode.workspace.fs.delete(nuri)

    // return tk
    // }
  }
}

export default ExplorerViewProvider
