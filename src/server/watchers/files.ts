import * as path from 'path'
import * as vscode from 'vscode'
import * as YAML from 'yaml'
import { extname } from 'path'
import { ParsedFile, ParsedExecutableFile } from '../../types'

export type FileWatcherAPI = {
  onReady: (files: ParsedFile[]) => void
  onUpdate: (file: ParsedFile) => void
}

export const initFileWatcher = async (
  globs: string[] = [],
  context: vscode.ExtensionContext,
  api: FileWatcherAPI,
  executable = false
) => {
  const onUpdate = (newData: ParsedFile) => {
    api.onUpdate(newData)
  }

  const parse = (files: vscode.Uri[]) => parseFiles(files, context, executable)
  const allFiles: vscode.Uri[] = []

  await Promise.all(
    globs.map(async (glob) => {
      const watcher = vscode.workspace.createFileSystemWatcher(glob)
      context.subscriptions.push(
        watcher.onDidChange(
          fileChanged(
            context,
            (data: ParsedFile) => onUpdate(data as ParsedFile),
            executable
          )
        )
      )

      const files = await vscode.workspace.findFiles(glob)
      allFiles.push(...files)
    })
  )

  // Read first time
  if (allFiles.length) {
    const results = (await parse(allFiles)) as ParsedFile[]
    const sorted = results.sort((a, b) => (a.level > b.level ? 1 : -1))

    api.onReady(sorted)
  } else api.onReady([])
}

export const fileChanged =
  (
    context: vscode.ExtensionContext,
    cb: (file: ParsedFile | ParsedExecutableFile) => void,
    executable = false
  ) =>
  async (uri: vscode.Uri) => {
    const parsed = await parseFile(context, executable)(uri)
    cb(parsed)
  }

export const parseFiles = async (
  files: vscode.Uri[],
  context: vscode.ExtensionContext,
  executable = false
): Promise<ParsedFile[]> =>
  Promise.all(files.map(parseFile(context, executable)))

export const parseFile =
  (context: vscode.ExtensionContext, executable = false) =>
  async (uri: vscode.Uri) => {
    const relative = vscode.workspace.asRelativePath(uri)
    const level = relative.split('/').length
    const dirname = path.dirname(relative)

    const workspace = vscode.workspace.getWorkspaceFolder(uri)?.name
    if (!workspace) throw new Error('Unknow file workspace ' + uri.fsPath)
    const { conf } = await ingest(context, executable)(uri)

    return {
      dirname,
      executable,
      conf,
      uri,
      relative,
      level,
      workspace,
    }
  }

export const ingest =
  (context: vscode.ExtensionContext, executable = false) =>
  async (uri: vscode.Uri) => {
    const loaded = executable
      ? await importExecutableFile(uri)
      : await importPlainFile(uri)

    const conf: Record<string, any> = {}
    const sections = 'explorer, scm, debug, test, statusbar'.split(', ')
    for (const section of sections) {
      const keys = Object.keys(loaded).filter(
        (key) => key.split('|').indexOf(section) >= 0
      )
      for (const key of keys) {
        if (loaded[key]) {
          if (executable && typeof loaded[key] === 'function') {
            const data = await loaded[key](uri, context)
            Object.assign(conf, {
              [section]: { ...(conf[section] || {}), ...data },
            })
          } else if (loaded[key])
            Object.assign(conf, {
              [section]: { ...(conf[section] || {}), ...loaded[key] },
            })
        }
      }
    }

    return {
      uri,
      conf,
    }
  }

export const importPlainFile = async (uri: vscode.Uri) => {
  const readData = await vscode.workspace.fs.readFile(uri)
  const ext = extname(uri.fsPath)
  const data = readData.toString()

  if (!ext || ext === '.cb' || ext === '.yml') {
    const yaml = YAML.parse(data, {})

    return yaml
  }
  if (ext === '.json') return JSON.parse(readData.toString())
}

export const importExecutableFile = async (uri: vscode.Uri) => {
  const readData = await vscode.workspace.fs.readFile(uri)
  const name = Math.floor(Math.random() * 1000000000).toString(32)

  const nuri = vscode.Uri.parse(uri.path + name)

  await vscode.workspace.fs.writeFile(nuri, readData)
  const tk = await import(nuri.path)
  await vscode.workspace.fs.delete(nuri)

  return tk
}
