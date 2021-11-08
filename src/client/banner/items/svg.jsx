import React, { useEffect, useState } from 'react'
import classnames from 'class-names'
import { useBanner } from '..'
import { useComms } from '../../services/comms.services'
import useItemHandlers from '../item-handlers.hook'
import ErrorItem from './error'

const SVGItem = ({ item }) => {
  const { svg, style } = item
  const banner = useBanner()
  const comms = useComms()

  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState(null)
  const { handlers, classes } = useItemHandlers(item)

  useEffect(() => {
    let release
    setUrlError()
    ;(async () => {
      const uri = await comms.actions.requestResponse('get-webview-uri', {
        fullpath: svg,
        workspace: banner.workspace,
        caller: banner.relative,
      })
      if (uri.error) {
        return setUrlError(uri.error)
      }
      const url = `${uri.scheme}://${uri.authority}${uri.path}`
      if (!release) return setUrl(url)
    })()
    return () => {
      release = true
    }
  }, [svg, banner.workspace])

  if (urlError) {
    return <ErrorItem error={urlError} item={item} title={<>SVG Error</>} />
  }

  return (
    <div
      className={classnames('item item-svg', classes)}

      style={{ '--svg-url': url, ...(style || {}) }}
      {...handlers}
    >
      <img src={url} style={style} />
    </div>
  )
}

export default SVGItem
