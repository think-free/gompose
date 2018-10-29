import React from 'react'
import { connect } from 'react-redux'
import { setValue } from '../store.js'
import ToolBar from '../projecttoolbar.js'
import Container from '../container.js'

const layoutStyle = {
    display: 'block',
    height: 'calc(100% - 30px)',
    width: '100%'
}

const tbcontainer = {
    position: 'relative',
    float: 'right',
    textAlign: 'center',
    top: 0,
    height: '1.2em',
    right: 30,
    padding: '0.1em',
    cursor: 'pointer'
}

const button = {
    width: 65,
    height: '1em',
    textAlign: 'center',
    padding: '10px',
    color: "#E65D1E",
    fontVariant: 'small-caps',
    textTransform: 'uppercase',
    userSelect:'none'
}


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
    color: "#E65D1E",
    userSelect:'none'
}

const logStyle = {
    display: 'block',
    height: 'calc(100% - 30px)',
    marginTop: 30,
    width: '100%',
    overflowY: 'auto'
}

const log_container = {
    //top: 70,
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

        this.refreshClick=this.refreshClick.bind(this);
        this.backClick=this.backClick.bind(this);
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
        .then(this.scrollToBottom())
    }

    refreshClick(e) {
        this.getData();
    }

    backClick(e) {
        this.props.dispatch(setValue("logs", "none"));
    }

    scrollToBottom = () => {
        this.messagesEnd.scrollIntoView({ behavior: "smooth" });
    }

    render() {

        var parent = this.props.parent != "none" ? this.props.parent : ""
        var project = this.props.project != "none" ? this.props.project : ""
        var container = this.props.container != "none" ? this.props.container : ""

        return (
             <div style={layoutStyle}>
                 <Container style={tbcontainer}> <span style={button} onClick={this.refreshClick}>Refresh</span> | <span style={button} onClick={this.backClick}>Back</span> </Container>
                 <Container style={title_container}>{parent} {project} {container}</Container>

                 <div style={logStyle}>
                     <pre style={log_container}>
                            {this.state.log} <br />
                            <div style={{ float:"left", clear: "both" }} ref={(el) => { this.messagesEnd = el; }} />
                     </pre>
                 </div>
             </div>
        );
    }
}


export default connect()(Logs);
