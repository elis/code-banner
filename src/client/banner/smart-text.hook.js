import { useEffect, useMemo, useState } from 'react'
import { useBanner } from '.'
import { useComms } from '../services/comms.services'
import { escapeRegex } from '../utils'

export const useSmartText = (text) => {
  const banner = useBanner()
  const comms = useComms()

  const [display, setDisplay] = useState(text)

  useEffect(() => {
    let release
    ;(async () => {
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
