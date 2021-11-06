import React, { useEffect } from 'react'
import { useComms } from './comms.services'
import { vscode } from './vscode'


export const ConfigServiceContext = React.createContext()
export const ConfigService = ({ children }) => {
  const comms = useComms()

  const [state, setState] = React.useState(vscode.getState()?.config || {
    files: [],
  })

	useEffect(() => {
		const st = vscode.getState()
		vscode.setState({ ...st, config: state })
	}, [state])
  const actions = {}

  React.useEffect(() => {
    const releaseFiles = comms.actions.subscribe('files-updated', (message) => {
      console.log('📐👀 Received Message:', message)
      setState((v) => ({ ...v, files: message.files }))
    })
    const releaseFile = comms.actions.subscribe('file-updated', (message) => {
      console.log('📐👀 Received Message:', message)
      setState((v) => ({
        ...v,
        files: [
          ...v.files.filter((f) => f.relative !== message.file.relative),
          message.file,
        ],
      }))
    })
    const releaseVisible = comms.actions.subscribe('visible-updated', (message) => {
      console.log('📐👀 Received Message:', message)
      setState((v) => ({ ...v, visible: message.editors }))
    })
    const releaseActive = comms.actions.subscribe('active-updated', (message) => {
      console.log('📐👀 Received Message:', message)
      setState((v) => ({
        ...v,
        active: message.editor
      }))
    })

    let bootCanceled
    const releaseBoot = () => {
      bootCanceled = true
    }
    comms.actions.requestResponse('bootup').then(result => {
      console.log('🍐🍑🍈🫐 Boot response:', result)
      setState(v => ({
        ...v,
        active: result.activeEditor,
        visible: result.visibleEditors,
        files: result.files
      }))
    })

    const release = () => {
      releaseFile()
      releaseFiles()
      releaseVisible()
      releaseActive()
      releaseBoot()
    }

    return release
  }, [])

  return (
    <ConfigServiceContext.Provider value={{ state, actions }}>
      {children}
    </ConfigServiceContext.Provider>
  )
}

export const useConfig = () => React.useContext(ConfigServiceContext)
