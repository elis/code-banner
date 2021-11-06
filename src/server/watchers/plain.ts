import * as path from 'path'
import * as vscode from 'vscode'
import * as YAML from 'yaml'
import { extname } from 'path'
import { ParsedConfigFile, ParsedExecutableFile, ParsedFile } from '../../types'

export type PlainConfigAPI = {
  onReady: (files: ParsedConfigFile[]) => void
  onUpdate: (file: ParsedConfigFile) => void
}

export const initPlainWatcher = async (
  context: vscode.ExtensionContext,
  api: PlainConfigAPI
) => {
	const globs = [
		'**/*.cb',
		'**/*.cb.json',
		'**/*.cb.yml'
	]
	
  const onUpdate = (newData: ParsedConfigFile) => {
    api.onUpdate(newData)
  }

  const parse = (files: vscode.Uri[]) => parseFiles(files, context)
	const allFiles: vscode.Uri[] = []

	await Promise.all(globs.map(async glob => {
		const watcher = vscode.workspace.createFileSystemWatcher(glob)
		context.subscriptions.push(
			watcher.onDidChange(
				fileChanged(context, (data: ParsedFile) =>
					onUpdate(data as ParsedConfigFile)
				)
			)
		)

		const files = await vscode.workspace.findFiles(glob)
		allFiles.push(...files)
	}))


  // Read first time
  if (allFiles.length) {
    const results = (await parse(allFiles)) as ParsedConfigFile[]
    const sorted = results.sort((a, b) => (a.level > b.level ? 1 : -1))

    api.onReady(sorted)
  }
}

export const fileChanged =
  (
    context: vscode.ExtensionContext,
    cb: (file: ParsedConfigFile | ParsedExecutableFile) => void,
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
    const loaded = await importFile(uri)
    const relative = vscode.workspace.asRelativePath(uri)

    const conf = {}
    if (loaded.explorer) {
      if (executable && typeof loaded.explorer === 'function') {
        const explorer = await loaded.explorer(uri, context)
        Object.assign(conf, { explorer })
      } else if (loaded.explorer)
        Object.assign(conf, { explorer: loaded.explorer })
    }
    if (loaded.statusbar) {
      if (executable && typeof loaded.statusbar === 'function') {
        const statusbar = await loaded.statusbar(uri, context)
        Object.assign(conf, { statusbar })
      } else if (loaded.statusbar)
        Object.assign(conf, { statusbar: loaded.statusbar })
    }

    return {
      uri,
      conf,
    }
  }

export const importFile = async (uri: vscode.Uri) => {
  const readData = await vscode.workspace.fs.readFile(uri)
  const ext = extname(uri.fsPath)
	const data = readData.toString()

  if (!ext || ext === '.cb' || ext === '.yml') {
		const yaml = YAML.parse(data, {

		})

		return yaml
	}
  if (ext === '.json') return JSON.parse(readData.toString())
}
