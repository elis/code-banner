import React, { createContext, useContext, useEffect, useState } from 'react'
import { useConfig } from './config.service'
import minimatch from 'minimatch'
import objectPath from 'object-path'
import { escapeRegex } from '../utils'
import mhash from 'imurmurhash'

export const BannersContext = createContext()
const BannersService = ({ children }) => {
  const config = useConfig()

  const [state, setState] = useState({})
  const actions = {}

  const value = { state, actions }
  const { active, files, visible } = config.state

  useEffect(() => {
    // console.log('🧃 FILES', { files, active, visible })

    const nextConfs = files
      // Convert rows to individual confs
      // .map(
      //   (file) =>
      //     console.log('🧃 INSPECTING FILE', file.relative, {
      //       file,
      //       active,
      //       visible,
      //       'config.viewContainer': config.viewContainer,

      //       ...(file.conf?.[config.viewContainer]?.responsive
      //         ? { responsive: file.conf?.[config.viewContainer]?.responsive }
      //         : {}),
      //     }) || file
      // )
      .map((file) => ({
        file,
        ...(file.conf?.[config.viewContainer]?.responsive
          ? { responsive: file.conf?.[config.viewContainer]?.responsive }
          : {}),
        rows:
          file.conf?.[config.viewContainer]?.rows
            ?.map((row) => ({
              ...row,

              ...(row['responsive']
                ? { responsive: row['responsive'] }
                : file.conf?.[config.viewContainer]?.responsive
                ? { responsive: file.conf?.[config.viewContainer]?.responsive }
                : {}),
              file,
              reach: (row.depth || 50) + file.level,
              _matchingEditors: (visible?.length
                ? visible
                : // Patch in a dummy editor if no editors visible
                  [{ level: 1, relative: '.', dirname: '.' }]
              )
                .map((editor) => ({
                  _debug: {
                    _1_level_sensitivity:
                      file.level - (row.sensitivity || 0) <= editor.level,
                    _2_level_depth:
                      editor.level <= file.level + (row.depth || 50),
                    _3_subdir_or_parent:
                      (file.level > 1 &&
                        editor.relative.match(
                          new RegExp(
                            `^${escapeRegex(file.dirname.replace(/^\.$/, ''))}`
                          )
                        )) ||
                      file.relative.match(
                        new RegExp(
                          `^${escapeRegex(editor.dirname.replace(/^\.$/, ''))}`
                        )
                      ),
                    _3_1_subdir:
                      file.level === 1 ||
                      editor.relative.match(
                        new RegExp(
                          `^${escapeRegex(file.dirname.replace(/^\.$/, ''))}`
                        )
                      ),
                    _3_2_parent: file.relative.match(
                      new RegExp(
                        `^${escapeRegex(editor.dirname.replace(/^\.$/, ''))}`
                      )
                    ),
                    _4_glob:
                      !row.glob ||
                      (Array.isArray(row.glob) ? row.glob : [row.glob]).find(
                        (r) => minimatch(editor.relative, r)
                      ),
                    _5_condition:
                      !row.condition ||
                      !!objectPath.get(
                        {
                          editor,
                        },
                        row.condition
                      ),
                  },

                  ...editor,
                }))

                // .map(
                //   (editor) =>
                //     console.log('🧃🧃🧃🧃 INSPECTING EDITOR', editor.relative, {
                //       editor,
                //       row,
                //       file,
                //     }) || editor
                // )

                .filter(
                  (editor) =>
                    // Match level, depth, and sensitivity
                    file.level - (row.sensitivity || 0) <= editor.level &&
                    editor.level <= file.level + (row.depth || 50) &&
                    // Match subdirectory
                    (file.level === 1 ||
                      editor.relative.match(
                        new RegExp(
                          `^${escapeRegex(file.dirname.replace(/^\.$/, ''))}`
                        )
                      ) ||
                      file.relative.match(
                        new RegExp(
                          `^${escapeRegex(editor.dirname.replace(/^\.$/, ''))}`
                        )
                      )) &&
                    // Match glob
                    (!row.glob ||
                      (Array.isArray(row.glob) ? row.glob : [row.glob]).find(
                        (r) => minimatch(editor.relative, r)
                      )) &&
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

            // .map(
            //   (row) =>
            //     console.log('🧃🧃🧃 INSPECTING ROW', file.relative, {
            //       row,
            //       file,
            //     }) || row
            // )

            .filter((row) => row._matchingEditors.length)
            .sort((a, b) =>
              a.priority >= 0 && b.priority >= 0
                ? a.priority < b.priority
                  ? 1
                  : -1
                : a.priority > 0
                ? -1
                : b.priority > 0
                ? 1
                : 0
            ) || [],
      }))

      // .map(
      //   (row) =>
      //     console.log('🧃🧃 INSPECTING ROW', row.file.relative, { row }) || row
      // )

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

    const unconfs = JSON.stringify(nextConfs, (k, v) => k !== 'context' && v)
    const hashState = mhash(unconfs)
    const hashed = hashState.result()
    if (!hashed || hashed !== state.__hash)
      setState((v) => ({ ...v, confs: nextConfs, __hash: hashed }))
  }, [active, files, visible])

  return (
    <BannersContext.Provider value={value}>{children}</BannersContext.Provider>
  )
}

export const useBanners = () => useContext(BannersContext)

export default BannersService
