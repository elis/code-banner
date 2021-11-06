import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useBanners } from './services/banners.service'
import { useComms } from './services/comms.services'
import { useConfig } from './services/config.service'

import './testing.scss'

export const Panel = ({ text }) => {
  const config = useConfig()
	const banners = useBanners()

  useEffect(() => {
    console.log('🧏‍♀️🧏‍♀️🧏‍♀️ config updated:', config)
  }, [config])
  useEffect(() => {
    console.log('🧏‍♀️🧏‍♀️🧏‍♀️ banners updated:', banners)
  }, [banners])

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
  const {
    explorer: { items, style },
  } = config
  return (
    <BannerContext.Provider value={{ config, relative, workspace }}>
      <div className="banner" style={style}>
        {items?.length > 0 &&
          items.map((item, index) => {
            if (item.type === 'text')
              return <TextItem key={'item-text-' + index}>{item.text}</TextItem>
            if (item.type === 'svg')
              return (
                <SVGItem
                  key={'item-svg-' + index}
                  svg={item.svg}
                  style={item.style}
                />
              )
          })}
      </div>
    </BannerContext.Provider>
  )
}

const TextItem = ({ children, text }) => {
  return <div className="item item-text">{text || children}</div>
}
const SVGItem = ({ svg, style = {} }) => {
  const banner = useBanner()
  const comms = useComms()

  console.log('🧃 whats banner?', banner)
  console.log('whats svg?', svg)

  const [url, setUrl] = useState('')
	
  useEffect(() => {
    let release
    ;(async () => {
      const uri = await comms.actions.requestResponse('get-webview-uri', {
        fullpath: svg,
        workspace: banner.workspace,
        caller: banner.relative,
      })
      console.log('☔️🥘 resulting rui:', uri)
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
