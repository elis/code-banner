import * as vscode from 'vscode'
import PanelViewProvider from './panel.view'

class TestPanelViewProvider extends PanelViewProvider {
  public static readonly viewType = 'codeBanner.testPanel'
	protected viewContainer = 'test'

  protected attach() {
    this._context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        TestPanelViewProvider.viewType,
        this
      )
    )
  }
}

export default TestPanelViewProvider
