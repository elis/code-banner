import * as React from 'react'
import * as Server from 'react-dom/server'
import { render } from 'react-dom'
import CommService from './services/comms.services'
import ConfigService from './services/config.service'
import BannersService from './services/banners.service'

import Panel from './panel'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'shards-ui/dist/css/shards.min.css'

const App = () => {
  return (
    <CommService>
      <ConfigService>
        <BannersService>
          <Panel />
        </BannersService>
      </ConfigService>
    </CommService>
  )
}

render(<App />, document.getElementById('root'))
