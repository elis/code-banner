import React, { useEffect } from 'react'
import { useConfig } from './services/config.service'

export const Panel = ({ text }) => {
  const config = useConfig()

  useEffect(() => {
    console.log('🧏‍♀️🧏‍♀️🧏‍♀️ config updated:', config)
  }, [config])

  return (
    <>
			<div className='banners'>
				{config.state?.files?.map(file => (<div className='banner'>{file.relative}</div>))}
			</div>
      <div>
        <span>Files: {config.state.files.length}</span>
      </div>
      <div>Panel Stuff {!!text && <>{text}</>}</div>
    </>
  )
}
