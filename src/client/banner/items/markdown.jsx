import React from 'react'
import classnames from 'class-names'
import ReactMarkdown from 'react-markdown'
import useItemHandlers from '../item-handlers.hook'
import { useSmartText } from '../smart-text.hook'

const MarkdownItem = ({ item }) => {
  const { markdown } = item
  const display = useSmartText(markdown)
  const { handlers, classes } = useItemHandlers(item)

  return (
    <div {...handlers} className={classnames('item item-markdown', classes)}>
      <ReactMarkdown>{display}</ReactMarkdown>
    </div>
  )
}

export default MarkdownItem
