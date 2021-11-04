import * as React from 'react'
import * as Server from 'react-dom/server'
import { render } from 'react-dom'
import { Panel } from './panel'
import { CommService } from './services/comms.services'
import { ConfigService } from './services/config.service'


let Greet = () => <h1>🚸➕ Hello, world!</h1>


const App = () => {
  return (
    <>
      <CommService>
        <ConfigService>
          App Running!
          <Panel />
        </ConfigService>
      </CommService>
    </>
  )
}

const API = {
  testing: async (input) => {
    console.log('Input:', input)
    return { output: 'worked' }
  },
}
// Comlink.expose(API)

render(
  <App>
    <div className="test">
      <Greet />
    </div>
  </App>,

  document.getElementById('root')
)
