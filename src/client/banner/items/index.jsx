import React from 'react'
import BannerItemErrorBoundary from '../../error-boundries/banner-item.error-boundry'
import ContainerItem from './container'
import MarkdownItem from './markdown'
import SVGItem from './svg'
import TextItem from './text'
import UnknownItem from './unknown'

export const ItemDisplay = ({ item, index }) => {
  const handlers = {
    text: TextItem,
    svg: SVGItem,
    container: ContainerItem,
    markdown: MarkdownItem,
  }

  const Comp = handlers[item.type] || UnknownItem
  return (
    <BannerItemErrorBoundary item={item}>
      <Comp item={item} index={index} />
    </BannerItemErrorBoundary>
  )
}

export const ItemsDisplay = ({ items }) =>
  items?.length > 0 ? (
    items.map((item, index) => (
      <ItemDisplay
        key={`item-${item.type}-${index}`}
        item={item}
        index={index}
      />
    ))
  ) : (
    <></>
  )
