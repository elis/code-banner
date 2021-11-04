import * as React from 'react'
import * as Server from 'react-dom/server'
import { render } from 'react-dom'

const vscode = acquireVsCodeApi()

const CommServiceContext = React.createContext()
const CommService = ({ children }) => {
  const [state, setState] = React.useState({
    loaded: false,
  })

  const [subscriptions, setSubscriptions] = React.useState([])
  const subsRef = React.useRef()

  const subscribe = React.useCallback((type, cb) => {
    setSubscriptions((v) => [...v, [type, cb]])

    return () => {
      setSubscriptions((v) =>
        v.filter(([vtype, vcb]) => !(type === vtype && cb === vcb))
      )
    }
  }, [])

  const actions = {
    subscribe,
  }

  React.useEffect(() => {
    subsRef.current = subscriptions
  }, [subscriptions])

  React.useEffect(() => {
    const cb = (event) => {
      const message = event.data // The json data that the extension sent
      console.log('🧮 MESSAGE', message)
      const subs = subsRef.current
      subs
        .filter(([type]) => message.type === type)
        .forEach(([type, vcb]) => vcb(message))
      // switch (message.type) {
      // 		case 'addRow': {
    }

    window.addEventListener('message', cb)
    return () => {
      window.removeEventListener('message', cb)
    }
  }, [])
  return (
    <CommServiceContext.Provider value={{state, actions}}>
      {children}
    </CommServiceContext.Provider>
  )
}

const useComms = () => React.useContext(CommServiceContext)

const ConfigServiceContext = React.createContext()
const ConfigService = ({ children }) => {
  const comms = useComms()

  const state = {}
  const actions = {}

  React.useEffect(() => {
    const release = comms.actions.subscribe('files-updated', (message) => {
      console.log('📐👀 Received Message:', message)
    })
    const release2 = comms.actions.subscribe('file-updated', (message) => {
      console.log('📐👀 Received Message:', message)
    })
    return () => {
      release()
      release2()
    }
  }, [])

  return (
    <ConfigServiceContext.Provider value={{ state, actions }}>
      {children}
    </ConfigServiceContext.Provider>
  )
}

let Greet = () => <h1>🚸➕ Hello, world!</h1>

const App = () => {
  return (
    <>
      <CommService>
        <ConfigService>App Running!</ConfigService>
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
