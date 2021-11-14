import React, { useEffect, useState } from 'react'
import classnames from 'class-names'
import { useBanner } from '..'
import { useComms } from '../../services/comms.services'
import useItemHandlers from '../item-handlers.hook'
import ErrorItem from './error'

const ImageItem = ({ item }) => {
  const { svg, image, path, url: userUrl, elementStyle, elementClasses } = item
  const banner = useBanner()
  const comms = useComms()

  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState(null)
  const { handlers, classes, styles } = useItemHandlers(item)

  useEffect(() => {
    let release
    setUrlError()
    ;(async () => {
      const fullpath = svg || image || path || userUrl
      if (fullpath.match(/^https/i)) {
        return setUrl(fullpath)
      }
      const uri = await comms.actions.requestResponse('get-webview-uri', {
        fullpath,
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
  }, [svg, image, path, userUrl, banner.workspace])

  if (urlError) {
    return <ErrorItem error={urlError} item={item} title={<>Image Error</>} />
  }

  return (
    <div
      {...handlers}
      className={classnames('item', `item-${item.type}`, classes)}
      style={{ [`--${item.type}-url`]: url, ...(styles || {}) }}
    >
      <img src={url} style={elementStyle} className={elementClasses} />
    </div>
  )
}

export default ImageItem
