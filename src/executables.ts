import * as vscode from 'vscode'

export const init = async (context: vscode.ExtensionContext) => {
  // const provider = new ExecutablesProvider(context.extensionUri)
  const watcher = vscode.workspace.createFileSystemWatcher('**/.pb')
  context.subscriptions.push(watcher.onDidChange(fileChanged))

  console.log('🪳🪳🪳🪳 WATCHER EXECUTABLES INITIALIZED.')

  return watcher
}

const fileChanged = async (uri: vscode.Uri) => {
  console.log('👌🚨 IS PB CHANGED!', uri)

  const readData = await vscode.workspace.fs.readFile(uri)
  const readStr = Buffer.from(readData).toString('utf8')
  console.log('👹 read result:', readStr)
  // const module = await import(uri.path);
  // console.log('👹 module import result:', module, {...module});
  const name = Math.floor(Math.random() * 1000000000).toString(32)

  const nuri = vscode.Uri.parse(uri.path + name)

  await vscode.workspace.fs.writeFile(nuri, readData)
  const tk = await import(nuri.path)
  console.log('👹 loaded:', tk)
  if (tk.try) {
    console.log('👹 trying..:', tk.try)
    const res = await tk.try()
  }
  await vscode.workspace.fs.delete(nuri)
}
