import { useCallback, useEffect, useMemo, useState } from 'react'
import { useBanner } from '.'
import { useComms } from '../services/comms.services'

const useItemHandlers = (item) => {
  const comms = useComms()
  const banner = useBanner()

  const [classes, setClasses] = useState({})
  const [styles, setStyles] = useState(item.style || {})

  useEffect(() => {
    if (typeof item.click === 'string') {
      const action = item.click.match(/^command:(.*)$/i)
      if (action?.[1]) {
        setClasses((v) => ({ ...v, click: true }))
      }
    } else {
      setClasses((v) => ({ ...v, click: false }))
    }
  }, [item.click])

  const onClick = useMemo(() => {
    return () => {
      if (typeof item.click === 'string') {
        const action = item.click.match(/^command:(.*)$/i)
        if (action?.[1]) {
          const [command, ...args] = action[1].split(':')
          setClasses((v) => ({ ...v, click: true }))

          comms.actions
            .requestResponse('execute-command', {
              command,
              args,
              workspace: banner.workspace,
              caller: banner.relative,
            })
            .then((result) => {
              console.log('👩‍🦳 Command execution result:', { result })
            })
            .catch((error) => {
              console.log('👩‍🦳 Command execution resulted in error:', { error })
            })
        }
      }
    }
  }, [item.click])

  const onMouseEnter = useCallback(() => {
    if (item.hoverStyle) {
      setStyles((v) => ({ ...v, ...item.hoverStyle }))
    }
  }, [item.hoverStyle])
  const onMouseLeave = useCallback(() => {
    if (item.style && item.hoverStyle) {
      setStyles(item.style)
    } else if (item.hoverStyle) setStyles({})
  }, [item.style])

  const handlers = {
    style: styles,
    ...(item.click ? { onClick } : {}),
    ...(item.hoverStyle
      ? {
          onMouseEnter,
          onMouseLeave,
        }
      : {}),
  }

  return {
    styles,
    classes,
    handlers,
  }
}

export default useItemHandlers
