import React from 'react'
import { connect } from 'react-redux'
import { setValue } from '../store.js'
import ToolBar from '../projecttoolbar.js'
import Container from '../container.js'

const title_container = {
    position: 'relative',
    textAlign: 'center',
    top: 10,
    height: '1.2em',
    left: 20,
    width: 300,
    padding: '0.1em',
    fontVariant: 'small-caps',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    color: "#E65D1E"
}

const log_container = {
    top: 70,
    display: 'block',
    position: 'relative',
    padding: '10px',
    width: '90%',
    left: 20,
}

class Logs extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            log : ""
        };

        this.buttonClick=this.buttonClick.bind(this);
        this.getData=this.getData.bind(this);
    }

    async componentDidMount() {

        // Getting first boards
        this.getData();
    }

    async getData(url){
        var url = "/logs?parent=" + this.props.parent + "&name=" + this.props.project + "&container=" + this.props.container

        fetch(url)
        .then(response => response.text())
        .then(data => this.setState({ log: data }))
    }

    buttonClick(e) {
        this.props.dispatch(setValue("Logs", "clicked"));
    }

    render() {

        var parent = this.props.parent != "none" ? this.props.parent : ""
        var project = this.props.project != "none" ? this.props.project : ""
        var container = this.props.container != "none" ? this.props.container : ""

        return (
             <div>
                 <ToolBar backBt={true} isLog={true} />
                 <Container style={title_container}>{parent} {project} {container}</Container>
                 <pre style={log_container}>{this.state.log}</pre>
             </div>
        );
    }
}


export default connect()(Logs);
