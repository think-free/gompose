import Link from 'next/link'
import fetch from 'isomorphic-unfetch'
import { connect } from 'react-redux';
import Base from './base.js'
import Menu from './menu.js'
import MainArea from './mainarea.js'

class Logged extends React.Component {

    constructor(props) {
        super(props);
    }

    async componentDidMount() {

    }

    render() {

        return (
          <Base>
              <Menu />
              <MainArea />
          </Base>
        )
    }
}

Logged = connect()(Logged)

export default connect()(Logged)
