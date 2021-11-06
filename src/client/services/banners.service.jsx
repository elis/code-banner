import React, { createContext, useContext, useEffect, useState } from 'react'
import { useConfig } from './config.service'

export const BannersContext = createContext()
export const BannersService = ({ children }) => {
  const config = useConfig()

  const [state, setState] = useState({})
  const actions = {}

  const value = { state, actions }

  useEffect(() => {
    const { active, files, visible } = config.state
    console.log('🦈 Config state updated:', { active, files, visible })
    const confs = files
      .filter((file) => {
        if (file.level === 1) return true
        if (file.dirname === active.dirname) return true
        if (visible?.find(editor => editor.dirname === file.dirname)) return true
        // if (file)
      })
      .sort((a, b) => (a.level > b.level ? 1 : -1))
      .sort((a, b) =>
        +a.conf?.explorer?.priority < +b.conf?.explorer?.priority ? 1 : -1
      )

    console.log('🍝 Sorted:', confs)
    console.table(
      confs.map((file) => [file.relative, file?.conf?.explorer?.priority])
    )

    setState((v) => ({ ...v, confs }))
  }, [config.state])

  return (
    <BannersContext.Provider value={value}>{children}</BannersContext.Provider>
  )
}

export const useBanners = () => useContext(BannersContext)
