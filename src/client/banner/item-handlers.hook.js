import { useCallback, useEffect, useMemo, useState } from 'react'
import { useBanner } from '.'
import { useComms } from '../services/comms.services'

const useItemHandlers = (item) => {
  const comms = useComms()
  const banner = useBanner()

  const [classes, setClasses] = useState({})

  useEffect(() => {
    if (typeof item.click === 'string') {
      const action = item.click.match(/^command:(.*)$/i)
      console.log('👩‍🦳 Item handler action:', { action })
      if (action?.[1]) {
        setClasses((v) => ({ ...v, click: true }))
      }
    } else {
      setClasses((v) => ({ ...v, click: false }))
    }
  }, [item.click])

  const onClick = useMemo(() => {
    return () => {
      console.log('👩‍🦳 Item click:', { item })
      if (typeof item.click === 'string') {
        const action = item.click.match(/^command:(.*)$/i)
        console.log('👩‍🦳 Item handler action:', { action })
        if (action?.[1]) {
          const [command, ...args] = action[1].split(':')
          setClasses((v) => ({ ...v, click: true }))
          console.log('👩‍🦳 Command execution request:', { command, args })

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
  const handlers = {
    ...(item.click ? { onClick } : {}),
  }

  return {
    classes,
    handlers,
  }
}

export default useItemHandlers
