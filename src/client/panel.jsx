import React, { useEffect } from 'react'
import { useConfig } from './services/config.service'

import './testing.scss'

export const Panel = ({ text }) => {
  const config = useConfig()

  useEffect(() => {
    console.log('🧏‍♀️🧏‍♀️🧏‍♀️ config updated:', config)
  }, [config])

  return (
    <>
			<div className={'banners'}>
				{config.state?.files?.map(file => (<Banner key={'bannenr ' + file.relative} config={file.conf} relative={file.relative} />))}
			</div>
      <div>
        <span>Files: {config.state.files.length}</span>
      </div>
      <div>Panel Stuff {!!text && <>{text}</>}</div>
    </>
  )
}

const Banner = ({ config, relative }) => {
	const { explorer: { items }} = config
	return (
		<div className='banner'>
			{items?.length > 0 && items.map((item, index) => {
				if (item.type === 'text')
					return <TextItem key={'item-text-' + index}>{item.text}</TextItem>
			})}
		</div>
	)
}

const TextItem = ({ children, text }) => {
	return (
		<div className='item item-text'>{text || children}</div>
	)
}
