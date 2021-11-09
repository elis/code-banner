import React, { createContext, useContext, useEffect, useState } from 'react'
import { escapeRegex } from '../utils'
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
    console.log('🛩 FOUND FILES:', { active, files, visible })

    const confs = files
      .filter((file) => {
        // if (
        //   file.level === 1 &&
        //   file.conf[config.viewContainer]?.depth === undefined
        // )
        //   return true
        if (!file) return false
        if (active && file.dirname === active.dirname) return true
        if (visible?.find((editor) => editor.dirname === file.dirname))
          return true

        // Handle depth
        if (
          visible?.find(
            (editor) =>
              (file.level === 1 ||
                editor.dirname.match(
                  new RegExp(`^${escapeRegex(file.dirname)}`)
                )) &&
              // ! New
              (console.log(
                '🛩 FOUND ROWS:',
                { file: file.relative },
                {
                  file,
                  editor,

                  'editor-level': editor.level,
                  'file-level': file.level,
                  'rows reach': file.conf[config.viewContainer]?.rows?.map(
                    (row) => ({
                      'row editor glob': row.glob
                        ? minimatch(editor.relative, row.glob)
                        : true,
                      reach: row.depth + file.level,
                      '1st item': row.items?.[0],
                    })
                  ),

                  'actual result': file.conf[config.viewContainer]?.rows?.find(
                    (row) => row.depth + file.level >= editor.level
                  ),
                  'filtered matching rows:': file.conf[
                    config.viewContainer
                  ]?.rows?.filter(
                    (row) =>
                      (typeof row.depth === undefined && file.level === 1) ||
                      (row.depth || 50) + file.level >= editor.level
                  ),
                  'general file rows': file.conf[config.viewContainer]?.rows,
                }
              ) ||
                file.conf[config.viewContainer]?.rows?.find(
                  (row) =>
                    (typeof row.depth === undefined && file.level === 1) ||
                    (row.depth || 50) + file.level >= editor.level
                ))
            // ! Old
            // file.conf[config.viewContainer]?.depth + file.level >=
            //   editor.level
          )
        )
          return true
      })

      .sort((a, b) => (a.level > b.level ? 1 : -1))
      .sort((a, b) =>
        !a.conf?.[config.viewContainer]?.priority ||
        +b.conf?.[config.viewContainer]?.priority
          ? 0
          : +a.conf?.[config.viewContainer]?.priority <
            +b.conf?.[config.viewContainer]?.priority
          ? 1
          : -1
      )

    const nextConfs = files
      // Convert rows to individual confs
      .map((file) => ({
        file,
        rows:
          file.conf?.[config.viewContainer]?.rows
            ?.map((row) => ({
              ...row,
              reach: (row.depth || 50) + file.level,
              _matchingEditors: visible.filter(
                (editor) =>
                  // Match level, depth, and sensitivity
                  file.level - (row.sensitivity || 0) <= editor.level &&
                  editor.level <= file.level + (row.depth || 50) &&
                  // Echo
                  (console.log('⧆ Testing row', {
                    editor,
                    row,

                    'row.glob': row.glob,
                    'editor.relative': editor.relative,

                    '!row.glob || minimatch(editor.relative, row.glob)':
                      !row.glob || minimatch(editor.relative, row.glob),

                    'row.condition': row.condition,
                    'row.condition result':
                      !row.condition ||
                      !!objectPath.get(
                        {
                          editor,
                        },
                        row.condition
                      ),
                    'condition object path:':
                      row.condition &&
                      objectPath.get(
                        {
                          editor,
                        },
                        row.condition
                      ),
                  }) ||
                    true) &&
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
            .filter((row) => row._matchingEditors.length) || [],
      }))

      .filter((matched) => matched.rows.length)
      .reduce(
        (acc, { file: { conf, ...file }, rows }) => [
          ...acc,
          ...(console.log('💺 examing fconf:', { file, rows, conf }) ? [] : []),
          ...(rows.map((row) => ({
            ...file,
            conf: row,
          })) || []),
        ],
        []
      )
    // .reduce(
    //   (acc, { rows, ...file }) => [
    //     ...acc,
    //     ...rows.map((row) => ({ ...file, ...row })),
    //   ],
    //   []
    // )

    console.log('🛩 Next confs value:', { nextConfs })
    // console.log('🛩 Setting "confs" state:', { confs })
    // setState((v) => ({ ...v, confs }))
    console.log('🛩 Setting "confs" state:', { confs: nextConfs })
    setState((v) => ({ ...v, confs: nextConfs }))
  }, [active, files, visible])

  useEffect(() => {
    console.log('🚤 Confs updated:', state.confs)
  }, [state.confs])

  return (
    <BannersContext.Provider value={value}>{children}</BannersContext.Provider>
  )
}

export const useBanners = () => useContext(BannersContext)

export default BannersService
