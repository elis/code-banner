import * as vscode from 'vscode'
import ExplorerViewProvider from './explorer.view'

export type Basics = {
  explorerPanel: ExplorerViewProvider
  onReady: (files: ParsedFile[]) => void
  onUpdate: (file: ParsedFile) => void
}
export const init = async (context: vscode.ExtensionContext, api: Basics) => {
  // const provider = new ExecutablesProvider(context.extensionUri)
  const watcher = vscode.workspace.createFileSystemWatcher('**/.pb')

  const onUpdate = (newData: ParsedFile) => {
    console.log('new data:', { newData })
    api.onUpdate(newData)
  }
  context.subscriptions.push(
    watcher.onDidChange(fileChanged(context, api, onUpdate))
  )

  console.log('🪳🪳🪳🪳 WATCHER EXECUTABLES INITIALIZED.')
  const parse = (files: vscode.Uri[]) => parseFiles(files, context, api)

  // Read first time
  const files = await vscode.workspace.findFiles('**/.pb')
  console.log('🪳🪳🪳🪳 files found:', { files })
  if (files.length) {
    const results = await parse(files)
    const sorted = results.sort((a, b) => (a.level > b.level ? 1 : -1))

    sorted.forEach(({ relative, conf, level }) => {
      console.log('🪳🪳🪳🪳 Adding row:', { relative, conf, level })
      api.explorerPanel.addRow(conf)
    })
    api.onReady(sorted)
    console.log('🪳🪳🪳🪳 sorted:', { sorted })
  }

  return watcher
}

export type ItemBase = {
  type: string
}

export type ItemText = ItemBase & {
  type: 'text'
  text: string
}

export type Item = ItemBase | ItemText

export type Config = {
  explorer?: {
    items?: Item[]
  }
}

export type ParsedFile = {
  level: number
  uri: vscode.Uri
  conf: Config
  relative: string
}

const parseFiles = async (
  files: vscode.Uri[],
  context: vscode.ExtensionContext,
  api: Basics
): Promise<ParsedFile[]> => {
  const results = await Promise.all(files.map(parseFile(context, api)))
  // console.log('🀄️ Parsing results:', results)

  // const output = results
  //   .map(({ uri, conf }) => ({
  //     conf,
  //     uri,
  //     relative: vscode.workspace.asRelativePath(uri),
  //     level: vscode.workspace.asRelativePath(uri).split('/').length
  //   }))

  // console.log('🀄️ output:', output)
  return results
}

const parseFile =
  (context: vscode.ExtensionContext, api: Basics) =>
  async (uri: vscode.Uri) => {
    const { conf } = await ingest(context, api)(uri)

    return {
      conf,
      uri,
      relative: vscode.workspace.asRelativePath(uri),
      level: vscode.workspace.asRelativePath(uri).split('/').length,
    }
  }

const ingest =
  (context: vscode.ExtensionContext, api: Basics) =>
  async (uri: vscode.Uri) => {
    const loaded = await importFile(uri)
    const relative = vscode.workspace.asRelativePath(uri)

    // console.log('🦄 Loaded:', { path: uri.path, relative }, loaded)
    const conf = {}
    if (loaded.explorer) {
      if (typeof loaded.explorer === 'function') {
        const explorer = await loaded.explorer(uri, context)
        Object.assign(conf, { explorer })
      } else Object.assign(conf, { explorer: loaded.explorer })
    }

    return {
      uri,
      conf,
    }
  }

const importFile = async (uri: vscode.Uri) => {
  const readData = await vscode.workspace.fs.readFile(uri)
  const name = Math.floor(Math.random() * 1000000000).toString(32)

  const nuri = vscode.Uri.parse(uri.path + name)

  await vscode.workspace.fs.writeFile(nuri, readData)
  const tk = await import(nuri.path)
  await vscode.workspace.fs.delete(nuri)

  return tk
}

const fileChanged =
  (
    context: vscode.ExtensionContext,
    api: Basics,
    cb: (file: ParsedFile) => void
  ) =>
  async (uri: vscode.Uri) => {
    console.log('👌🚨 IS PB CHANGED!', uri)

    const parsed = await parseFile(context, api)(uri)
    console.log('👌🚨 File parsed!', { parsed })

    cb(parsed)
    // const readData = await vscode.workspace.fs.readFile(uri)
    // const readStr = Buffer.from(readData).toString('utf8')
    // console.log('👹 read result:', readStr)
    // // const module = await import(uri.path);
    // // console.log('👹 module import result:', module, {...module});
    // const name = Math.floor(Math.random() * 1000000000).toString(32)

    // const nuri = vscode.Uri.parse(uri.path + name)

    // await vscode.workspace.fs.writeFile(nuri, readData)
    // const tk = await import(nuri.path)
    // console.log('👹 loaded:', tk)
    // if (tk.try) {
    //   console.log('👹 trying..:', tk.try)
    //   const res = await tk.try()
    // }
    // await vscode.workspace.fs.delete(nuri)
  }
