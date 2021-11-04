//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
	const vscode = acquireVsCodeApi()


	console.log('🏕🧮 LOADED code-banner.js ')

	const oldState = vscode.getState() || { test: 'testing' }
	console.log('🏕🧮 old state ', oldState)


	// Handle messages sent from the extension to the webview
	window.addEventListener('message', event => {
		const message = event.data // The json data that the extension sent
		console.log('🧮 MESSAGE in CODE BANNER', message)
		switch (message.type) {
			case 'addRow': {
					console.log('Ok, adding row!', message)
					return { test: 'tested' }
			}
		}
	})

	vscode.postMessage({
		ready: true,
		view: 'code-banner'
	})

}())


