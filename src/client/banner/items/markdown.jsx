import React from 'react'
import ReactMarkdown from 'react-markdown'
import { useSmartText } from "../smart-text.hook"

const MarkdownItem = ({ item: { markdown, style } }) => {
  const display = useSmartText(markdown)
  return <ReactMarkdown style={{ ...(style || {}) }}>{display}</ReactMarkdown>
}

export default MarkdownItem
