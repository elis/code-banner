import React from 'react'
import { ItemsDisplay } from '.'

const ContainerItem = ({ item: { items, style } }) => {
  return (
    <div className="item item-container" style={{ ...(style || {}) }}>
      <ItemsDisplay items={items} />
    </div>
  )
}

export default ContainerItem
