import React, { useEffect } from "react"

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
    <CommServiceContext.Provider value={{ state, actions }}>
      {children}
    </CommServiceContext.Provider>
  )
}

export const useComms = () => React.useContext(CommServiceContext)
