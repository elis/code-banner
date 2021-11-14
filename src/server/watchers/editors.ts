import * as path from 'path'
import * as vscode from 'vscode'
import { UpdateEditor } from '../../types'

export type EditorsWatcherAPI = {
  onVisibileUpdate: (editors: UpdateEditor[]) => void
  onActiveUpdate: (editor?: UpdateEditor) => void
}

const initEditorWatcher = async (
  context: vscode.ExtensionContext,
  api: EditorsWatcherAPI
) => {
  const watcher = vscode.window.onDidChangeVisibleTextEditors((editors) => {
    const output = editors.map(makeUpdateEditor({ isVisible: true }))
    api.onVisibileUpdate(output)
  })

  const watcher2 = vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
      api.onActiveUpdate(
        makeUpdateEditor({
          isActive: true,
        })(editor)
      )
    } else api.onActiveUpdate()
  })

  const visible = vscode.window.visibleTextEditors
  const active = vscode.window.activeTextEditor
  api.onVisibileUpdate(visible.map(makeUpdateEditor({ isVisible: true })))
  api.onActiveUpdate(
    active ? makeUpdateEditor({ isActive: true })(active) : undefined
  )

  context.subscriptions.push(watcher, watcher2)
}

const makeUpdateEditor =
  (overloads = {}) =>
  (editor: vscode.TextEditor) => {
    const { document, options } = editor
    const { uri, version, lineCount, languageId } = document
    const relative = vscode.workspace.asRelativePath(uri)
    const dirname = path.dirname(relative)
    const level = relative.split('/').length

    const workspace = vscode.workspace.getWorkspaceFolder(uri)?.name

    return {
      document,
      dirname,
      editor,
      lineCount,
      languageId,
      level,
      options,
      relative,
      version,
      uri,
      workspace,
      ...overloads,
    } as UpdateEditor
  }

  export default initEditorWatcher
  