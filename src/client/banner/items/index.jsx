import React from 'react'
import BannerItemErrorBoundary from '../../error-boundries/banner-item.error-boundry'
import CodiconItem from './codicon'
import ContainerItem from './container'
import HorizontalRuleItem from './hr'
import MarkdownItem from './markdown'
import SpanItem from './span'
import ImageItem from './image'
import TextItem from './text'
import UnknownItem from './unknown'

export const ItemDisplay = ({ item, index }) => {
  const types = {
    text: TextItem,
    svg: ImageItem,
    image: ImageItem,
    container: ContainerItem,
    markdown: MarkdownItem,
    hr: HorizontalRuleItem,
    span: SpanItem,
    codicon: CodiconItem,
  }

  const Comp = types[item.type] || UnknownItem
  return (
    <BannerItemErrorBoundary item={item}>
      <>
        {/* {console.log('🗽🗽🗽🗽 ITEMS DISPILAY', { item })} */}

        <Comp item={item} index={index} />
      </>
    </BannerItemErrorBoundary>
  )
}

export const ItemsDisplay = ({ items }) =>
  items?.length > 0 ? (
    items.map((item, index) => (
      <>
        {/* {console.log('🗽 ITEMS DISPILAY', { item })} */}
        <ItemDisplay
          key={`item-${item.type}-${index}`}
          item={item}
          index={index}
        />
      </>
    ))
  ) : (
    <></>
  )
