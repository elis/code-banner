import React, { useEffect, useMemo, useState } from 'react'
import { useBanner } from '.'
import { useComms } from '../services/comms.services'
import { escapeRegex } from '../utils'
import reactStringReplace from 'react-string-replace'

export const useSmartText = (text) => {
  const banner = useBanner()
  const comms = useComms()

  const [display, setDisplay] = useState(text)

  useEffect(() => {
    let release
    ;(async () => {
      let response = text

      const replacables = text.match(/(\$\(([^)]*)+\))+/g)
      if (replacables?.length > 0)
        for (const item of replacables) {
          const [, x] = item.match(/^\$\(([^)]+)\)$/)
          const [v] = x.split(', ')

          if (v.match(/^codicon:/i)) {
            const [, icon] = v.split(':')

            const output = reactStringReplace(
              response,
              new RegExp(`(${escapeRegex(item)})`, 'g'),
              (match, index) => (
                <i
                  key={`codicon-${index}`}
                  className={`codicon codicon-${icon}`}
                />
              )
            )
            return setDisplay(output)
          }
        }

      const parsed = await comms.actions.requestResponse('parse-text-content', {
        text,
        workspace: banner.workspace,
        caller: banner.relative,
      })

      if (!release) setDisplay(parsed)
    })()
    return () => {
      release = true
    }
  }, [text, banner.workspace])

  const result = useMemo(() => {
    let output = text
    if (output !== display && !!display) return display

    const replacables = text.match(/(\$\(([^)]*)+\))+/g)

    if (replacables?.length > 0)
      for (const item of replacables) {
        const [, x] = item.match(/^\$\(([^)]+)\)$/)
        const [v, defs] = x.split(', ')
        output = output.replace(new RegExp(`${escapeRegex(item)}`, 'g'), defs)
      }
    return output
  }, [text, display])

  return result
}
