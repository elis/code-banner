import * as vscode from 'vscode'
import {
  ParsedFile,
  StatusBarItem,
  StatusBarItemOptions,
  StatusItems,
  UpdateEditor,
} from '../../types'
import { diff } from 'deep-object-diff'

type ActiveStatusBarItem = {
  name: string
  wrapped: vscode.StatusBarItem
  sbar: vscode.StatusBarItem
  options: StatusBarItemOptions
  file: ParsedFile
  depth: number
}
class StatusBar {
  private _context: vscode.ExtensionContext
  private _items: ActiveStatusBarItem[] = []

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
        item.conf.statusbar.items.forEach(({ name, options, depth }) => {
          const api = this.addItem(name, options, item, depth)
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
        file.conf.statusbar.items.forEach(({ name, options, depth }) => {
          if (this.getItem(name)) {
            this.updateItem(name, options, depth)
            const item = this.statusItems.items.find(
              (item) => item.name === name
            )
            if (item) item.options = options
            else {
              this.statusItems.items.push({ name, options })
            }
          } else {
            this.addItem(name, options, file, depth)
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

  public updateItem(
    name: string,
    options: Partial<StatusBarItemOptions>,
    depth = 0
  ) {
    const { sbar, options: oldOptions } = this._getItem(name) || {}

    if (!sbar || !oldOptions)
      throw new Error('Item with name does not exists: ' + name)

    const diffed = diff(oldOptions, options) as Partial<StatusBarItemOptions>

    if (options.visible) sbar.show()
    else sbar.hide()

    if (Object.entries(diffed).length)
      this._applyOptionsToItem(sbar, diffed, oldOptions)

    const item = this._getItem(name)
    if (item) {
      item.options = options as StatusBarItemOptions
      item.depth = depth
    }
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
    file: ParsedFile,
    depth = 0
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
    this._items.push({ name, wrapped, sbar, options, file, depth })
    return wrapped
  }

  public async updateVisible(editors: UpdateEditor[]) {
    this._cache.visibleEditors = editors
    console.log('🐥 [updateVisible] Visible updated', {
      editors,
      'this._items': this._items,
    })

    this._items

    const getExpiredItems = (
      items: ActiveStatusBarItem[],
      editors: UpdateEditor[]
    ) => {
      // stage 1 - get current items
      const stage1 = items
      console.log('🐥 [new flow] Stage 1 - current items', { stage1 })

      // stage 2 - find items, that
      //   - editors to high of a level
      //     - item.file.level === 1 || editor.level > item.file.level + item.depth
      //   - items to high of a level
      const stage2 = stage1.map((item) => ({
        item,
        editors: editors.map((editor) => ({
          'editor.level': editor.level,
          'item.file.level': item.file.level,
          'item.depth': item.depth,
          'item reach':
            item.file.level === 1 && (!item.depth || item.depth === Infinity)
              ? Infinity
              : item.file.level + item.depth,
          'editor deeper': editor.level > item.file.level + item.depth,
          'item allowed':
            (item.file.level === 1 && !item.depth) ||
            (editor.level <= item.file.level + item.depth &&
              editor.level >= item.file.level),
          editor,
        })),
      }))

      console.log('🐥 [new flow] Stage 2 - expired items', { stage2 })
      // Remove items with permitted editors
      const stage3 = stage2
        .filter(
          (base) =>
            base.editors.filter((editor) => !editor['item allowed']).length
        )
        .filter((base) => base.editors.length)

      // Restore list back to items
      const stage4 = stage3.map((base) => base.item)
      return stage4
    }

    const outdatedItems = getExpiredItems(this._items, editors)

    console.log('🦞🐢 [updateVisible] Outdated items result', { outdatedItems })

    if (outdatedItems.length) {
      outdatedItems.forEach((item) => item.wrapped.dispose())
    }
    const getNewItems = (
      files: ParsedFile[],
      editors: UpdateEditor[],
      items: ActiveStatusBarItem[]
    ) => {
      // stage 1 - get all available confs
      const stage1 = files.filter((file) => file.conf.statusbar?.items?.length)
      console.log('🐥 [new items new flow] Stage 1 - Available files', {
        stage1,
      })

      // stage 2 - find confs that can appear but don't
      const stage2 = stage1.map((file) => ({
          'file.level': file.level,
          items: file.conf.statusbar?.items.map((item) => ({
            'ited.depth': item.depth,
            'file.level': file.level,

            'sitem reach':
              file.level === 1 && (!item.depth || item.depth === Infinity)
                ? Infinity
                : file.level + (item.depth || 0),
                
                editors: editors.map((editor) => ({
                  'editor.level': editor.level,
                  'file.level': file.level,
                  'item.depth': item.depth,
              'item reach':
                file.level === 1 &&
                (!item.depth || item.depth === Infinity)
                  ? Infinity
                  : file.level + (item.depth || 0),
              'editor deeper': editor.level > file.level + (item.depth || 0),
              'item allowed':
                (file.level === 1 && !item.depth) ||
                (editor.level <= file.level + (item.depth || 0) &&
                  editor.level >= file.level),
              editor,
            })),
            // 'file deeper': file.level > item.file.level + item.depth,
            // 'item allowed':
          })),
        })),
      }))

      console.log('🐥 [new items new flow] Stage 2', { stage2 })
    }

    const newItems = getNewItems(this._cache.files, editors, this._items)
    console.log('🦞🐢 [updateVisible] New items result', { newItems })

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
    console.log('🦞🐢 [updateVisible] New editors', { newEditors })

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
