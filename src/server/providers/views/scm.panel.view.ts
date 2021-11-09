import * as vscode from 'vscode'
import PanelViewProvider from './panel.view'

class SCPPanelViewProvider extends PanelViewProvider {
  public static readonly viewType = 'codeBanner.scmPanel'
  protected viewContainer = 'scm'

  protected attach() {
    this._context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        SCPPanelViewProvider.viewType,
        this
      )
    )
  }
}

export default SCPPanelViewProvider
