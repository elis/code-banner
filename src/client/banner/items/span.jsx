import React from 'react'
import classnames from 'class-names'
import useItemHandlers from '../item-handlers.hook'

const SpanItem = ({ item }) => {
  const { handlers, classes } = useItemHandlers(item)

  return (
    <span {...handlers} className={classnames('item item-span', classes)} />
  )
}

export default SpanItem
