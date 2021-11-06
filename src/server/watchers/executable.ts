import * as vscode from 'vscode'
import { ParsedExecutableFile, ParsedFile } from '../../types'

export type PlainConfigAPI = {
  onReady: (files: ParsedExecutableFile[]) => void
  onUpdate: (file: ParsedExecutableFile) => void
}

export const initExecutableWatcher = async (
  context: vscode.ExtensionContext,
  api: PlainConfigAPI
) => {
  const glob = '**/.pb'
  const watcher = vscode.workspace.createFileSystemWatcher(glob)

  const onUpdate = (newData: ParsedExecutableFile) => {
    api.onUpdate(newData)
  }
  context.subscriptions.push(
    watcher.onDidChange(
      fileChanged(context, (data: ParsedFile) =>
        onUpdate(data as ParsedExecutableFile)
      )
    )
  )

  const parse = (files: vscode.Uri[]) => parseFiles(files, context)

  // Read first time
  const files = await vscode.workspace.findFiles(glob)
  if (files.length) {
    const results = (await parse(files)) as ParsedExecutableFile[]
    const sorted = results.sort((a, b) => (a.level > b.level ? 1 : -1))

    api.onReady(sorted)
  }
}

export const fileChanged =
  (context: vscode.ExtensionContext, cb: (file: ParsedFile) => void) =>
  async (uri: vscode.Uri) => {
    const parsed = await parseFile(context)(uri)
    cb(parsed)
  }

export const parseFiles = async (
  files: vscode.Uri[],
  context: vscode.ExtensionContext
): Promise<ParsedFile[]> => Promise.all(files.map(parseFile(context)))

export const parseFile =
  (context: vscode.ExtensionContext) => async (uri: vscode.Uri) => {
    const relative = vscode.workspace.asRelativePath(uri)
    const level = relative.split('/').length

    const workspace = vscode.workspace.getWorkspaceFolder(uri)?.name
    if (!workspace) throw new Error('Unknow file workspace ' + uri.fsPath)
    const { conf } = await ingest(context)(uri)

    return {
      executable: true,
      conf,
      uri,
      relative,
      level,
      workspace,
    }
  }

export const ingest =
  (context: vscode.ExtensionContext) => async (uri: vscode.Uri) => {
    const loaded = await importFile(uri)

    const conf = {}
    if (loaded.explorer) {
      if (typeof loaded.explorer === 'function') {
        const explorer = await loaded.explorer(uri, context)
        Object.assign(conf, { explorer })
      } else Object.assign(conf, { explorer: loaded.explorer })
    }
    if (loaded.statusbar) {
      if (typeof loaded.statusbar === 'function') {
        const statusbar = await loaded.statusbar(uri, context)
        Object.assign(conf, { statusbar })
      } else Object.assign(conf, { statusbar: loaded.statusbar })
    }

    return {
      uri,
      conf,
    }
  }

export const importFile = async (uri: vscode.Uri) => {
  const readData = await vscode.workspace.fs.readFile(uri)
  const name = Math.floor(Math.random() * 1000000000).toString(32)

  const nuri = vscode.Uri.parse(uri.path + name)

  await vscode.workspace.fs.writeFile(nuri, readData)
  const tk = await import(nuri.path)
  await vscode.workspace.fs.delete(nuri)

  return tk
}
