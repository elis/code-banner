/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const { sassPlugin } = require('esbuild-sass-plugin')
const esbuild = require('esbuild')

// console.log('process.argv', process.argv)

esbuild
  .build({
    // sourceRoot: 'src/client/*',
    entryPoints: ['src/client/code-banner.jsx'],
    outdir: './out/client',
    bundle: true,
    sourcemap: true,
    plugins: [sassPlugin({})],
    ...(process.argv.find((e) => e === '--watch')
      ? {
          watch: {
            onRebuild(error, result) {
              if (error) console.error('watch build failed:', error)
              else console.log('watch build succeeded:', result)
            },
          },
        }
      : {}),
  })
  .then((result) => {
    console.log('result of build:', result)
  })
	.catch(() => process.exit(1))
