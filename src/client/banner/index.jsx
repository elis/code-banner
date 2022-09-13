import objectPath from 'object-path'
import React, {
  useContext,
  createContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import BannerErrorBoundary from '../error-boundries/banner.error-boundry'
import { ItemsDisplay } from './items'

const BannerContext = createContext()

export const useBanner = () => useContext(BannerContext)

const Banner = ({ config, relative, workspace }) => {
  const {
    context,
    items = [],
    style = {},
    responsive,
    'if-responsive': ifResponsive,
    'if-context': ifContext,
  } = config

  const { width, height } = useWindowSize(50)

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

  const shouldDisplayResponsive = useMemo(() => {
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

  const shouldDisplayContext = useMemo(() => {
    const result = ifContext
      ? (typeof ifContext === 'string'
          ? ifContext.split(',')
          : Array.isArray(ifContext)
          ? ifContext
          : []
        )
          .filter((key) => {
            const coalesce = Array.isArray(key) || key.split(',').length > 1

            return objectPath[coalesce ? 'coalesce' : 'get'](
              context,
              coalesce ? (typeof key === 'string' ? key.split(',') : key) : key
            )
          })
          .reduce((a, b) => a || b, false)
      : true

    return result
  }, [ifContext, context])

  if (!(shouldDisplayResponsive && shouldDisplayContext)) {
    return null
  }

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
function useWindowSize(debounceFor = 100) {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  })

  const debouncedSize = useDebounce(windowSize, debounceFor)
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
  return debouncedSize
}
// Hook
function useDebounce(value, delay) {
  // State and setters for debounced value
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(
    () => {
      // Update debounced value after delay
      const handler = setTimeout(() => {
        setDebouncedValue(value)
      }, delay)
      // Cancel the timeout if value changes (also on delay change or unmount)
      // This is how we prevent debounced value from updating if value is changed ...
      // .. within the delay period. Timeout gets cleared and restarted.
      return () => {
        clearTimeout(handler)
      }
    },
    [value, delay] // Only re-call effect if value or delay changes
  )
  return debouncedValue
}
export default Banner
