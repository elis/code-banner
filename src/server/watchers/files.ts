/* eslint-disable @typescript-eslint/no-var-requires */
import * as path from 'path'
import * as vscode from 'vscode'
import * as YAML from 'yaml'
import { extname } from 'path'
import { transform } from 'esbuild'
import { ParsedFile, ParsedExecutableFile } from '../../types'
import { YAMLSemanticError, YAMLSyntaxError } from 'yaml/util'
import { escapeRegex } from '../utils'

export type FileWatcherAPI = {
  onReady: (files: ParsedFile[]) => void
  onUpdate: (file: ParsedFile) => void
}

const initFileWatcher = async (
  globs: string[] = [],
  context: vscode.ExtensionContext,
  api: FileWatcherAPI,
  executable = false,
  channel: vscode.OutputChannel
) => {
  const onUpdate = (newData: ParsedFile) => {
    api.onUpdate(newData)
  }
  // console.log('⚠️🌈 Initializing file watcher', { executable })
  channel.appendLine(
    `⚠️🌈 Initializing file watcher - ${executable ? 'Executables' : 'Plain'}`
  )

  const parse = (files: vscode.Uri[]) => parseFiles(files, context, executable)
  const allFiles: vscode.Uri[] = []

  await Promise.all(
    globs.map(async (glob) => {
      const watcher = vscode.workspace.createFileSystemWatcher(glob)
      context.subscriptions.push(
        watcher.onDidChange(
          fileChanged(
            context,
            (data: ParsedFile) => onUpdate(data as ParsedFile),
            executable
          )
        )
      )

      const files = await vscode.workspace.findFiles(glob)
      allFiles.push(...files)
    })
  )
  channel.appendLine(
    `⚠️🌈 File watcher - ${executable ? 'Executables' : 'Plain'} - found ${
      allFiles.length
    } files`
  )
  for (const file of allFiles) {
    const relative = vscode.workspace.asRelativePath(file)
    channel.appendLine(
      `⚠️🌈\t\t File watcher - ${
        executable ? 'Executables' : 'Plain'
      } - found ${relative}`
    )
    channel.appendLine(`⚠️🌈\t\t Depth: ${relative.split('/').length}`)
  }

  // console.log('⚠️🌈 ALLFILES', { allFiles })

  // Read first time
  if (allFiles.length) {
    const results = (await parse(allFiles)) as ParsedFile[]
    const sorted = results.sort((a, b) => (a.level > b.level ? 1 : -1))
    channel.appendLine(
      `⚠️🌈 File watcher - ${executable ? 'Executables' : 'Plain'} - found ${
        allFiles.length
      } files`
    )
    for (const file of allFiles) {
      const relative = vscode.workspace.asRelativePath(file)
      channel.appendLine(
        `⚠️🌈\t\t File watcher - ${
          executable ? 'Executables' : 'Plain'
        } - found ${relative}`
      )
      channel.appendLine(`⚠️🌈\t\t Depth: ${relative.split('/').length}`)
    }
    api.onReady(sorted)
  } else api.onReady([])
}

export const fileChanged =
  (
    context: vscode.ExtensionContext,
    cb: (file: ParsedFile | ParsedExecutableFile) => void,
    executable = false
  ) =>
  async (uri: vscode.Uri) => {
    const parsed = await parseFile(context, executable)(uri)
    cb(parsed)
  }

export const parseFiles = async (
  files: vscode.Uri[],
  context: vscode.ExtensionContext,
  executable = false
): Promise<ParsedFile[]> =>
  Promise.all(files.map(parseFile(context, executable)))

export const parseFile =
  (context: vscode.ExtensionContext, executable = false) =>
  async (uri: vscode.Uri) => {
    const relative = vscode.workspace.asRelativePath(uri)
    const level = relative.split('/').length
    const dirname = path.dirname(relative)

    const workspace = vscode.workspace.getWorkspaceFolder(uri)?.name
    if (!workspace) {
      throw new Error(`Unknow file workspace ${uri.fsPath}`)
    }
    const { conf } = await ingest(context, executable)(uri)

    return {
      dirname,
      executable,
      conf,
      uri,
      relative,
      level,
      workspace,
    }
  }

export const ingest =
  (context: vscode.ExtensionContext, executable = false) =>
  async (uri: vscode.Uri) => {
    const loaded = executable
      ? await importExecutableFile(uri)
      : await importPlainFile(uri)

    const conf: Record<string, any> = {
      context: await contextify(
        uri,
        loaded.context || {},
        loaded.templates || {}
      ),
      templates: loaded.templates || {},
    }
    const sections = 'explorer, scm, debug, test, statusbar'.split(', ')
    for (const section of sections) {
      const keys = Object.keys(loaded).filter(
        (key) => key.split('|').indexOf(section) >= 0
      )
      for (const key of keys) {
        if (loaded[key]) {
          if (executable && typeof loaded[key] === 'function') {
            const data = await loaded[key](uri, context)
            Object.assign(conf, {
              [section]: { ...(conf[section] || {}), ...data },
            })
          } else if (loaded[key]) {
            // context: holds data
            //  context[key: string] = contextify(value: any, context: any)
            //    - typeof value === 'string': withContext(value, context)
            //       "json:./relative/path|some.object.path|default?" -> objectPath(JSON.parse(fs.readFileSync(path.resolve(__dirname, path))), some.object.path, default)
            //       "file:./relative/path|line?|lineEnd?|default?" -> fs.readFileSync(path.resolve(__dirname, path)) as string

            //       "env:ENV_VAR|default?" -> process.env.ENV_VAR || default
            //       "env-file:./relative/path|ENV_VAR|default?" -> file.ENV_VAR || default
            //       "context:CONTEXT_PATH|default" -> objectPath(context, CONTEXT_PATH, default)
            //       "*" -> value.replace(${CONTEXT_PATH|default}, objectPath(context, CONTEXT_PATH, default))

            // Maybe...
            //       "markdown:./relative/path|default" -> markdownToHtml(fs.readFileSync(path.resolve(__dirname, path)) as string)

            //    - typeof value === 'object': value.map((key, value) => [key] = contextify(value, context))
            //    - typeof value === 'array': value.map((value) => contextify(value, context))

            // [key]: holds configuration
            //  [key] = value: any = enrichWithContecxt(value, context)
            //    - typeof value === 'string': withContext(value, context)
            //    - typeof value === 'object': enrich(value, parentContext = context)
            //       context = { ...context, ...contextify(value.context, parentContext) }
            //       value = { ...enrichWithContecxt(value, context) }
            //    - typeof value === 'array': value.map((value) => enrichWithContecxt(value, context))
            //

            const context = await contextify(
              uri,
              loaded[key].context || {},
              loaded[key].templates || {},
              conf.context
            )
            const templates = {
              ...conf.templates,
              ...(loaded[key].templates || {}),
            }

            const result = await enrichWithContext(
              uri,
              loaded[key],
              context,
              templates
            )

            Object.assign(conf, {
              [section]: {
                context,
                templates,
                ...result,
              },
            })
          }
        }
      }
    }

    return {
      uri,
      conf,
    }
  }

export const enrichWithContext = async (
  uri: vscode.Uri,
  data: any,
  parentContext: Record<string, any>,
  templates: Record<string, any>
): Promise<any> => {
  if (!data) {
    return data
  }
  if (typeof data === 'string') {
    return await withContext(uri, data, parentContext, templates)
  }
  if (Array.isArray(data)) {
    const result = await data.reduce(
      (p, value) =>
        p.then(async (acc: any[]) => {
          const res = await enrichWithContext(
            uri,
            value,
            parentContext,
            templates
          )
          return [
            ...acc,
            ...(typeof value === 'string' && value.match(/\|expand$/)
              ? [...res]
              : [res]),
          ]
        }),
      Promise.resolve([])
    )

    return result
  }
  if (typeof data === 'object') {
    const context = {
      ...(await contextify(uri, data.context || {}, templates, parentContext)),
    }
    const result: Record<string, any> = await Object.entries(data).reduce(
      (p, [key, value]) =>
        p.then(async (acc) => {
          if (key === 'context' || key === 'templates') {
            return acc
          }
          const res = await enrichWithContext(uri, value, context, templates)
          return {
            ...acc,
            ...(key === '...' ? { ...res } : { [key]: res }),
          }
        }),
      Promise.resolve({})
    )
    return { ...result, context }
  }
  return data
}

// failsaife json loading from file
export const importJson = async (uri: vscode.Uri) => {
  try {
    const file = await vscode.workspace.fs.readFile(uri)
    const json = JSON.parse(file.toString())
    return json
  } catch (error) {
    console.error('⚠️🌈 JSON ERROR', { uri }, { error })
    return { error }
  }
}

// failsafe file loading
export const importFile = async (uri: vscode.Uri) => {
  try {
    const file = await vscode.workspace.fs.readFile(uri)
    return file.toString()
  } catch (error) {
    console.error('⚠️🌈 FILE ERROR', { uri }, { error })
    return ''
  }
}

const commandSpreader = (command: string, ...names: string[]) => {
  const [, ...rest] = command.split(':')
  const args = rest.join(':').split('|')

  const argums = {} as Record<string, any>
  for (const [index, value] of args.entries()) {
    const next = args[index + 1]
    const name = names[index]
    const optional = name && name.endsWith('?')
    if (optional && typeof next === 'undefined') {
      const name = [...names].pop()!
      argums[name.replace(/\?$/, '')] = value
      continue
    }

    argums[name ? name.replace(/\?$/, '') : index] = value
  }

  return argums
}

const composeFilePath = (uri: vscode.Uri, path: string) =>
  vscode.Uri.joinPath(
    vscode.Uri.parse(uri.fsPath.split('/').slice(0, -1).join('/')),
    path
  )

const withContext = async (
  uri: vscode.Uri,
  value: string,
  context: Record<string, any>,
  templates: Record<string, any>
) => {
  const objectPath = require('object-path')
  const str = await contextString(value, context)

  const [type] = str.split(':')

  if (type === 'json') {
    const args = commandSpreader(str, 'path', 'key', 'default?')

    const filePath = composeFilePath(uri, args.path)
    const json = await importJson(filePath)

    const coalesce = args.key?.split(',').length > 1

    return args.key
      ? objectPath[coalesce ? 'coalesce' : 'get'](
          json,
          coalesce ? args.key.split(',') : args.key,
          args.default
        )
      : json
  } else if (type === 'file') {
    // "file:./relative/path|line?|lineEnd?|default?" -> fs.readFileSync(path.resolve(__dirname, path)) as string
    const args = commandSpreader(str, 'path', 'line?', 'lineEnd?', 'default?')
    const filePath = composeFilePath(uri, args.path)

    const file = await importFile(filePath)
    if (typeof args.line !== 'undefined') {
      const lines = file.split('\n')
      return typeof args.lineEnd !== 'undefined'
        ? lines.slice(+args.line - 1, +args.lineEnd).join('\n') || args.default
        : lines[+args.line] || args.default
    }
    return file || args.default
  } else if (type === 'env') {
    // "env:ENV_VAR|default?" -> process.env.ENV_VAR || default
    const args = commandSpreader(str, 'name', 'default?')

    return vscode.env[args.name as keyof typeof vscode.env] || args.default
  } else if (type === 'env-file') {
    // "env-file:./relative/path|ENV_VAR|default?" -> process.env[ENV_VAR] || default
    const args = commandSpreader(str, 'path', 'name?', 'default?')
    const filePath = composeFilePath(uri, args.path)
    const file = await importFile(filePath)

    const dotenv = require('dotenv')
    const buf = Buffer.from(file)
    const config = dotenv.parse(buf)

    return args.name
      ? config[args.name] || args.default
      : config || args.default
  } else if (type === 'files') {
    // "files:./relative/path|glob|default?" -> files: [string, vscode.FileType]
    const args = commandSpreader(str, 'path', 'glob?')
    const filePath = composeFilePath(uri, args.path)
    const files = await vscode.workspace.fs.readDirectory(filePath)

    return files.length ? files : args.default
  } else if (type === 'template') {
    // "template:name" -> render
    const args = commandSpreader(str, 'name')
    const template = templates[args.name]

    const rendered = await enrichWithContext(
      uri,
      template,
      { ...context, value },
      templates
    )

    return rendered
  } else if (type === 'each') {
    // "each:context.value|template|array?" -> ...
    const args = commandSpreader(str, 'key', 'template', 'array?')
    const coalesce = args.key.split(',').length > 1

    const val = objectPath[coalesce ? 'coalesce' : 'get'](
      context,
      coalesce ? args.key.split(',') : args.key
    )

    if (Array.isArray(val)) {
      const result = await val.reduce(
        (p, value, index) =>
          p.then(async (acc: any[]) => {
            const template = templates[args.template]
            const rendered = await enrichWithContext(
              uri,
              template,
              { ...context, value, index },
              templates
            )
            return [...acc, rendered]
          }),
        Promise.resolve([])
      )
      return result
    }
    if (typeof val === 'object') {
      const result = await Object.keys(val).reduce(
        (p, key, index) =>
          p.then(async (acc: any) => {
            const template = templates[args.template]
            const rendered = await enrichWithContext(
              uri,
              template,
              { ...context, value: val[key], key, index },
              templates
            )
            return args.array ? [...acc, rendered] : { ...acc, [key]: rendered }
          }),
        Promise.resolve(args.array ? [] : {})
      )
      return result
    }

    return 'smooz'
  } else if (type === 'context') {
    const args = commandSpreader(str, 'name', 'default?')

    const coalesce = args.name.split(',').length > 1

    return objectPath[coalesce ? 'coalesce' : 'get'](
      context,
      coalesce ? args.name.split(',') : args.name,
      args.default
    )
  }

  return str
}

export const contextString = async (str: string, context: any) => {
  const objectPath = require('object-path')

  const regex = /\${([^}]+)}/g

  return str.replace(regex, (match, key) => {
    const args = commandSpreader(`string:${key}`, 'name', 'default?')
    const coalesce = args.name.split(',').length > 1

    const value = objectPath[coalesce ? 'coalesce' : 'get'](
      context,
      coalesce ? args.name.split(',') : args.name,
      args.default
    )
    if (typeof value !== 'undefined') {
      return value
    }
    return match
  })
}

export const contextify = async (
  uri: vscode.Uri,
  context: Record<string, any>,
  templates: Record<string, any>,
  parentContext?: Record<string, any>
) => {
  const selfContext = {
    ...parentContext,
    ...context,
  }

  const result: Record<string, any> = await Object.keys(context).reduce(
    async (p, key) =>
      p.then(async (acc) => {
        const value = context[key]

        if (Array.isArray(value)) {
          return {
            ...acc,
            [key]: value.map((item) => {
              if (typeof item === 'string') {
                return item.replace(/\$\{(\w+)\}/g, (_, name) => {
                  return selfContext[name]
                })
              } else {
                return item
              }
            }),
          }
        }
        if (typeof value === 'string') {
          const result = await withContext(
            uri,
            context[key],
            selfContext,
            templates
          )

          return {
            ...acc,
            [key]: result,
          }
        }
        if (value && typeof value === 'object') {
          return {
            ...acc,
            [key]: await contextify(uri, value, templates, selfContext),
          }
        }

        return {
          ...acc,
          [key]: value,
        }
      }),
    Promise.resolve({})
  )

  return { ...selfContext, ...result }
}

export const importPlainFile = async (uri: vscode.Uri) => {
  const readData = await vscode.workspace.fs.readFile(uri)
  const ext = extname(uri.fsPath)
  const data = readData.toString()

  if (!ext || ext === '.cb' || ext === '.yml') {
    try {
      const yaml = YAML.parse(data.replace(new RegExp(`(\t)`, 'g'), '  '), {})

      return yaml
    } catch (error) {
      if (error instanceof YAMLSyntaxError) {
        vscode.window.showErrorMessage(
          `Error parsing YAML file\n\nError: ${error.message}`
        )
      } else if (error instanceof YAMLSemanticError) {
        vscode.window.showErrorMessage(
          `Error parsing YAML file\n\nError: ${error.message}`
        )
      } else {
        vscode.window.showErrorMessage('Error parsing YAML file')
      }
    }
  }
  if (ext === '.json') {
    try {
      const json = JSON.parse(readData.toString())
      return json
    } catch (error) {
      console.log('Error with JSON', error)
      vscode.window.showErrorMessage('Error parsing JSON file')
    }
  }
}

export const importExecutableFile = async (uri: vscode.Uri) => {
  const readData = await vscode.workspace.fs.readFile(uri)

  try {
    const data = readData.toString()

    const v = await transform(data, {
      target: 'node12',
      format: 'cjs',
      loader: 'jsx',
    })

    const requirer = (thang: string) => {
      if (thang.match(/^\./)) {
        throw new Error(
          `Executables do not support local imports yet - ${uri.path}`
        )
      }
      return require(thang)
    }

    const exposed = {
      exports: {},
      require: requirer,
      console,
      __dirname: requirer('path').dirname(uri.path),
      __filename: uri.path,
    }

    const exposee = Object.entries(exposed)
    const exposesKeys = exposee.map(([key, val]) => key)
    const exposesValues = exposee.map(([key, val]) => val)

    const fnArgs = [...exposesKeys, v.code]
    const execFnArgs = [...exposesValues]

    const resultFn = Function(...fnArgs)
    resultFn(...execFnArgs)
    return exposed.exports
  } catch (error) {
    if (!uri.path.match(new RegExp(escapeRegex('/node_modules/')))) {
      vscode.window.showErrorMessage(
        `Executable file ${uri.path} filed to import: ${error}`
      )
    }
    console.log('⚠️🌈 importExecutableFile Error', { uri }, { error })
    return {}
  }
}

export default initFileWatcher
