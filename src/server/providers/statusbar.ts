import * as vscode from 'vscode'
import {
  ParsedFile,
  StatusBarItemOptions,
  StatusItems,
  UpdateEditor,
} from '../../types'
import { diff } from 'deep-object-diff'

class StatusBar {
  private _context: vscode.ExtensionContext
  private _items: {
    name: string
    wrapped: vscode.StatusBarItem
    sbar: vscode.StatusBarItem
    options: StatusBarItemOptions
    file: ParsedFile
  }[] = []

  private _cache: {
    files: ParsedFile[]
    visibleEditors: UpdateEditor[]
    activeEditor?: UpdateEditor
  } = {
    files: [],
    visibleEditors: [],
  }

  private statusItems: StatusItems

  constructor(context: vscode.ExtensionContext) {
    this._context = context

    this.statusItems = {
      items: [],
      confs: {},
    }
  }

  public getItem(name: string) {
    return this._getItem(name)?.wrapped
  }

  private _getItem(name: string) {
    return this._items.find((e) => e.name === name)
  }

  private _applyOptionsToItem(
    sbar: vscode.StatusBarItem,
    options: Partial<StatusBarItemOptions>,
    previousOptions: Partial<StatusBarItemOptions> = {}
  ) {
    if (options.text) sbar.text = options.text

    if (options.color) sbar.color = options.color
    if (options.backgroundColor)
      sbar.backgroundColor = new vscode.ThemeColor(options.backgroundColor)

    if (options.command) sbar.command = options.command
    else if (previousOptions.command) sbar.command = ''

    if (options.name) sbar.name = options.name
    if (options.tooltip) sbar.tooltip = options.tooltip
  }

  public updateFiles(files: ParsedFile[]) {
    const statusable = files.filter(({ conf: { statusbar } }) => !!statusbar)
    statusable.map((item) => {
      if (item.conf.statusbar?.items.length) {
        item.conf.statusbar.items.forEach(({ name, options }) => {
          const api = this.addItem(name, options, item)
          this.statusItems.items.push({ name, options })
          this.statusItems.confs[item.relative + item.workspace] = [
            ...(this.statusItems.confs[item.relative + item.workspace] || []),
            name,
          ]
        })
      }
    })

    this._cache.files = files
  }

  public updateFile(file: ParsedFile) {
    this._cache.files = this._cache.files.length
      ? this._cache.files.map((ec) =>
          ec.relative === file.relative && ec.workspace === file.workspace
            ? { ...ec, conf: file.conf }
            : ec
        )
      : [file]

    if (file.conf.statusbar) {
      if (file.conf.statusbar?.items.length) {
        file.conf.statusbar.items.forEach(({ name, options }) => {
          if (this.getItem(name)) {
            this.updateItem(name, options)
            const item = this.statusItems.items.find(
              (item) => item.name === name
            )
            if (item) item.options = options
            else {
              this.statusItems.items.push({ name, options })
            }
          } else {
            this.addItem(name, options, file)
            this.statusItems.items.push({ name, options })
            this.statusItems.confs[file.relative + file.workspace] = [
              ...(this.statusItems.confs[file.relative + file.workspace] || []),
              name,
            ]
          }
        })
      }
      if (
        file.conf.statusbar.items.length <
        this.statusItems.confs[file.relative + file.workspace].length
      ) {
        const missingNames = (
          this.statusItems.confs[file.relative + file.workspace] || []
        ).filter((e) => !file.conf.statusbar?.items.find((t) => t.name === e))

        missingNames.forEach((e) => this.removeItem(e))
        this.statusItems.confs[file.relative + file.workspace] = [
          ...(
            this.statusItems.confs[file.relative + file.workspace] || []
          ).filter((e) => missingNames.indexOf(e) === -1),
        ]
      }
    }
  }

  public updateItem(name: string, options: Partial<StatusBarItemOptions>) {
    const { sbar, options: oldOptions } = this._getItem(name) || {}

    if (!sbar || !oldOptions)
      throw new Error('Item with name does not exists: ' + name)

    const diffed = diff(oldOptions, options) as Partial<StatusBarItemOptions>

    if (options.visible) sbar.show()
    else sbar.hide()

    if (Object.entries(diffed).length)
      this._applyOptionsToItem(sbar, diffed, oldOptions)

    const item = this._getItem(name)
    if (item) item.options = options as StatusBarItemOptions
  }

  public removeItem(name: string) {
    const item = this._getItem(name)
    if (item) {
      item.wrapped.dispose()
    }
  }

  public addItem(
    name: string,
    options: StatusBarItemOptions = {
      text: '',
      alignment: vscode.StatusBarAlignment.Left,
      priority: 10,
    },
    file: ParsedFile
  ) {
    if (this._items.find((e) => e.name === name))
      throw new Error(
        'Cannot create another statusbar item with the same name: ' + name
      )

    const sbar = vscode.window.createStatusBarItem(
      options.alignment,
      options.priority
    )
    this._applyOptionsToItem(sbar, options)
    if (options.visible) sbar.show()

    const dispose = () => {
      this._items = this._items.filter((el) => el.sbar !== sbar)
      sbar.dispose()
    }

    const wrapped = Object.assign({}, sbar, { dispose })
    this._items.push({ name, wrapped, sbar, options, file })
    return wrapped
  }

  public async updateVisible(editors: UpdateEditor[]) {
    this._cache.visibleEditors = editors

    const outdatedItems = this._items.filter(
      (item) => !editors.find((editor) => editor.dirname === item.file.dirname)
    )

		if (outdatedItems.length) {
      outdatedItems.forEach((item) => item.wrapped.dispose())
    }

    const newEditors = editors.filter(
      (editor) =>
        this._cache.files.find(
          (file) =>
            editor.dirname === file.dirname ||
            // Match editor relative path to file's dirname
            (editor.relative.match(new RegExp(`^${file.dirname}`)) &&
              // check if parent at sufficient depth
              file.conf.statusbar?.items.find(
                (item) => item.depth && item.depth + file.level >= editor.level
              ))
        ) && !this._items.find((item) => editor.dirname === item.file.dirname)
    )

		if (newEditors.length) {
      const newCofs = this._cache.files.filter((file) =>
        newEditors.find(
          (editor) =>
            editor.dirname === file.dirname ||
            (editor.dirname.match(new RegExp(`^${file.dirname}`)) &&
              file.conf.statusbar?.items.find(
                (item) => item.depth && item.depth + file.level >= editor.level
              ))
        )
      )
      newCofs.forEach((file) => this.updateFile(file))
    }
  }

  public async updateActive(editor?: UpdateEditor) {
    this._cache.activeEditor = editor
  }
}

export default StatusBar
