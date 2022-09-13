import React, { useContext, createContext, useEffect, useMemo, useState } from 'react'
import BannerErrorBoundary from '../error-boundries/banner.error-boundry'
import { ItemsDisplay } from './items'

const BannerContext = createContext()

export const useBanner = () => useContext(BannerContext)

const Banner = ({ config, relative, workspace, ...rest }) => {
  const { items = [], style = {}, responsive, 'if-responsive': ifResponsive } = config

  const {width, height} = useWindowSize()

  const resps = useMemo(() => {
    if (responsive) {
      const actives = Object.entries(responsive)
        .map(([key, value]) => [
          key,
          value,
          Object.entries(value)
            .filter(([k, v]) => k.match(/^(min|max)-(width|height)$/))
            .map(([k, v]) => {
              const [minmax, wh] = k.split('-')
              const val = parseInt(v)
              return {
                minmax,
                wh,
                val,
                match:
                  (minmax === 'min' &&
                    (wh === 'width' ? width : height) >= val) ||
                  (minmax === 'max' &&
                    (wh === 'width' ? width : height) <= val),
              }
            }),
          // .filter(([key, value, matche]) => matche),
        ])
        .filter(([, , matche]) => matche.length)
        .map(([key, , matche]) => [
          key,
          matche.map(({ match }) => match),
          matche.map(({ match }) => match).reduce((a, b) => a && b),
        ])
        .filter(([, , matched]) => matched)
        .map(([key]) => key)

      return actives
    }
  }, [responsive, width, height])

  const shouldDisplay = useMemo(() => {
    const result = resps?.length
    ? ifResponsive
      ? (typeof ifResponsive === 'string'
          ? ifResponsive.split(',')
          : Array.isArray(ifResponsive)
          ? ifResponsive
          : []
        )
          .filter((key) => resps.indexOf(key) > -1)
          .reduce((a, b) => a || b, false)
      : true
    : true
    
    return result
  }, [resps, ifResponsive])

  if (!shouldDisplay) {return null}

  
  return (
    <BannerContext.Provider
      value={{ config, relative, workspace, responsive: resps }}
    >
      <div
        className="banner"
        style={style}
        data-relative={relative}
        data-workspace={workspace}
      >
        <BannerErrorBoundary items={items}>
          <ItemsDisplay items={items} responsive={resps} />
        </BannerErrorBoundary>
      </div>
    </BannerContext.Provider>
  )
}

// Hook
function useWindowSize() {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  })
  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
    // Add event listener
    window.addEventListener('resize', handleResize)
    // Call handler right away so state gets updated with initial window size
    handleResize()
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, []) // Empty array ensures that effect is only run on mount
  return windowSize
}
export default Banner
