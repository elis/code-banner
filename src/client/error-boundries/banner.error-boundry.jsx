import React from 'react'

class BannerErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    // logErrorToMyService(error, errorInfo)
    console.log('Error with banner:', { error, errorInfo })
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevState.hasError) this.setState({ hasError: false, error: null })
  }
  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="error">
          <h4>Banner failed to load</h4>
        </div>
      )
    }

    return this.props.children
  }
}

export default BannerErrorBoundary
