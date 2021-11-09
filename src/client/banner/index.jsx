import React, { useContext, createContext, useEffect } from 'react'
import BannerErrorBoundary from '../error-boundries/banner.error-boundry'
import { ItemsDisplay } from './items'

const BannerContext = createContext()

export const useBanner = () => useContext(BannerContext)

const Banner = ({ config, relative, workspace }) => {
  const { items = [], style = {} } = config

  return (
    <BannerContext.Provider value={{ config, relative, workspace }}>
      <div
        className="banner"
        style={style}
        data-relative={relative}
        data-workspace={workspace}
      >
        <BannerErrorBoundary items={items}>
          <ItemsDisplay items={items} />
        </BannerErrorBoundary>
      </div>
    </BannerContext.Provider>
  )
}

export default Banner
