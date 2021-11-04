import React from 'react'

export const Panel = ({ text}) => {
	return (
		<>
			Panel Stuff {!!text && (<>{text}</>)}
		</>
	)
}