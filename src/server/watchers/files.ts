/* eslint-disable @typescript-eslint/no-var-requires */
import * as path from 'path'
import * as vscode from 'vscode'
import * as YAML from 'yaml'
import { extname } from 'path'
import { transform } from 'esbuild'
import { ParsedFile, ParsedExecutableFile } from '../../types'
import { YAMLSemanticError, YAMLSyntaxError } from 'yaml/util'
import { escapeRegex } from '../utils'

export type FileWatcherAPI = {
  onReady: (files: ParsedFile[]) => void
  onUpdate: (file: ParsedFile) => void
}

const initFileWatcher = async (
  globs: string[] = [],
  context: vscode.ExtensionContext,
  api: FileWatcherAPI,
  executable = false,
  channel: vscode.OutputChannel
) => {
  const onUpdate = (newData: ParsedFile) => {
    api.onUpdate(newData)
  }
  // console.log('⚠️🌈 Initializing file watcher', { executable })
  channel.appendLine(
    '⚠️🌈 Initializing file watcher - ' + (executable ? 'Executables' : 'Plain')
  )

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
  channel.appendLine(
    '⚠️🌈 File watcher - ' +
      (executable ? 'Executables' : 'Plain') +
      ' - found ' +
      allFiles.length +
      ' files'
  )
  for (const file of allFiles) {
    const relative = vscode.workspace.asRelativePath(file)
    channel.appendLine(
      '⚠️🌈\t\t File watcher - ' +
        (executable ? 'Executables' : 'Plain') +
        ' - found ' +
        relative
    )
    channel.appendLine('⚠️🌈\t\t Depth: ' + relative.split('/').length)
  }

  // console.log('⚠️🌈 ALLFILES', { allFiles })

  // Read first time
  if (allFiles.length) {
    const results = (await parse(allFiles)) as ParsedFile[]
    const sorted = results.sort((a, b) => (a.level > b.level ? 1 : -1))
    channel.appendLine(
      '⚠️🌈 File watcher - ' +
        (executable ? 'Executables' : 'Plain') +
        ' - found ' +
        allFiles.length +
        ' files'
    )
    for (const file of allFiles) {
      const relative = vscode.workspace.asRelativePath(file)
      channel.appendLine(
        '⚠️🌈\t\t File watcher - ' +
          (executable ? 'Executables' : 'Plain') +
          ' - found ' +
          relative
      )
      channel.appendLine('⚠️🌈\t\t Depth: ' + relative.split('/').length)
    }
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
    // console.log('⚠️🌈 INGESTING', { uri }, { executable })
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
    try {
      const yaml = YAML.parse(data.replace(new RegExp(`(\t)`, 'g'), '  '), {})

      return yaml
    } catch (error) {
      if (error instanceof YAMLSyntaxError)
        vscode.window.showErrorMessage(
          `Error parsing YAML file\n\nError: ${error.message}`
        )
      else if (error instanceof YAMLSemanticError)
        vscode.window.showErrorMessage(
          `Error parsing YAML file\n\nError: ${error.message}`
        )
      else vscode.window.showErrorMessage('Error parsing YAML file')
    }
  }
  if (ext === '.json') {
    try {
      const json = JSON.parse(readData.toString())
      return json
    } catch (error) {
      console.log('Error with JSON', error)
      vscode.window.showErrorMessage('Error parsing JSON file')
    }
  }
}

export const importExecutableFile = async (uri: vscode.Uri) => {
  const readData = await vscode.workspace.fs.readFile(uri)

  try {
    const data = readData.toString()

    const v = await transform(data, {
      target: 'node12',
      format: 'cjs',
      loader: 'jsx',
    })

    const requirer = (thang: string) => {
      if (thang.match(/^\./)) {
        throw new Error('Executables do not support local imports yet - ' + uri.path)
      }
      return require(thang)
    }

    const exposed = {
      exports: {},
      require: requirer,
      console,
      __dirname: requirer('path').dirname(uri.path),
      __filename: uri.path
    }

    const exposee = Object.entries(exposed)
    const exposesKeys = exposee.map(([key, val]) => key)
    const exposesValues = exposee.map(([key, val]) => val)

    const fnArgs = [...exposesKeys, v.code]
    const execFnArgs = [...exposesValues]

    const resultFn = Function(...fnArgs)
    resultFn(...execFnArgs)
    return exposed.exports
  } catch (error) {
    if (!uri.path.match(new RegExp(escapeRegex('/node_modules/'))))
      vscode.window.showErrorMessage('Executable file ' + uri.path + ' filed to import: ' + error)
    console.log('⚠️🌈 importExecutableFile Error', { uri }, { error })
    return {}
  }
}

export default initFileWatcher
