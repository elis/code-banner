import React, { useEffect } from 'react'
import { useBanners } from './services/banners.service'
import Banner from './banner'
import { useConfig } from './services/config.service'

const Panel = () => {
  const {
    state: { confs },
  } = useBanners()

  const config = useConfig()

  useEffect(() => {
    document.documentElement.classList[
      config.state.theme?.kind === 2 ? 'add' : 'remove'
    ]('dark')
  }, [config.state.theme])

  return (
    <div className={'banners'}>
      {confs?.map((file, index) => (
        <Banner
          key={'banner ' + file.relative + '-' + index}
          workspace={file.workspace}
          config={file.conf}
          relative={file.relative}
        />
      ))}
    </div>
  )
}

export default Panel
