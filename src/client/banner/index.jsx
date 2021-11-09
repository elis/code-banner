import React, { useContext, createContext } from 'react'
import BannerErrorBoundary from '../error-boundries/banner.error-boundry'
import { useConfig } from '../services/config.service'
import { ItemsDisplay } from './items'

const BannerContext = createContext()

export const useBanner = () => useContext(BannerContext)

const Banner = ({ config, relative, workspace }) => {
  const confs = useConfig()
  const { [confs.viewContainer]: { items = [], style = {} } = {} } = config
  return (
    <BannerContext.Provider value={{ config, relative, workspace }}>
      <div
        className="banner"
        style={style}
        dataRelative={relative}
        dataWorkspace={workspace}
      >
        <BannerErrorBoundary items={items}>
          <ItemsDisplay items={items} />
        </BannerErrorBoundary>
      </div>
    </BannerContext.Provider>
  )
}

export default Banner
