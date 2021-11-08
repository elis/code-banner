import React from 'react'

const UnknownItem = ({ item }) => {
  return (
    <>
      Unknown type: <strong>{item.type}</strong>
    </>
  )
}

export default UnknownItem
