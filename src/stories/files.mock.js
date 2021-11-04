export const mock = {
	state: {
		files: [
			{
				conf: {
					explorer: {
						items: [
							{
								type: 'text',
								text: 'abc',
							},
						],
					},
				},
				uri: {
					$mid: 1,
					fsPath: '/Users/eli/projects/djit/djit/.pb',
					external: 'file:///Users/eli/projects/djit/djit/.pb',
					path: '/Users/eli/projects/djit/djit/.pb',
					scheme: 'file',
				},
				relative: '.pb',
				level: 1,
			},
			{
				conf: {
					explorer: {
						items: [
							{
								type: 'text',
								text: 'Hello, World!',
							},
							{
								type: 'text',
								text: 'Another!',
							},
						],
					},
				},
				uri: {
					$mid: 1,
					fsPath: '/Users/eli/projects/djit/djit/src/.pb',
					external: 'file:///Users/eli/projects/djit/djit/src/.pb',
					path: '/Users/eli/projects/djit/djit/src/.pb',
					scheme: 'file',
				},
				relative: 'src/.pb',
				level: 2,
			},
		],
	},
	actions: {},
}