import React from 'react'
import YAML from 'yaml'
import ErrorItem from '../banner/items/error'
class BannerItemErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    // logErrorToMyService(error, errorInfo)
    console.log('Error with item:', { error, errorInfo })
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevState.hasError !== this.state.hasError) {
      this.setState({ hasError: false, error: null })
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <>ERROR</>
      // return <ErrorItem error={this.state.error} item={this.props.item} />
    }

    return this.props.children
  }
}

export default BannerItemErrorBoundary
