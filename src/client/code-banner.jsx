import * as React from 'react'
import * as Server from 'react-dom/server'
import { render } from 'react-dom'


let Greet = () => <h1>🚸➕ Hello, world!</h1>

const vscode = acquireVsCodeApi()

const API = {
	testing: async (input) => {
		console.log('Input:', input)
		return { output: 'worked' }
	}
}
// Comlink.expose(API)



render(
	<div className="test">
		<Greet />
	</div>,
	document.getElementById('root')
)
