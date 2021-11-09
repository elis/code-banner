import React from 'react'
import YAML from 'yaml'

const ErrorItem = ({ error, item, title }) => {
  return (
    <div className="error">
      <i
        class="codicon codicon-info help"
        title={`${
          error?.message ? `Error: ${error?.message}\n\n` : ``
        }${YAML.stringify(item)}`}
        onClick={() => {
          console.group('Item error details')
          console.log('Error:', error)
          console.log('Item:', item)
          console.groupEnd()
        }}
      ></i>
      <div className="details">
        <h4>{title || <>Banner Item failed to load</>}</h4>
        {error?.code ? (
          <p>
            Error code: <code>{error.code}</code>
          </p>
        ) : null}
        {error?.name ? (
          <p>
            Error name: <code>{error.name}</code>
          </p>
        ) : null}
        <p>
          Type: <code>{item.type}</code>
        </p>
      </div>
      {/* <code>Error: {this.state.error?.message} {JSON.stringify(this.state.error, 1, 1)}</code> */}
    </div>
  )
}

export default ErrorItem
