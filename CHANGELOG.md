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

## v0.3.8 - 2021-11-14

### Added

-   Add tailwind.css
-   Add support for item `classes`
-   Added `CHANGELOG.md`

    Added  `CHANGELOG.md`  to track extension version changes.

    `CHANGELOG.md`  is generated using  [eplog](https://npmjs.com/package/eplog)  utility that reads version data from this notion notebook and database:  [https://sklar.notion.site/Code-Banner-Changelog-2e10cc49a57d4ad89fc191d3514f2b2a](https://sklar.notion.site/Code-Banner-Changelog-2e10cc49a57d4ad89fc191d3514f2b2a)

    




## v0.3.7 - 2021-11-11

### Fixed

-   Fix banner rows order display


## v0.3.5 - 2021-11-11

### Fixed

-   Fix  `Slightly more involved example`


## v0.3.4 - 2021-11-11

### Fixed

-   Fix executables error handling


## v0.3.3 - 2021-11-11

### Added

-   Added README.md

### Fixed

-   Fix conflicting status bar items names


## v0.3.2 - 2021-11-10

### Fixed

-   Fix access to undefined variable


## v0.3.1 - 2021-11-09

### Added

-   Added support for multiple rows per config


## v0.3.0 - 2021-11-09

### Housekeeping

-   Rewrite extension structure


## v0.2.3 - 2021-11-08

### Added

-   Added support for Smart Text

    Some text properties can now use  `Smart Text`  to replace parts of a text string with custom data; for example we can now read package.json values by using  `$(package.version)`  in a text property which will be replace with the actual version specified in  `package.json`




## v0.2.2 - 2021-11-07

### Fixed

-   Better panel elements handling


## v0.2.1 - 2021-11-07

### Fixed

-   Fix config not loading 


## v0.2.0 - 2021-11-07

-   Remove `proposedApis`


## v0.1.0 - 2021-11-07

Code Banner First Stable Version! 🥳🪅



### Added

-   Added Status Bar Items
-   Added Explorer Panel
-   Added Support for Local Images

    Local images can be loaded by simply providing a  `path`  property



