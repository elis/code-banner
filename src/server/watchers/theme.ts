import * as vscode from 'vscode'

export type ThemeWatcherAPI = {
	onReady: (theme: vscode.ColorTheme) => void
	onUpdate: (theme: vscode.ColorTheme) => void
}

const initThemeWatcher = (context: vscode.ExtensionContext, handlers: ThemeWatcherAPI) => {

	const watcher = vscode.window.onDidChangeActiveColorTheme((colorTheme: vscode.ColorTheme) => {
		handlers.onUpdate(currentTheme)
	})

	context.subscriptions.push(watcher)
  const currentTheme = vscode.window.activeColorTheme

	handlers.onReady(currentTheme)

}

export default initThemeWatcher
