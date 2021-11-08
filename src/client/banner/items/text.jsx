import React, { useEffect, useState } from 'react'
import classnames from 'class-names'
import useItemHandlers from '../item-handlers.hook'
import { useSmartText } from '../smart-text.hook'

const TextItem = ({ children, item }) => {
  const { text, style } = item
  const display = useSmartText(text || children)
  const { handlers, classes } = useItemHandlers(item)

  return (
    <div className={classnames('item item-text', classes)} style={{ ...(style || {}) }} {...handlers}>
      {display}
    </div>
  )
}

export default TextItem
