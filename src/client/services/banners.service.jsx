import React, { createContext, useContext, useEffect, useState } from 'react'
import { escapeRegex } from '../utils'
import { useConfig } from './config.service'

export const BannersContext = createContext()
export const BannersService = ({ children }) => {
  const config = useConfig()

  const [state, setState] = useState({})
  const actions = {}

  const value = { state, actions }

  useEffect(() => {
    const { active, files, visible } = config.state

    const confs = files
      .filter((file) => {
        if (file.level === 1 && file.conf[config.viewContainer]?.depth === undefined) return true
        if (active && file.dirname === active.dirname) return true
        if (visible?.find((editor) => editor.dirname === file.dirname))
          return true

        // Handle depth
        if (
          visible?.find(
            (editor) =>
              (file.level === 1 || editor.dirname.match(
                new RegExp(`^${escapeRegex(file.dirname)}`)
              )) &&
              file.conf[config.viewContainer]?.depth + file.level >=
                editor.level
          )
        )
          return true
      })
      .sort((a, b) => (a.level > b.level ? 1 : -1))
      .sort((a, b) =>
        !a.conf?.[config.viewContainer]?.priority ||
        +b.conf?.[config.viewContainer]?.priority
          ? 0
          : +a.conf?.[config.viewContainer]?.priority <
            +b.conf?.[config.viewContainer]?.priority
          ? 1
          : -1
      )

    setState((v) => ({ ...v, confs }))
  }, [config])

  return (
    <BannersContext.Provider value={value}>{children}</BannersContext.Provider>
  )
}

export const useBanners = () => useContext(BannersContext)
