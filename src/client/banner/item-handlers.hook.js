import { useCallback, useEffect, useMemo, useState } from 'react'
import { useBanner } from '.'
import { useComms } from '../services/comms.services'

const useItemHandlers = (item) => {
  const comms = useComms()
  const banner = useBanner()

  const [classes, setClasses] = useState({})
  const [styles, setStyles] = useState(item.style || {})
  
  useEffect(() => {
    if (item.classes) {
      if (typeof item.classes === 'string') {
        setClasses(v => ({ ...v, [item.classes]: true}))
        return () => {
          setClasses(({ [item.classes]: x, ...v }) => v)
        }
      }
    }
  }, [item.classes])

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

  useEffect(() => {
    setStyles(item.style)
  }, [item.style])

  const onClick = useMemo(() => {
    return () => {
      if (typeof item.click === 'string') {
        const [, action, args] = item.click.match(/^([^:]+):(.*)$/i)
        if (action === 'command' && args) {
          setClasses((v) => ({ ...v, click: true }))
          const [command, ...args] = args.split(':')

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
        } else if (action === 'open') {
          setClasses((v) => ({ ...v, active: true }))

          comms.actions
            .requestResponse('open-external', {
              url: args,
              workspace: banner.workspace,
              caller: banner.relative,
            })
            .then((result) => {
              if (result === 'success') {
                setClasses((v) => ({ ...v, success: true }))
              }
              setClasses((v) => ({ ...v, active: false }))
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

  useEffect(() => {
    if (typeof item.successStyle !== 'undefined') {
      setStyles((v) => ({
        ...v,
        ...(classes.active ? item.successStyle : item.style || {}),
      }))

      if (classes.active) {
        const tid = setTimeout(() => {
          setStyles((v) => ({
            ...(item.style || {}),
          }))
        }, 2500)

        return () => clearTimeout(tid)
      }
    }
  }, [classes.success])

  useEffect(() => {
    if (typeof item.activeStyle !== 'undefined') {
      setStyles((v) => ({
        ...(classes.active ? { ...v, ...item.activeStyle } : item.style || {}),
      }))
    }
  }, [item.activeStyle, classes.active])

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
