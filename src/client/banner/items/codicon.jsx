import React from 'react'
import classnames from 'class-names'
import useItemHandlers from '../item-handlers.hook'

const CodiconItem = ({ item }) => {
  const { handlers, classes } = useItemHandlers(item)

  return (
    <span className={classnames('item item-codicon', classes)} {...handlers}>
      <i
        className={`codicon codicon-${item.codicon}`}
        style={item.elementStyle || {}}
      />
    </span>
  )
}

export default CodiconItem
