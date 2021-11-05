import React, { useCallback, useEffect } from "react"
import { vscode } from "./vscode"

export const CommServiceContext = React.createContext()
export const CommService = ({ children }) => {
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

  const getWebviewUri = useCallback(async (fullpath, workspace) => {
    const promise = new Promise((r) => {
      const id = getNonce()
      vscode.postMessage({ type: 'get-webview-uri', id, fullpath, workspace })
      const release = subscribe('get-webview-uri-' + id, (data) => {
        console.log('🟣🍊♿️ Result of get webview:', data)
        release()
        r(data.result)
      })
    })
    return promise
  }, [])

  const actions = {
    subscribe,
    getWebviewUri
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
    <CommServiceContext.Provider value={{ state, actions }}>
      {children}
    </CommServiceContext.Provider>
  )
}

export const useComms = () => React.useContext(CommServiceContext)

export const getNonce = () => {
  let text = ''
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}
