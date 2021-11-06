import * as vscode from 'vscode'
import PanelViewProvider from './panel.view'

class DebugPanelViewProvider extends PanelViewProvider {
  public static readonly viewType = 'codeBanner.debugPanel'
	protected viewContainer = 'debug'

  protected attach() {
    this._context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        DebugPanelViewProvider.viewType,
        this
      )
    )
  }
}

export default DebugPanelViewProvider
