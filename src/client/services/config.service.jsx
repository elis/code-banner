import React from 'react'
import { useComms } from './comms.services'

export const ConfigServiceContext = React.createContext()
export const ConfigService = ({ children }) => {
  const comms = useComms()

  const [state, setState] = React.useState({
    files: [],
  })
  const actions = {}

  React.useEffect(() => {
    const release = comms.actions.subscribe('files-updated', (message) => {
      console.log('📐👀 Received Message:', message)
      setState((v) => ({ ...v, files: message.files }))
    })
    const release2 = comms.actions.subscribe('file-updated', (message) => {
      console.log('📐👀 Received Message:', message)
      setState((v) => ({
        ...v,
        files: [
          ...v.files.filter((f) => f.relative !== message.file.relative),
          message.file,
        ],
      }))
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

export const useConfig = () => React.useContext(ConfigServiceContext)
