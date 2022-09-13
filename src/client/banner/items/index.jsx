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

export const ItemDisplay = ({ item, index, responsive }) => {
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
      <Comp item={item} index={index} responsive={responsive} />
    </BannerItemErrorBoundary>
  )
}

export const ItemsDisplay = ({ items, responsive }) =>
  items?.length > 0 ? (
    items
      .map((item) => [
        item,
        responsive?.length
          ? item['if-responsive']
            ? (typeof item['if-responsive'] === 'string'
                ? item['if-responsive'].split(',')
                : Array.isArray(item['if-responsive'])
                ? item['if-responsive']
                : []
              )
                .filter((key) => responsive.indexOf(key) > -1)
                .reduce((a, b) => a || b, false)
            : true
          : true,
      ])
      .map(
        ([item, respi], index) =>
          (respi && (
            <ItemDisplay
              key={`item-${item.type}-${index}`}
              item={item}
              index={index}
              responsive={responsive}
            />
          )) || <></>
      )
  ) : (
    <></>
  )
