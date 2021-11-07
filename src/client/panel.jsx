import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import ReactMarkdown from 'react-markdown'
import { escapeRegex } from '../utils'
import { useBanners } from './services/banners.service'
import { useComms } from './services/comms.services'
import { useConfig } from './services/config.service'

import './testing.scss'

export const Panel = ({ text }) => {
  const banners = useBanners()

  const files = useMemo(() => {
    console.log('📘 banners.state.confs', banners.state.confs)
    return banners.state.confs?.filter(({ conf }) => !!conf.explorer)
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
      <div
        className="banner"
        style={style}
        dataRelative={relative}
        dataWorkspace={workspace}
      >
        <ItemsDisplay items={items} />
      </div>
    </BannerContext.Provider>
  )
}

export const ItemDisplay = ({ item, index }) => {
  const handlers = {
    text: TextItem,
    svg: SVGItem,
    container: ContainerItem,
    markdown: MarkdownItem,
  }

  const Comp = handlers[item.type] || UnknownItem
  return <Comp item={item} index={index} />
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

export const useSmartText = (text) => {
  const banner = useBanner()
  const comms = useComms()

  const [display, setDisplay] = useState(text)

  console.log('🛕 CHECKING TEXT FOR SMART', { text, display })
  useEffect(() => {
    let release
    ;(async () => {
      const parsed = await comms.actions.requestResponse('parse-text-content', {
        text,
        workspace: banner.workspace,
        caller: banner.relative,
      })

      console.log('parsed text', parsed, { text })
      if (!release) setDisplay(parsed)
    })()
    return () => {
      release = true
    }
  }, [text, banner.workspace])

  const result = useMemo(() => {
    let output = text
    if (output !== display && !!display) return display
    const replacables = text.match(/(\$\(([^)]*)+\))+/g)
    console.log('🍊 replacables in text:', replacables)
    if (replacables?.length > 0)
      for (const item of replacables) {
        const [, x] = item.match(/^\$\(([^)]+)\)$/)
        const [v, defs] = x.split(', ')
        output = output.replace(new RegExp(`${escapeRegex(item)}`, 'g'), defs)
      }
  }, [text, display])

  return result
}

const MarkdownItem = ({ item: { markdown, style = {} } }) => {
  const display = useSmartText(markdown)
  return <ReactMarkdown>{display}</ReactMarkdown>
}

const UnknownItem = ({ item }) => {
  return (
    <>
      Unknown type: <strong>{item.type}</strong>
    </>
  )
}

const ContainerItem = ({ item: { items, style = {} } }) => {
  return (
    <div className="item item-container" style={style}>
      <ItemsDisplay items={items} />
    </div>
  )
}
const TextItem = ({ children, item: { text, style = {} } }) => {
  // const banner = useBanner()
  // const comms = useComms()
  const display = useSmartText(text || children)

  // const [display, setDisplay] = useState(text || children)

  // useEffect(() => {
  //   let release
  //   ;(async () => {
  //     const parsed = await comms.actions.requestResponse('parse-text-content', {
  //       text: text || children,
  //       workspace: banner.workspace,
  //       caller: banner.relative,
  //     })

  //     console.log('parsed text', parsed, { text, children })
  //     setDisplay(parsed)
  //   })()
  //   return () => {
  //     release = true
  //   }
  // }, [text, children, banner.workspace])

  return (
    <div className="item item-text" style={style}>
      {display}
    </div>
  )
}
const SVGItem = ({ item: { svg, style = {} } }) => {
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
