import React, { createContext, useContext, useEffect, useState } from 'react'
import { useConfig } from './config.service'
import minimatch from 'minimatch'
import objectPath from 'object-path'

export const BannersContext = createContext()
const BannersService = ({ children }) => {
  const config = useConfig()

  const [state, setState] = useState({})
  const actions = {}

  const value = { state, actions }
  const { active, files, visible } = config.state

  useEffect(() => {
    const nextConfs = files
      // Convert rows to individual confs
      .map((file) => ({
        file,
        rows:
          file.conf?.[config.viewContainer]?.rows
            ?.map((row) => ({
              ...row,
              reach: (row.depth || 50) + file.level,
              _matchingEditors: visible
              .map(editor => ({
                _atLevel: file.level - (row.sensitivity || 0) <= editor.level,
                ...editor
              }))
              .filter(
                (editor) =>
                  // Match level, depth, and sensitivity
                  file.level - (row.sensitivity || 0) <= editor.level &&
                  editor.level <= file.level + (row.depth || 50) &&
                  // Match glob
                  (!row.glob || minimatch(editor.relative, row.glob)) &&
                  // Match condition
                  (!row.condition ||
                    !!objectPath.get(
                      {
                        editor,
                      },
                      row.condition
                    ))
              ),
            }))
            .filter((row) => row._matchingEditors.length)
            .sort((a, b) =>
              a.priority >= 0 && b.priority >= 0
                ? a.priority > b.priority
                  ? 1
                  : -1
                : a.priority > 0
                ? 1
                : b.priority > 0
                ? -1
                : 0
            ) || [],
      }))
      .filter((matched) => matched.rows.length)
      .sort((a, b) => (a.file.level > b.file.level ? 1 : -1))
      .reduce(
        (acc, { file: { conf, ...file }, rows }) => [
          ...acc,
          ...(rows.map((row) => ({
            ...file,
            conf: row,
          })) || []),
        ],
        []
      )

    setState((v) => ({ ...v, confs: nextConfs }))
  }, [active, files, visible])

  return (
    <BannersContext.Provider value={value}>{children}</BannersContext.Provider>
  )
}

export const useBanners = () => useContext(BannersContext)

export default BannersService
