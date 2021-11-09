import React, { useEffect } from 'react'
import classnames from 'class-names'
import { ItemsDisplay } from '.'
import useItemHandlers from '../item-handlers.hook'

const ContainerItem = ({ item }) => {
  const { items } = item
  const { handlers, classes } = useItemHandlers(item)

  return (
    <div {...handlers} className={classnames('item item-container', classes)}>
      <ItemsDisplay items={items} />
    </div>
  )
}

export default ContainerItem
