import Link from 'next/link'
import fetch from 'isomorphic-unfetch'
import { connect } from 'react-redux';

const layoutStyle = {
    display: 'block',
    height: '100%',
    width: '100%'
}

class Dashboard extends React.Component {

    constructor(props) {
        super(props);
    }

    async componentDidMount() {

    }

    render() {
        return (
          <div style={layoutStyle}>
          Volumes
          </div>
        )
    }
}

export default Dashboard
