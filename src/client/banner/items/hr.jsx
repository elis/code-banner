import React from 'react'
import classnames from 'class-names'
import useItemHandlers from '../item-handlers.hook'

const HorizontalRuleItem = ({ item }) => {
  const { handlers, classes } = useItemHandlers(item)

  return (
    <hr {...handlers} className={classnames('item item-hr', classes)} />
  )
}

export default HorizontalRuleItem
