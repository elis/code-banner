import React, { useEffect, useState } from 'react'
import { useComms } from './services/comms.services'
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
				if (item.type === 'svg')
					return <SVGItem key={'item-svg-' + index} svg={item.svg} />
			})}
		</div>
	)
}

const TextItem = ({ children, text }) => {
	return (
		<div className='item item-text'>{text || children}</div>
	)
}
const SVGItem = ({ svg }) => {
	const comms = useComms()
	// const onDiskPath = vscode.Uri.file(
	// 	path.join(context.extensionPath, 'media', 'cat.gif')
	// );
	// const catGifSrc = panel.webview.asWebviewUri(onDiskPath);

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
		(async () => {
			const uri = await comms.actions.getWebviewUri(svg)
			console.log('resulting rui:', uri)
			// const url = `${uri.scheme}://${uri.authority}${uri.path}`
			setUrl(uri.external.replace('https:', 'vscode-resource:'))
		})()
		return () => { release = true }
	}, [svg])
	

	return (
		<div className='item item-svg'>
			<img src={url} />
			<div>{svg}</div>
			<div>{url}</div>
		</div>
	)
}
