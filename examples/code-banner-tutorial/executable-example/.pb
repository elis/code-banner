const fname = '.pb'

exports.explorer = () => {
  return {
    rows: [
      {
        items: [
          {
            type: 'text',
            text: '🍑 Hello, World! Executable!',
          },
        ],
      },
    ],
  }
}

exports.statusbar = () => {
  return {
    items: [
      // {
      //   name: 'example',
      //   options: {
      //     text: Date.now().toString(32) + ' Hello, Status Bar!',
      //     priority: 25000,
      //     visible: true,
      //   },
      // },
    ],
  }
}
