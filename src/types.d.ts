import * as vscode from 'vscode'

export type CodeBannerConfig = {
  statusbar?: StatusBarConfig
  explorer?: ExplorerPanelConfig
  data?: Record<string, any>
  context?: Record<string, any>
  templates?: Record<string, any>
  options?: Options
  responsive?: Record<string, any>
}

export type Options = {
  refresh?: string | number
}

export type ResponsiveConfig = {
  [key: string]: Record<ResponsiveOption, number>
}

export type ResponsiveOption =
  | 'min-width'
  | 'min-height'
  | 'max-width'
  | 'max-height' 

export type StatusBarConfig = {
  items: StatusBarItem[]
}

export type ExplorerPanelConfig = {
  items?: BannerItem[]
}

export type BannerItem = BannerItemBase | BannerItemText

export type BannerItemBase = {
  type: string
}

export type BannerItemText = BannerItemBase & {
  type: 'text'
  text: string
}

export type StatusBarItem = {
  name: string
  depth?: number
  options: StatusBarItemOptions
}

export type StatusBarItemOptions = {
  text: string
  alignment?: vscode.StatusBarAlignment
  priority?: number
  visible?: boolean
  color?: string
  command?: string
  name?: string
  tooltip?: string
  id?: string

  /**
   * See: https://code.visualstudio.com/api/references/theme-color
   */
  backgroundColor?: string
}

export type ParsedFile = ParsedExecutableFile | ParsedConfigFile
export type ParsedBaseFile = {
  level: number
  uri: vscode.Uri
  conf: CodeBannerConfig
  relative: string
  workspace: string
  dirname: string
}

export type ParsedExecutableFile = ParsedBaseFile & {
  executable: true
}
export type ParsedConfigFile = ParsedBaseFile & {
  executable: false
}

export type StatusItems = {
  items: {
    name: string
    options: Partial<StatusBarItemOptions>
  }[]
  confs: Record<string, string[]>
}

export type UpdateEditor = {
  editor: vscode.TextEditor
  options: vscode.TextEditorOptions
  document: vscode.TextDocument
  dirname: string
  uri: vscode.Uri
  version: number
  lineCount: number
  languageId: string
  isVisible?: boolean
  isActive?: boolean
  level: number
  relative: string
  workspace: string
}
