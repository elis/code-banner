import fs from 'fs'

export const explorer = () => {
  const files = fs.readdirSync(__dirname)

  return {
    rows: [
      {
        priority: 101010,
        items: [
          {
            type: 'container',
            style: {
              display: 'flex',
              flexDirection: 'column',
            },
            items: files.map((file) => ({
              type: 'text',
              text: `File: ${file}`,
            })),
          },
        ],
      },
    ],
  }
}
