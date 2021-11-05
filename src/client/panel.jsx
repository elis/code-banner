import React, { createContext, useContext, useEffect, useState } from 'react'
import { useComms } from './services/comms.services'
import { useConfig } from './services/config.service'

import './testing.scss'

export const Panel = ({ text }) => {
  const config = useConfig()

  useEffect(() => {
    console.log('🧏‍♀️🧏‍♀️🧏‍♀️ config updated:', config)
  }, [config])

  return (
    <div className={'banners'}>
      {config.state?.files?.map((file) => (
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
  // const onDiskPath = vscode.Uri.file(
  // 	path.join(context.extensionPath, 'media', 'cat.gif')
  // );
  // const catGifSrc = panel.webview.asWebviewUri(onDiskPath);

  console.log('🧃 whats banner?', banner)
  console.log('whats svg?', svg)

  const [url, setUrl] = useState('')
  // 	{
  //     "$mid": 1,
  //     "path": "/Users/eli/projects/djit/djit.su/packages/desktop/assets/icon.svg",
  //     "scheme": "https",
  //     "authority": "file+.vscode-resource.vscode-webview.net"
  // }
  useEffect(() => {
    let release
    ;(async () => {
      const uri = await comms.actions.getWebviewUri(svg, banner.workspace)
      console.log('resulting rui:', uri)
      const url = `${uri.scheme}://${uri.authority}${uri.path}`
      setUrl(url)
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
