import React, { useMemo } from 'react'
import { useBanners } from './services/banners.service'
import Banner from './banner'

const Panel = () => {
  const banners = useBanners()

  const files = useMemo(() => {
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

export default Panel
