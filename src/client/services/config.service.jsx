import React, { useEffect } from 'react'
import { useComms } from './comms.services'
import { vscode } from './vscode'

export const ConfigServiceContext = React.createContext()

const ConfigService = ({ children }) => {
  const comms = useComms()

  const [state, setState] = React.useState(
    // vscode.getState()?.config || {
    {
      files: [],
    }
  )

  const viewContainer = document.getElementById('root').dataset.viewContainer

  useEffect(() => {
    const st = vscode.getState()
    vscode.setState({ ...st, config: state })
  }, [state])
  const actions = {}

  useEffect(() => {
    const releaseTheme = comms.actions.subscribe('theme-updated', (message) => {
      setState((v) => ({ ...v, theme: message.theme }))
    })
    const releaseFiles = comms.actions.subscribe('files-updated', (message) => {
      setState((v) => ({ ...v, files: message.files }))
    })
    const releaseFile = comms.actions.subscribe('file-updated', (message) => {
      setState((v) => ({
        ...v,
        files: [
          ...v.files.filter((f) => f.relative !== message.file.relative),
          message.file,
        ],
      }))
    })
    const releaseVisible = comms.actions.subscribe(
      'visible-updated',
      (message) => {
        setState((v) => ({
          ...v,
          visible: message.editors.map((editor) => ({
            ...editor,
            isActive: v.active?.relative === editor.relative,
          })),
        }))
      }
    )
    const releaseActive = comms.actions.subscribe(
      'active-updated',
      (message) => {
        setState((v) => ({
          ...v,
          active: message.editor,
          visible: v.visible.map((editor) => ({
            ...editor,
            isActive: message.editor?.relative === editor.relative,
          })),
        }))
      }
    )

    let bootCanceled
    const releaseBoot = () => {
      bootCanceled = true
    }
    comms.actions.requestResponse('bootup').then((result) => {
      setState((v) => ({
        ...v,
        active: result.activeEditor,
        visible: result.visibleEditors.map((editor) => ({
          ...editor,
          isActive: editor.relative === result.activeEditor?.relative,
        })),
        files: result.files,
        theme: result.theme,
      }))
    })

    const release = () => {
      releaseTheme()
      releaseFile()
      releaseFiles()
      releaseVisible()
      releaseActive()
      releaseBoot()
    }

    return release
  }, [])

  return (
    <ConfigServiceContext.Provider value={{ state, actions, viewContainer }}>
      {children}
    </ConfigServiceContext.Provider>
  )
}

export const useConfig = () => React.useContext(ConfigServiceContext)

export default ConfigService
