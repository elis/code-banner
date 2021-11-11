# Code Banner

VSCode extension to add identifiable and useful information and actions to VSCode sidebare panels and status bar:

![Example of [Code Banner](https://github.com/elis/code-banner)'s banner](https://raw.githubusercontent.com/elis/elis/main/random/code-banner/example-1.png)

Instantly add the information you need to have it available at a galnce exactly when needed!

## Features

* 👨‍🎤 Highly customizable
* 🎢 Custom actions and shortcuts
* 🗺 Nested configuration
* 🪄 Markdown, plain text, and smart tags
* ⏱ Fast and responsive
* ⌗ Read and display data from `package.json` or any yaml/json file

## Usage

After installation the extension you will have a new panel in your explorer, debug, and scm views named `CODE BANNER`.

This panel's content is entirely controlled by the content of your workspace, allowing you to display information such as text, images, json data, or any combination of those and preferform custom actions all defined in `.cb` or `.pb` files in your workspaces.

## Tutorial

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
  "statusbar": { ... } // Configuration for the statusbar
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
- [ ] Conditional Banners
  - [x] Active Editor `v0.3.0`
  - [x] Visible Editors `v0.3.0`
  - [x] Glob Pattern `v0.3.0`
  - [ ] Existing/Missing Files/Directories
- [x] Types `v0.0.1`
- [x] Error Handling
  - [x] Parsing Configuration `v0.3.3`
  - [x] Rows and Items `v0.3.0`
- [ ] Welcome Mode
- [ ] Tests
- [x] Trusted Workspace Support `v0.3.3`
- [ ] Custom Javascript Actions
- [ ] Plugins
- [ ] Shared Styles
- [ ] Componentize
- [ ] React Component Support
- [ ] Configuration Assistant
- [ ] Live-reload as-you-type for banners

# History

This project is the spiritual successor of [Project Banner](https://github.com/elis/project-banner) - I wanted this for the longest while, and I've needed it even longer.

# License

MIT License - See: [LICENCE.mds](./LICENSE.mds)