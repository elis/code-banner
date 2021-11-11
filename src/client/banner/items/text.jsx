import React from 'react'
import classnames from 'class-names'
import useItemHandlers from '../item-handlers.hook'
import { useSmartText } from '../smart-text.hook'

const TextItem = ({ children, item }) => {
  const { text } = item
  const display = useSmartText(text || children)
  const { handlers, classes } = useItemHandlers(item)

  console.log('-=-===-=-=-=-=-=-- DISPLAY TEXT ITEM', { text, display })
  return (
    <div {...handlers} className={classnames('item item-text', classes)}>
      {display}
    </div>
  )
}

export default TextItem
