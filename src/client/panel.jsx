import React, { useEffect, useMemo } from 'react'
import { useBanners } from './services/banners.service'
import Banner from './banner'

const Panel = () => {
  const { state: { confs } } = useBanners()

  return (
    <div className={'banners'}>
      {confs?.map((file, index) => (

        <Banner
          key={'bannenr ' + file.relative + '-' + index}
          workspace={file.workspace}
          config={file.conf}
          relative={file.relative}
        />
      ))}
    </div>
  )
}

export default Panel
