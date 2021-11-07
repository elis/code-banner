import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useBanners } from './services/banners.service'
import { useComms } from './services/comms.services'
import { useConfig } from './services/config.service'

import './testing.scss'

export const Panel = ({ text }) => {
  const banners = useBanners()

  const files = useMemo(() => {
    return banners.state.confs
  }, [banners.state.confs])

  return (
    <div className={'banners'}>
      {files?.map((file) => (
        <Banner
          key={'bannenr ' + file.relative}
          workspace={file.workspace}
          config={file.conf}
          relative={file.relative}
        />
      ))}
    </div>
  )
}

const BannerContext = createContext()

const useBanner = () => useContext(BannerContext)

const Banner = ({ config, relative, workspace }) => {
  const confs = useConfig()
  const { [confs.viewContainer]: { items = [], style = {} } = {} } = config
  return (
    <BannerContext.Provider value={{ config, relative, workspace }}>
      <div className="banner" style={style}>
        <ItemsDisplay items={items} />
      </div>
    </BannerContext.Provider>
  )
}

export const ItemDisplay = ({ item, index }) => {
  if (item.type === 'text')
    return <TextItem style={item.style}>{item.text}</TextItem>
  if (item.type === 'svg') return <SVGItem svg={item.svg} style={item.style} />
  if (item.type === 'container')
    return <ContainerItem items={item.items} style={item.style} />

  return <>UNKNOWN</>
}

export const ItemsDisplay = ({ items }) =>
  items?.length > 0 ? (
    items.map((item, index) => (
      <ItemDisplay
        key={`item-${item.type}-${index}`}
        item={item}
        index={index}
      />
    ))
  ) : (
    <>x</>
  )

const ContainerItem = ({ items, style = {} }) => {
  return (
    <div className="item item-container" style={style}>
      <ItemsDisplay items={items} />
    </div>
  )
}
const TextItem = ({ children, text, style = {} }) => {
  return (
    <div className="item item-text" style={style}>
      {text || children}
    </div>
  )
}
const SVGItem = ({ svg, style = {} }) => {
  const banner = useBanner()
  const comms = useComms()

  const [url, setUrl] = useState('')

  useEffect(() => {
    let release
    ;(async () => {
      const uri = await comms.actions.requestResponse('get-webview-uri', {
        fullpath: svg,
        workspace: banner.workspace,
        caller: banner.relative,
      })
      const url = `${uri.scheme}://${uri.authority}${uri.path}`
      if (!release) setUrl(url)
    })()
    return () => {
      release = true
    }
  }, [svg, banner.workspace])

  return (
    <div className="item item-svg" style={{ '--svg-url': url }}>
      <img src={url} style={style} />
    </div>
  )
}
