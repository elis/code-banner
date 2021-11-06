import React, { createContext, useContext, useEffect, useState } from 'react'
import { useConfig } from './config.service'

export const BannersContext = createContext()
export const BannersService = ({ children }) => {
  const config = useConfig()

  const [state, setState] = useState({})
  const actions = {}

  const value = { state, actions }

  useEffect(() => {
    console.log('🦈 Config state updated:', config.state)
  }, [config.state])


  return (
    <BannersContext.Provider value={value}>{children}</BannersContext.Provider>
  )
}

export const useBanners = () => useContext(BannersContext)
