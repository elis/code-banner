# Code Banner

Create visually pleasing and helpful "banners" with your projects custom logo and any additional useful information.

Add custom actions, read and display local JSON/YAML data, and easily customize using styles.


[![Badge for version for Visual Studio Code extension EliSklar.code-banner](https://vsmarketplacebadge.apphb.com/version/EliSklar.code-banner.svg?color=blue&style=flat-square&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=EliSklar.code-banner)
[![Installs](https://vsmarketplacebadge.apphb.com/installs-short/EliSklar.code-banner.svg?color=blue&style=flat-square)](https://marketplace.visualstudio.com/items?itemName=johnpapa.vscode-peacock&WT.mc_id=javascript-0000-jopapa)
[![Downloads](https://vsmarketplacebadge.apphb.com/downloads-short/EliSklar.code-banner.svg?color=blue&style=flat-square)](https://marketplace.visualstudio.com/items?itemName=johnpapa.vscode-peacock&WT.mc_id=javascript-0000-jopapa)
[![Subreddit subscribers](https://img.shields.io/reddit/subreddit-subscribers/codebanner?color=green&label=r%2Fcodebanner&logo=reddit&logoColor=white&style=flat-square)](https://reddit.com/r/codebanner)

[![The MIT License](https://img.shields.io/badge/license-MIT-orange.svg?color=blue&style=flat-square)](http://opensource.org/licenses/MIT)


VSCode extension to add identifiable and useful information and actions to VSCode sidebare panels and status bar:

![Example of [Code Banner](https://github.com/elis/code-banner)'s banner](https://raw.githubusercontent.com/elis/elis/main/random/code-banner/example-1.png)

Instantly add the information you need to have it available at a glance exactly when needed!

## Features

* 👨‍🎤 Highly customizable
* 🎢 Custom actions and shortcuts
* 🗺 Nested configuration
* 🪄 Markdown, plain text, and smart tags
* ⏱ Fast and responsive
* ⌗ Read and display data from `package.json` or any yaml/json file
* 🖼 Templating support and templates for common use cases
* 💾 Custom data context - read and display data from any file

## Usage

After installation the extension you will have a new panel in your explorer, debug, and scm views named `CODE BANNER`.

This panel's content is entirely controlled by the content of your workspace, allowing you to display information such as text, images, json data, or any combination of those and preferform custom actions all defined in `.cb` or `.pb` files in your workspaces.

## Set Up Via Command Palette

Set up a basic `code banner` by opening the command palette (CMD/CTRL+SHIFT+P) and typing `code banner`. This will give you three options:

### Generate Basic Code Banner

Will create a `.cb` file with a basic banner set up, which you can edit the code of to reflect your project. This banner will be shown in every file of your project in the sidebar.

### Generate Advanced Code Banner

Will create a `.cb` file with a more advanced banner set up. This set up will inlcude a code banner that will show on every file, but also a code banner that will only show up when a `.cb` or `.js` file is open. Use this template to customize your code banner how you see fit.

### View Read Me

Opens this README.md for future reference to the documentation

## In Depth Tutorial

### Step 1: Create .cb file

Install the [Code Banner](https://marketplace.visualstudio.com/items?itemName=EliSklar.code-banner) VSCode extension from the marketplace (alternatively you can [download .vsix packed extension](https://github.com/elis/code-banner/releases) from the release section, or [build it](#building) locally).

Next add to your workspace a `.cb` (dot cb) file at the root of the workspace directory, open the file with vscode and change laguage mode to `YAML`.

Add to your new `.cb` file the following:

```yaml
explorer:
  rows:
    - items:
        - type: text
          text: Hello, World!
```

> *Note*: If you're not a fan of YAML you can use `.cb.json` files instead, or if you need more functionality and customizability and the workspace is a [trusted workspace](https://code.visualstudio.com/docs/editor/workspace-trust) you can use `.pb` files instead which are treated as plain javascript files.

Once the file is save, and you have the sidebar open on the `Explorer` section, and the `Code Banner` panel is visible and open, you should see your `Hello, World!`

![Tutorial screenshot #1 - first banner](https://raw.githubusercontent.com/elis/elis/main/random/code-banner/tutorial-01.png)

And you're done!

Go a head an explore below the different things you can do with code banner and create the perfect setup for your project!

# Documentation

The extension supports several file formats that all evetually compile to a sigle `configuration` setting for Code Banner from the different files.

In this section we'll refer to `conf`, `config`, or `configuration` files to ay supporting format.

## Basic Anatomy

Code Banner's cofiguration consists of `.cb` files (and other supporting formats as listed below) sprinkled in your project directories.

The location of the conf file is critical becuase it dictates to the extensio how to treat the various setting and options listed in the conf file in regards to the current context (active and visible editors, active file type, editor state, etc').

### Root Configuration

Configuration files in workspace root directory are considered `Top Level` and will persists thruoughout the project regardless of the context (unless configured otherwise).

These are useful to provide the overall branding for your project, including some useful information such as project name, logo, author, curret package version, etc', and relevant project actions such as starting debug, executing NPM script, or any other supported action you can think of or a combination of actions.

### Sub-directory Configurations

Any nested configuration file will automatically be triggerred and activated (can be configured otherwise), and any panels or statusbar in the config will appear when the user navigates to a file in the configuration's file directory or any of its subdirectories.

### Cofiguration File Formats

Code Banner currently supports three file formats: javascript (`?.pb` files), YAML (`?.cb` and `?.cb.yml`), and JSON (`?.cb.json`) that can be used to provide Code Banner with the cofiguratio it needs.

A configuration file evetually is expected to represent a configuration object with the following properties:

```json
{
  "explorer": { ... }, // Configuration for the explorer panel
  "scm": { ... }, // Configuration for the source control panel
  "debug": { ... }, // Configuration for the debug panel
  "explorer|scm": { ... }, // Share configuration for the explorer and source control panels
  "debug|scm|explorer": { ... }, // Share configuration for the debug, source control, and explorer panels
  "statusbar": { ... }, // Configuration for the statusbar
  "context": { ... }, // Configuration for the data context
  "templates": { ... }, // Configuration for the templates
}
```

If you're using a `plain file configuration` such as YAML or JSON you only need to structure the object properly.

If you're using an `executable configuration` (very limited support currently, as of `v0.3.0`) you can either `expors = { explorer: { ... }, statusbar: { ... }}` or alternatively you can supply a function to each of the section to generate the configuration, like so:

```js
exports.explorer = () => {
  return {
    rows: [
      {
        items: [
          {
            type: 'text',
            text: 'Hello, World!'
          }
        ]
      }
    ]
  }
}

exports.statusbar = () => {
  return {
    items: [
      {
        name: 'example',
        text: 'Hello, Status Bar!',
        priority: 20000,
        visible: true
      }
    ]
  }
}
```

> *Note*: Use executable configuration at your own risk! Currently (as of v0.3.0) Code Banner does not have any securities in place to verify the security or origin of the executable code!
> 
> To enable executable configuration files you have to explicitly set it in the settings (`codeBanner.allowExecutableConfiguration = true`)
> 
> ![Enable executables](https://raw.githubusercontent.com/elis/elis/main/random/code-banner/executables-setting.png)

## Banners

Banners are quite capable and support several different type of items you can utilize and very powerful contextual support so you can display the right info and tools in-context.

Below is an example of a banner in the Explorer view:

```yaml
explorer: 
  rows:
    - items:
      - type: text
        text: Text in explorer!

```

A slightly more involved example:

```yaml
explorer:
  rows:
    - glob: 
        - "**/.cb"
        - "**/*.js"
      items:
        - type: svg
          style: 
            flex: 0 0 30px
            padding: 4px
          elementStyle:
            borderRadius: 3px
            overflow: hidden
          svg: https://cdn.worldvectorlogo.com/logos/logo-javascript.svg
        - type: svg
          style: 
            flex: 0 0 30px
            padding: 4px
          elementStyle:
            borderRadius: 3px
            overflow: hidden
            transform: rotate(180deg)
          url: https://cdn.worldvectorlogo.com/logos/visual-studio-code-1.svg
        - type: markdown
          markdown: This will show only when `*.js` or `.cb` files have visible editors
```

### Panels

Currently Code Banner supports three different panel locations for your banner: Explorer view (`explorer`), Debug view (`debug`), and Source Control view (`scm`). These corrispond to the sidebar section the user can navigate to in VSCode.

If you want to display your banners anywhere in those views provide them as top level objects, like so:

```yaml
explorer:
  rows:
    ... # rows defined for the Explorer view
scm:
  rows:
    ... # rows defined for the Source Control view
debug:
  rows:
    ... # rows defined for the Debug view
```

Additionally there's experimental support for using shared configurations like so:

```yaml
explorer|scm:
  rows:
    ... # rows shared by Explorer and Source control views
```

#### Banner Rows

Each Banner row in your configuration will be displayed by Code Banner as an individual line with the items it contains displayed as columns one after the other - this is all cofigurable and your individual rows can accept custom style (CSS-like syntax) that will applied to it.

##### Options

- `items` : `array` `RowItem[]`

  An array of items to be displayed - see below on item types and configuration

  Example:
  ```yaml
  explorer:
    rows:
      - items:
        - type: text
          text: This is a text item!
        - type: markdown
          markdown: "*This* ~is~ a [markdown](https://google.com/?q=markdown) `item`!"
  ```
    
- `style` : `object` `React.CSSProperties`

  Object containing `camelCase` (not CSS standard `kebab-case`!) CSS properties to be applied to the row as a whole

  Example:
  ```yaml
  explorer:
    rows:
      - style:
          display: flex
          justifyContent: space-between
        items:
          - type: codicon
            codicon: rocket
          - type: codicon
            codicon: github
  ```

  > *Note*: Check out the full list of all available VSCode CSS variables here: [VSCode Webview CSS Variables](./docs/vscode-webview-css-variables.md)

- `classes` : `string` `string`

  A string of classes to be appended to the element container.

  Useful for working with CSS frameworks like [tailwind.css](https://tailwindcss.com/).

  > *Note*: `tailwind.css` has been added to Code Banner in version v0.3.8

  Example:
  ```yaml
  explorer:
    rows:
      - type: container
        items:
          - type: text
            classes: text-xs sm:text-xl text-green-800 sm:text-red-400 
            text: this text will be small and green on small panels, and large and red in large panels
  ```



- `glob` : `string | array` `string | string[]`

  Restricts the visibility of the row to the specified glob pattern(s)

  Example:
  ```yaml
  explorer:
    rows:
      - glob: "**/.eslintrc"
        condition: editor.isActive
        items:
          - type: svg
            url: https://cdn.worldvectorlogo.com/logos/eslint-1.svg
            elementStyle:
                width: 32px
          - type: text
            text: `.eslintrc` is visible
      - glob:
          - "**/.eslintrc"
          - "**/.prettierrc"
        items:
          - type: svg
            url: https://cdn.worldvectorlogo.com/logos/prettier-2.svg
            elementStyle:
                width: 32px
          - type: text
            text: This will be shown if the files `.eslintrc` or `prettierrc` are visible
  ```


- `priority` : `number`

  Higher priority rows will appear higher on the list

  Example:
  ```yaml
  explorer:
    rows:
      - priority: 10
        items:
          - type: text
            text: This will appear second
      - priority: 20
        items:
          - type: text
            text: This will appear first
  ```

- `sensitivity` : `number`

  Higher sensitivity rows will appear `n` levels down - e.g. a row located in a file in `src/depth-2/depth-3/.cb` with sensitivity of `2` will also appear for files in `src` and `src/depth-2` as well as the standard `src/depth-2/depth-3` that would be applied here.

  Example:
  ```yaml
  explorer:
    rows:
      - sensitivity: 3
        items:
          - type: text
            text: This will appear three level up!
      - priority: 1
        items:
          - type: text
            text: This will appear even at the parent dir level!
  ```

- `condition` : `string`

  Condition for the row to be displayed (paired with `glob` property).
  
  The only supported condition is `editor.isActive` which will display the row if the editor matching the glob option is active.

  Example:
  ```yaml
  explorer:
    rows:
      - condition: editor.isActive
        glob: "**/*.md"
        items:
          - type: text
            text: This will appear only when you're focused on a markdown file!
  ```


#### Row Item

Row items are simple objects containing at the very least a `type` property which dictate to Code Banner what and how to display.

##### Row Item Options

Common options that are shared between the various types of items available:

- `type` : `string` 
  
  Type of the item, supported types: `text`, `container`, `codicon`, `hr`, `image`, `svg`, `markdown`, and `span`
  
- `style` - `object` `React.CSSProperties`

  Object containing key-value pairs of CSS Properties as they are accepted by React - see: https://www.npmjs.com/package/csstype
  
- `hoverStyle` - `object` `React.CSSProperties`

  Same as style but will be applied on `onMouseEnter` and removed on `onMouseOut`, effectively providing with a hover effect
  
- `activeStyle` - `object` `React.CSSProperties`

  Same as style but will be applied on item as long as it's click action is being performed
  
- `click` - `string`

  An action to perform

  **Execute Command**: `click: command:vscode.openFolder:../some/other/path` - see: https://code.visualstudio.com/api/references/commands

  **Open External URL**: `click: open:https://google.com`


### Smart Text Replacements

Several type of row items support Smart Text replacements using the `$(...)` activation pattern.

Dependending on the content of the activation pattern Code Banner will replace the text with the result of the pattern provided.

Supported patterns:

#### `$(package[.path], default)`

Read the top-most workspace `package.json` file's data.

Example:

```yaml
explorer:
  rows:
    - items:
        - type: text
          text: "Package author: $(package.author.name, Not Provided)"
        - type: text
          text: "Package version: $(package.version)"
```


#### `$(path/to/some.json, object.path, default)`

Read data from a given JSON/YAML file path in the first argument, relative to the current configuration file, using the path given in the second argument, or return a default value provided in the third argument.

The path to traverse the data file (JSON/YAML) is using the [object-path](https://www.npmjs.com/package/object-path) notation.

Example:

```yaml
explorer:
  rows:
    - items:
        - type: text
          text: "Latest: $(some/data.json, path.to.object, Default Value)"
        - type: text
          text: "Greatest: $(another/data.yaml, alter.nativ, Not Found)"
```

> *Note*: By default the second argument, the object path, is used as a single value to the second argument of `objectPath.get` function.
> 
> To provide the `objectPath.get` function with an array value, you can provide the second argument with colons as seperators;
>
> e.g.: `$(another/data.yaml, a:b.c:d, Not Found)` which will match a value in: `{ a: { 'b.c': { d: 'some value' } } }`
>
> This way it is possible to access properties that have dot in their key
#### `$(codicon:icon-name, size, color)`

Will replace with a [Codicon](https://microsoft.github.io/vscode-codicons/dist/codicon.html).

Example:

```yaml
explorer:
  rows:
    - items:
        - type: text
          text: "Github Icon: $(codicon:github, 32, black)"
        - type: text
          text: "Is Everthing Alright: $(codicon:check-all, 26px, green)"
```

## Item Types

### `text`

A simple text block to write anything useful.

> *Note*: Some item types support Smart Text and will replace $(codicon:github) with the github icon, see more in the Smart Text section
  String - supports Smart Text replacements
Example:

```yaml
explorer:
  rows:
    - items:
        - type: text
          text: This is my custom text!
          style:
            fontSize: 24px
            color: blue
        - type: text
          text: Current version: $(package.version)
          style:
            fontSize: 24px
            color: blue
```

Options:
- `text` : `string` 

  The text to display - use `$(...)` (AKA Smart Text) to 

### `container`

A simple `div` container that can have any number and type of additional items, and with some clever styling can be used to acheive sofisticated layouts.

Example:
```yaml
explorer:
  rows:
    - items:
        - type: container
          style:
            display: flex
            flexDirection: row
            padding: 3px
            columnGap: 3px
          items:
            - type: svg
              elementStyle:
                width: 32
              url: https://cdn.worldvectorlogo.com/logos/bitcoin.svg
            - type: container
              style:
                display: flex
                flexDirection: column
                rowGap: 3px
              items:
                - type: text
                  text: Line One
                - type: text
                  text: Line Two
```

Options:
- `items` : `array` `RowItem[]` 

  A list of items to display 


### `image`, `svg`

Display an image or an SVG file

Example:
```yaml
explorer:
  rows:
    - items:
        - type: image
          elementStyle:
            width: 56px
          url: https://picsum.photos/56
        - type: svg
          elementStyle:
            width: 56px
          path: local/file.svg
```

Options:
- `url` : `string` 

  URL of the file to load 

- `path` : `string` 

  Path of the file to load 

- `elementClasses` : `string` 

  Class names to apply to the image element


### `markdown`

Render markdown content (using the excellent [React Markdown](https://github.com/remarkjs/react-markdown)).

Example:
```yaml
explorer:
  rows:
    - items:
        - type: markdown
          markdown: *The* _Revolution_ Will Be **Typed**
```

Options:
- `markdown` : `string` 

  Valid markdown syntax



### `hr`

Simple Horizontal Rule (`<hr />`)

Example:
```yaml
explorer:
  rows:
    - items:
        - type: image
          elementStyle:
            width: 56px
          url: https://picsum.photos/56
        - type: hr
          vertical: true
        - type: svg
          elementStyle:
            width: 56px
          path: local/file.svg
```

Options:
- `vertical` : `bool` 


### `span`

Simple span (`<span />`) used to span the entire available space

Example:
```yaml
explorer:
  rows:
    - items:
        - type: image
          elementStyle:
            width: 56px
          url: https://picsum.photos/56
        - type: span
        - type: svg
          elementStyle:
            width: 56px
          path: local/file.svg
```

Options:
- `vertical` : `bool` 


## Status Bar

Code Banner can be used to provide advanced visual indicators and custom action in the status bar.

A common usecase can be for a VSCode extension developer to need to reload either the window or the webviews at a single click, and with Code Banner it's just a few lines in any existing project.

Example:

```yaml
statusbar:
  items:
    - name: reload window
      options:
        text: "[R] Window"
        visible: true
        priority: 20002
        command: "workbench.action.reloadWindow"
    - name: reload webviews
      depth: 4
      options:
        text: "[R] Webviews"
        visible: true
        priority: 20000
        command: "workbench.action.webview.reloadWebviewAction"
```

### Status Bar Items

Status bar items work pretty much like the banner row item do with some exceptions.

Status items require a unique name.

Status Bar Item Properties:

- `name` : `string`

  Unique name of the status bar item

- `depth` : `number`

  Limit the status bar item to the `n`th depth relative to the configuration file

- `options` : `object` `StatusBarItemOptions`

  An object containing a list of options passed on to the tooltip service or used to style the tooltip. See [Status Bar Item Options](#status-bar-item-options) below


#### Status Bar Item Options

- `text` : `string`

  The text to show for the entry. You can embed icons in the text by leveraging the syntax:

  My text $(icon-name) contains icons like $(icon-name) this one.

  Where the icon-name is taken from the ThemeIcon [icon set](https://code.visualstudio.com/api/references/icons-in-labels#icon-listing), e.g. light-bulb, thumbsup, zap etc.

- `alignment`: `string` `vscode.StatusBarAlignment`

  Options: `left`, `right`
  
  Default: `left`

  Align item to left/right side of the sidebar

- `priority` : `number`

  The priority of this item. Higher value means the item should be shown more to the left (for left align elements, or more to the right for right aligned elements).

- `visible` : `boolean`

  Default: `false`

  Set the visibility of the item

- `color` : `string`

  Foreground (text) color for the item

- `backgroundColor` : `string`

  The background color for this entry.

  > Note: only the following colors are supported:

  > `statusBarItem.errorBackground`

  > `statusBarItem.warningBackground`

  More background colors may be supported in the future.

  Note: when a background color is set, the statusbar may override the `color` choice to ensure the entry is readable in all themes.

- `command` : `string`

  [`Command`](https://code.visualstudio.com/api/references/vscode-api#Command) or identifier of a command to run on click.

- `name` : `string`

  The name of the entry, like 'Python Language Indicator', 'Git Status' etc. Try to keep the length of the name short, yet descriptive enough that users can understand what the status bar item is about.

  > *Note*: This property is not the same as the name property of StatusBarItem

- `tooltip` : `string` `MarkdownString`

  The tooltip text when you hover over this entry.

- `id` : `string`

  The identifier of this item.

## Context

Providing a context to the configuration file allows to use variables in the configuration file, load data from json/yaml files, and more.

Example:

```yaml

context:
  some:
    data:
      value: "Hello, World!"

explorer:
  rows:
    - items:
        - type: text
          text: ${some.data.value}

```

Notice the similar syntax to the `Smart Tags` mentioned earlier - these two features work very differently and are not related even if some of the functionality is similar.

Accessing context data is done using the `${}` syntax, similar to Javascript template literals.

Data loaded in context section is available to all other sections, and can be overridden in any other sections' `context` property. Thing includes any templates and their properties.

### Context Capabilities

Context values can be transformed into other values using the various directives available.

Directives are invoked by providing a string in the following format: `directiveName:directiveArgument|directiveArgument|...`

Available directives:

  - [JSON/YAML](/#JSON/YAML)
  - [Text File](/#TextFile)
  - [Files](/#Files)
  - [ENV Variables](/#Env)
  - [ENV File](/#EnvFiles)
  - [Include Config](/#Include)
  - [Each](/#Each)
  - [Context](/#Context)
  - [String Interpolation](/#StringInterpolation)

#### JSON/YAML

Read JSON/YAML data from a workspace file and load it or parts of it into the context.
##### Directive
  
  - `json:path|key?|default?`
  
  - `yaml:path|key?|default?`

##### Arguments

- `path` : `string`

  Relative path to the json/yaml file

- `key` : `string` - optional
  
    Key to access in the json/yaml file object (dot notation) - see object-path link: https://www.npmjs.com/package/object-path

    If key is provided with commas (`,`) it will be split and the value will be used as a cloascing request to `object-path`.

    If key is not provided, the entire file will be loaded.


- `default` : `string` - optional
  
    Default value to use if the key is not found in the json/yaml file or the fail failed to load.

#### Text File

Read a text file or parts of it from the workspace and load it into the context.

Load plain-text file content. If `line` is provided, only that line will be loaded. If `lineEnd` is provided, all lines from `line` to `lineEnd` will be loaded.
##### Directive
  
`file:path|line?|lineEnd?|default?`

##### Arguments

- `path` : `string`

  Relative path to the file

- `line` : `number` - optional
  
    Line number to read from the file.

- `lineEnd` : `number` - optional
    
      Line number to read to from the file.

- `default` : `string` - optional
    
      Default value to use file doesn't exist or failed to load.


Example:
  
```yaml
context:
  readmeTitle: file:README.md|1
  readmeContent: file:README.md|2|5
```

#### Files

Read a list of files/folders from the workspace and load it into the context.
##### Directive
  
`files:path|pattern?|default?`

##### Arguments

- `path` : `string`

  Relative path to the file

- `pattern` : `string`
  
    Glob pattern to match files in the directory.

- `default` : `string` - optional
    
      Default value to use if the directory doesn't exist or there aren't any files.

##### Result

The result is an array of objects with the following properties:

```json
[
  [name, vscode.FileType], ...
]
```

Example:
  
```yaml
context:
  packages: files:packages|** # Loads all folders in the packages directory

template:
  packageItem:
    type: text
    text: "Package: packages/${name}"

explorer:
  rows:
    - items:
        - each:packages:packageItem|expand
```

#### Environment Variables

Directive:

  - `env:variableName|default?`

Arguments:

- `variableName` : `string`

  Name of the environment variable to load.

- `default` : `string` - optional
  
    Default value to use if the environment variable is not found



Context can be used to load data from JSON or YAML files, partially or in full.

Example:

```yaml
context:
  data: json:data.json
  data-with-specific-path: json:package.json|name
  data-with-specific-path-and-default: json:package.json|name|not-found
```


#### Environment Files

Load environment variables from a file.
##### Directive

  - `env-file:path|name?|default?`

##### Arguments

- `path` : `string`

  Relative path to the file

- `name` : `string` - optional
  
    Name of the environment variable to load. If not provided the entire env file is loaded as an object.

- `default` : `string` - optional
    
      Default value to use if the environment variable is not found or file fails to load.
  
##### Example

```yaml
context:
  env: env-file:.env
  env-with-specific-path: env-file:.env|SOME_VAR
  env-with-specific-path-and-default: env-file:.env|SOME_VAR|not-found
```


#### Include

Include another configuration file. 

##### Directive

  - `include:path|key?`

##### Arguments

- `path` : `string`

  Relative path to the file


- `key` : `string` - optional
  
    Key to access in the included file object (dot notation) - see object-path link: https://www.npmjs.com/package/object-path

    If key is provided with commas (`,`) it will be split and the value will be used as a cloascing request to `object-path`.

    If key is not provided, the entire file will be loaded.

##### Example

```yaml
context:
  data: include:other-config.cb
  data-with-specific-path: include:other-config.cb|some.data.value
```



#### Each

Iterate over an array or object keys and map their values to a template.

##### Directive

  - `each:arrayOrObject:template|expand?`

##### Arguments

- `arrayOrObject` : `string`

  Name of the array or object to iterate over from the context.

- `template` : `string`
  
    Template to use for each item.

- `expand` : `boolean` - optional

    If true, the template will be expanded before being used. This is useful if you want to include the results as part of another array of rows/items.

##### Example

```yaml
context:
  packages: files:packages|**

template:
  packageItem:
    type: text
    text: "Package: ${name}"

explorer:
  rows:
    - items:
        - each:packages:packageItem|expand
```

#### Context

Load a value from the context.

##### Directive

  - `context:key|default?`

##### Arguments

- `key` : `string`

  Key to access in the context object (dot notation) - see object-path link: https://www.npmjs.com/package/object-path

  If key is provided with commas (`,`) it will be split and the value will be used as a cloascing request to `object-path`.

- `default` : `string` - optional
  
    Default value to use if the key is not found in the context.

##### Example
  
  ```yaml
  context:
    myJson: json:data.json
    fromContext: context:myJson.some.data.value
  ```

#### String Interpolation

Interpolate a string with values from the context.

Use `${key}` inside any string to access the value of any context key. If the key is not found, the string will be returned as is.

##### Directive

  - `${key[,alt.key?]|default?}`

##### Arguments

- `key` : `string`

  Key to access in the context object (dot notation) - see object-path link: https://www.npmjs.com/package/object-path

  If key is provided with commas (`,`) it will be split and the value will be used as a cloascing request to `object-path`.

- `default` : `string` - optional
  
    Default value to use if the key is not found in the context.

##### Example

```yaml
context:
  data: json:data.json
  env: env-file:.env
  env-with-specific-path: env-file:.env|SOME_VAR
  env-with-specific-path-and-default: env-file:.env|SOME_VAR|not-found
  packages: files:packages|**
  fromContext: context:myJson.${data.some.value}.value

templates:
  packageItem:
    context:
      name: value.0
    type: text
    text: "Package: ${name}"

explorer:
  rows:
    - items:
      - type: text
        text: "Context: ${context:data.some.data.value}"
      - type: text
        text: "Env: ${env:SOME_VAR}"

      - type: text
        text: "Packages:"
        
      - type: container
        style:
          display: flex
          flex-direciton: column
        items: each:packages:packagesItem
```

### Templates

Templates are used to define the structure of a repeating item. They can be used anywhere in the data except for the `context` section.

Templates can be defined at the top level and at the top level of any `explorer`, `scm`, and other sections.

Templates can be defined as a string or an object. If defined as a string, it will be used as the `text` property of a `text` type template.

Each Template can have it's own context and local context can refer to the parent context.

#### Examples

```yaml
context:
  names:
    - Adam
    - Bob
    - Charlie

# Top level template
template:
  topTemplate:
    type: text
    text: "Hello, ${item}"

# Template in explorer
explorer:
  template:
    myTemplate:
      context:
        item: value.0
      ...: template:topTemplate

  rows:
    - items: each:names:topTemplate
    - items: each:names:myTemplate

```

### Expantion Tags

In certain cases you'd want to expand the results of a template into the parent array/object.

To do so there are two ways depending on the type of the parent.

#### Array

To expand the results of a template into an array, use the `expand` tag in combination with the `each` directive.

```yaml
context:
  names:
    - Adam
    - Bob
    - Charlie

templates:
	topTemplate:
		context:
			name: context:value
		type: text
		text: "My name is: ${name}"

explorer:
  rows:
    - items:
      - each:names:topTemplate|expand
```


#### Object

To expand the results of a template into an object, use the `...` key in any object in combination with a `template` directive.

```yaml
context:
  colors:
    - blue
    - green
    - red

templates:
  colorItem:
    style:
      color: ${color}
    type: text
    text: "Color: ${color}"

  colorRowItem:
    context:
      color: context:value
    ...: template:colorItem
explorer:
  rows:
    - items: each:colors|colorRowItem
```

### Responsive Layout

Rows and items can be conditionally shown based on the viewporrt size.

You can declare a custom `reposponive` object anywhere in your config and use it in the `if-responsive` property of any `row` or `item`.

```yaml

# Define a custom responsive object
responsive:
  small:
    max-width: 280
  medium:
    min-width: 280
    max-width: 600
  large:
    min-width: 600

explorer:
  rows:
    - items:
      - type: text
        text: This will be shown on all viewports
      - type: text
        text: This will be shown on large viewports
        if-responsive: large
      - type: text
        text: This will be shown small viewports
        if-responsive: small
      - type: text
        text: This will be shown on medium and large viewports
        if-responsive: medium,large
```

`responsive` object can be provided anywhere throughout your config - for example in rows and items - to override and define a custom responsive object.

Multiple values can be provide to the `if-responsive` property to match multiple viewports. The values can be comma separated or an array.

### Conditional Rendering

Rows and items can be conditionally shown based on the value of a context key.

You can use the `if-context` property of any `row` or `item` to conditionally show it based on the value of a context key - if the value is truthy the element will show, if the value is falsy the element will not be rendered.

```yaml

context:
  show: 
    first: truthy
    third: truthy


explorer:
  rows:
    - items:
      - type: text
        text: This will be shown
        if-context: show.first
      - type: text
        text: This will not be shown
        if-context: show.second
      - type: text
        text: This will be shown
        if-context: show.second,show.third

```

Multiple values can be provide to the `if-context` property to match multiple values. The values can be comma separated or an array.



# Development Roadmap

- [x] Nested Configuration `v0.0.1`
- [x] Local Image Support `v0.2.0`
- [x] Multiple Banner Rows per config `v0.3.0`
- [x] Status Bar Items and Actions `v0.2.0`
- [ ] Banner Items
  - [x] Container `v0.2.0`
  - [x] Image `v0.2.0`
  - [x] SVG `v0.2.0`
  - [x] Text `v0.0.1`
  - [x] [Codicons](https://microsoft.github.io/vscode-codicons/dist/codicon.html) `v0.2.4`
  - [x] HR `v0.2.0`
  - [x] Markdown `v0.2.0`
  - [x] Span `v0.2.0`
  - [ ] More to come...
- [x] Smart Text `v0.2.0`
- [x] Context Aware `v0.2.2`
- [x] Custom Styling `v0.0.1`
- [x] Conditional Banners
  - [x] Active Editor `v0.3.0`
  - [x] Visible Editors `v0.3.0`
  - [x] Glob Pattern `v0.3.0`
  - [x] Existing/Missing Files/Directories `v0.4.0`
  - [x] Responsive `v0.4.0`
  - [x] Context `v0.4.0`

- [x] Types `v0.0.1`
- [x] Error Handling
  - [x] Parsing Configuration `v0.3.3`
  - [x] Rows and Items `v0.3.0`
- [ ] Welcome Mode
- [ ] Tests
- [x] Trusted Workspace Support `v0.3.3`
- [ ] Custom Javascript Actions
- [ ] Plugins
- [x] Shared Styles `v0.4.0`
- [x] Componentize
- [ ] React Component Support
- [ ] Configuration Assistant
- [ ] Live-reload as-you-type for banners

# CHANGELOG

To stay up-to-date on extension capabilities and APIs read the [CHANGELOG.md](https://github.com/elis/code-banner/blob/master/CHANGELOG.md) file.

# History

This project is the spiritual successor of [Project Banner](https://github.com/elis/project-banner) - I wanted this for the longest while, and I've needed it even longer.

# License

MIT License - See: [LICENCE.mds](./LICENSE.mds)