import * as vscode from 'vscode'
import PanelViewProvider from './panel.view'

class ExplorerPanelViewProvider extends PanelViewProvider {
  public static readonly viewType = 'codeBanner.explorerPanel'
  protected viewContainer = 'explorer'

  protected attach() {
    this._context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        ExplorerPanelViewProvider.viewType,
        this
      )
    )
  }
}

export default ExplorerPanelViewProvider
