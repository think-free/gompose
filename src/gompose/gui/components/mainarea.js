import Link from 'next/link'
import fetch from 'isomorphic-unfetch'
import { connect } from 'react-redux';

import Dashboard from './areas/dashboard.js'
import Projects from './areas/projects.js'
import Containers from './areas/containers.js'
import Volumes from './areas/volumes.js'
import Images from './areas/images.js'

var componentList = {
    Dashboard: Dashboard,
    Projects: Projects,
    Containers: Containers,
    Volumes: Volumes,
    Images: Images
}

const layoutStyle = {
    display: 'block',
    position: 'fixed',
    height: 'auto',
    bottom:0,
    top:0,
    left:284,
    right:0,
    margin: 20,
    padding: 20,
    backgroundColor: "#EEE"
}

const mapStateToProps = (state) => {
    return {
        currentTab: state.currentTab
    }
}

class MainArea extends React.Component {

    constructor(props) {
        super(props);
    }

    async componentDidMount() {

    }

    render() {

        const name = this.props.currentTab;
        var ChildComponent = componentList[name];

        if (ChildComponent != undefined){

            return (
                <div style={layoutStyle}>
                    <ChildComponent />
                </div>
            )
        }
        return (
            <div style={layoutStyle}>
                Loading ...
            </div>
        )
    }
}

export default connect(mapStateToProps)(MainArea)
