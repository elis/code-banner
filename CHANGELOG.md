# Release history

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

<details>
  <summary><strong>Guiding Principles</strong></summary>

- Changelogs are for humans, not machines.
- There should be an entry for every single version.
- The same types of changes should be grouped.
- Versions and sections should be linkable.
- The latest version comes first.
- The release date of each versions is displayed.
- Mention whether you follow Semantic Versioning.

</details>

<details>
  <summary><strong>Types of changes</strong></summary>

Changelog entries are classified using the following labels _(from [keep-a-changelog](http://keepachangelog.com/)_):

- `Added` for new features.
- `Changed` for changes in existing functionality.
- `Deprecated` for soon-to-be removed features.
- `Removed` for now removed features.
- `Fixed` for any bug fixes.
- `Security` in case of vulnerabilities.

</details>

# v0.4.2 - 2022-09-16

### Fix array values not enriched with context


# v0.4.1 - 2022-09-16

## Added

### Added `__dirname` to context

You can now refer to `context:__dirname` or `${__dirname}` anywhere in your config to receive the relative file path - makes it easier to handle assets in included configs.




# v0.4.0 - 2022-09-14

## Added

### Added templates and templating

You can now use templates inside code banner configs to reuse throughout the config.



There are two ways to create templates in your configs: top-level templates, and row-level templates, both function the same way, and can inherit from top to bottom and reference templates inside other templates.



Example:

```yaml
templates:
	colorfulItem:
		type: container
		style:
			display: flex
			flex-direction: row
			row-gap: 1em
		items:
			- type: text
				text: This is a
			- type: text
				style:
					color: ${color}
				text: bright ${color}
			- type: text
				text: item!

explorer:
	rows:
		- context:
				color: red
			items:
				- template:colorfulItem
		- context:
				color: blue
			items:
				- template:colorfulItem
```



The above config will be expanded to the following:

```yaml
explorer:
	rows:
		- items:
			- type: container
				style:
					display: flex
					flex-direction: row
					row-gap: 1em
				items:
					- type: text
						text: This is a
					- type: text
						style:
							color: red
						text: bright red
					- type: text
						text: item!
					
			- type: container
				style:
					display: flex
					flex-direction: row
					row-gap: 1em
				items:
					- type: text
						text: This is a
					- type: text
						style:
							color: blue
						text: bright blue
					- type: text
						text: item!
					
```



#### Expansion

In certain cases you'd want to expand the results of a template into the parent array/object.

To do so there are two ways depending on the type of the parent.

###### Array Expansion

To expand the results of a template into an array, use the `expand` tag in combination with the `each` directive.



Example:

```yaml
context:
  names:
    - Adam
    - Bob
    - Charlie

templates:
	topTemplate:
		context:
			name: context:name,value
		type: text
		text: "My name is: ${name}"

explorer:
  rows:
    - items:
			- context:
					name: Eli
				type: text
				text: "My name is: ${name}"
      - each:names:topTemplate|expand
```



will result in:

```yaml
explorer:
  rows:
    - items:
      - type: text
				text: "My name is: Eli"
      - type: text
				text: "My name is: Adam"
      - type: text
				text: "My name is: Bob"
      - type: text
				text: "My name is: Charlie"

```



###### Object

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
    - items: 
			- context:
					value: context:colors[0]
				...: template:colorRowItem
			- context:
					value: context:colors[1]
				...: template:colorRowItem

```



Will result in:

```yaml
explorer:
  rows:
    - items: 
	    - style:
		      color: blue
		    type: text
		    text: "Color: blue"
	    - style:
		      color: green
		    type: text
		    text: "Color: green"
```


### Added custom data context

A context can be provided to your top-level config or almost anywhere in your config - including templates, and row and item configurations.



Context is provided by the `context` key in your config or any object in your config.



Context comes with a very simple and powerful way to load and manipulate data in the workspace code banner display.



Context values can be transformed into other values using the various directives available.

Directives are invoked by providing a string in the following format: `directiveName:directiveArgument|directiveArgument|...`

Available directives:

- [JSON/YAML](https://www.notion.so/#JSON/YAML)

- [Text File](https://www.notion.so/#TextFile)

- [Files](https://www.notion.so/#Files)

- [ENV Variables](https://www.notion.so/#Env)

- [ENV File](https://www.notion.so/#EnvFiles)

- [Include Config](https://www.notion.so/#Include)

- [Each](https://www.notion.so/#Each)

- [Context](https://www.notion.so/#Context)

- [String Interpolation](https://www.notion.so/#StringInterpolation)



#### JSON/YAML

Read JSON/YAML data from a workspace file and load it or parts of it into the context.

###### Directive

- `json:path|key?|default?`

- `yaml:path|key?|default?`

###### Arguments

- `path` : `string`

- `key` : `string` - optional

- `default` : `string` - optional

#### Text File

Read a text file or parts of it from the workspace and load it into the context.

Load plain-text file content. If `line` is provided, only that line will be loaded. If `lineEnd` is provided, all lines from `line` to `lineEnd` will be loaded.

###### Directive

`file:path|line?|lineEnd?|default?`

###### Arguments

- `path` : `string`

- `line` : `number` - optional

- `lineEnd` : `number` - optional

- `default` : `string` - optional

Example:

```yaml
context:
  readmeTitle: file:README.md|1
  readmeContent: file:README.md|2|5

```

#### Files

Read a list of files/folders from the workspace and load it into the context.

###### Directive

`files:path|pattern?|default?`

###### Arguments

- `path` : `string`

- `pattern` : `string`

- `default` : `string` - optional

###### Result

The result is an array of objects with the following properties:

```javascript
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

Load environment variables into the context.

Note: These are VSCode environment variables - not your project's environment variables.

Directive:

- `env:variableName|default?`

Arguments:

- `variableName` : `string`

- `default` : `string` - optional

Context can be used to load data from JSON or YAML files, partially or in full.

Example:

```yaml
context:
  user: env:USER
  home: env:HOME
  defaultUser: env:DEFAULT_USER|defaultUser

```

#### Environment Files

Load environment variables from a file.

###### Directive

- `env-file:path|name?|default?`

###### Arguments

- `path` : `string`

- `name` : `string` - optional

- `default` : `string` - optional

###### Example

```yaml
context:
  env: env-file:.env
  env-with-specific-path: env-file:.env|SOME_VAR
  env-with-specific-path-and-default: env-file:.env|SOME_VAR|not-found

```

#### Include

Include another configuration file.

###### Directive

- `include:path|key?`

###### Arguments

- `path` : `string`

- `key` : `string` - optional

###### Example

```yaml
context:
  data: include:other-config.cb
  data-with-specific-path: include:other-config.cb|some.data.value

```

#### Each

Iterate over an array or object keys and map their values to a template.

###### Directive

- `each:arrayOrObject:template|expand?`

###### Arguments

- `arrayOrObject` : `string`

- `template` : `string`

- `expand` : `boolean` - optional

###### Example

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

###### Directive

- `context:key|default?`

###### Arguments

- `key` : `string`

- `default` : `string` - optional


### Added responsive layouts

Rows and items can be conditionally shown based on the viewport size.

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


### Added refresh configuration

You can refresh the data in the configuration by providing an `option.refresh` property at the top-level of your configuration file.

The `refresh` property accepts a number in milliseconds or a string in the format of `1m 30s` (1 minute and 30 seconds). Supported values are `d` for days, `h` for hours, `m` for minutes, `s` for seconds, and `ms` for milliseconds.

Example:

```yaml
options:
  refresh: 1m 30s
```




### Added conditional rendering

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





## Fixed

### Fix markdown not rendering styles


# v0.3.8 - 2021-11-14

## Added

### Add tailwind.css
### Add support for item `classes`
### Added `CHANGELOG.md`

Added `CHANGELOG.md` to track extension version changes.

`CHANGELOG.md` is generated using [eplog](https://npmjs.com/package/eplog) utility that reads version data from this notion notebook and database: [https://sklar.notion.site/Code-Banner-Changelog-2e10cc49a57d4ad89fc191d3514f2b2a](https://sklar.notion.site/Code-Banner-Changelog-2e10cc49a57d4ad89fc191d3514f2b2a)






# v0.3.7 - 2021-11-11

## Fixed

### Fix banner rows order display


# v0.3.5 - 2021-11-11

## Fixed

### Fix  `Slightly more involved example`


# v0.3.4 - 2021-11-11

## Fixed

### Fix executables error handling


# v0.3.3 - 2021-11-11

## Added

### Added README.md

## Fixed

### Fix conflicting status bar items names


# v0.3.2 - 2021-11-10

## Fixed

### Fix access to undefined variable


# v0.3.1 - 2021-11-09

## Added

### Added support for multiple rows per config


# v0.3.0 - 2021-11-09

## Housekeeping

### Rewrite extension structure


# v0.2.3 - 2021-11-08

## Added

### Added support for Smart Text

Some text properties can now use `Smart Text` to replace parts of a text string with custom data; for example we can now read package.json values by using `$(package.version)` in a text property which will be replace with the actual version specified in `package.json`




# v0.2.2 - 2021-11-07

## Fixed

### Better panel elements handling


# v0.2.1 - 2021-11-07

## Fixed

### Fix config not loading 


# v0.2.0 - 2021-11-07

### Remove `proposedApis`


# v0.1.0 - 2021-11-07

Code Banner First Stable Version! 🥳🪅



## Added

### Added Status Bar Items
### Added Explorer Panel
### Added Support for Local Images

Local images can be loaded by simply providing a `path` property



