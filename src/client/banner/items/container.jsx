import React, { useEffect } from 'react'
import classnames from 'class-names'
import { ItemsDisplay } from '.'
import useItemHandlers from '../item-handlers.hook'

const ContainerItem = ({ item, responsive }) => {
  const { items } = item
  const { handlers, classes } = useItemHandlers(item)

  return (
    <div {...handlers} className={classnames('item item-container', classes)}>
      <ItemsDisplay items={items} responsive={responsive} />
    </div>
  )
}

export default ContainerItem
