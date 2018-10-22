import Link from 'next/link'
import fetch from 'isomorphic-unfetch'
import { connect } from 'react-redux';

import Container from '../container.js'
import ToolBar from '../projecttoolbar.js'
import { setValue } from '../store.js'

const floatRightArea = {
    float: 'right',
    marginRight: 5
}

const button = {
    display: 'block',
    borderRadius: '5px',
    float: 'left',
    padding: 3,
    marginLeft: 5,
    backgroundColor: "#E65D1E",
    color: "#FFF",
    cursor: 'pointer',
    userSelect: 'none'
}

const orange = {
    color: "#E65D1E"
}

// State stopped/running
const cellStateStopped = {
    position:'absolute',
    bottom: 1,
    right: 1,
    left: 1,
    top: 1,
    borderRadius: '25px',
    border: '1px solid #D00'
}

const cellStateRunning = {
    position:'absolute',
    bottom: 1,
    right: 1,
    left: 1,
    top: 1,
    borderRadius: '25px',
    border: '1px solid #0D0'
}

// Containers
const title_container = {
    position: 'relative',
    textAlign: 'center',
    top: 10,
    height: '1.2em',
    left: 20,
    width: 200,
    padding: '0.1em',
    fontVariant: 'small-caps',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    color: "#E65D1E"
}

const action_container = {
    display: 'block',
    position: 'relative',
    top: 50,
    height: 20,
    width: '90%',
    left: 20,
    padding: '10px'
}

const generic_container = {
    display: 'block',
    position: 'relative',
    top: 70,
    width: '90%',
    left: 20,
    padding: '10px'
}

// Container title
const containerTitle = {
    fontWeight: 'bold',
    marginLeft: '10px'
}

// Container content
const subcontainer = {

    display: 'block',
    position: 'relative',
    marginTop: 10,
    paddingLeft: 10,
    left: 20,
    width: '90%',
    backgroundColor: "#EEE"
}

const portMap = {
    height: '30px',
    lineHeight : '30px',
}

const containerDetail = {
    padding : '10px'
}

// Footer spacing
const footer = {
    display: 'block',
    position: 'relative',
    top: 70,
    height: '70px'
}

class ProjectDetail extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            detail: [],
        };

        this.getData=this.getData.bind(this);
        this.stopClick=this.stopClick.bind(this);
        this.startClick=this.startClick.bind(this);
        this.pullClick=this.pullClick.bind(this);
    }

    async componentDidMount() {

        if (this.props.parent != undefined && this.props.project != undefined){
            // Getting first project details
            this.getData();

            // Periodicaly refresh states
            this.interval = setInterval(() => {
                this.getData();
            }, 2000);
        }
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    async getData(url){
        var url = "/project/get?parent=" + this.props.parent + "&name=" + this.props.project

        fetch(url)
        .then(response => response.json())
        .then(data => this.setState({ detail: data }))
    }

    pullClick(e) {
        console.log("Pull project " + this.props.parent + " / " + this.props.project)
        fetch("/project/pull?parent=" + this.props.parent + "&name=" + this.props.project)
    }

    startClick(e) {
        console.log("Start project " + this.props.parent + " / " + this.props.project)
        fetch("/project/start?parent=" + this.props.parent + "&name=" + this.props.project)
    }

    stopClick(e) {
        console.log("Stop project " + this.props.parent + " / " + this.props.project)
        fetch("/project/stop?parent=" + this.props.parent + "&name=" + this.props.project)
    }

    render() {

        const { detail } = this.state;
        var stateStyle = detail.status == "running" ? cellStateRunning : cellStateStopped

        const parent = this.props.parent
        const project = this.props.project

        if (detail.ports != undefined && detail.ports != null){

            return (
                <div>
                    <ToolBar updateBt={detail.git} backBt={true} parent={this.props.parent} project={this.props.project} isDetail={true} />

                    <Container style={title_container}> <div style={stateStyle}>{this.props.parent != "none" ? this.props.parent + " / " + this.props.project : this.props.project}</div> </Container>
                    <Container style={action_container}>
                        <img src="static/assets/action.png" /><span style={containerTitle}>state</span>&nbsp;&nbsp;&nbsp;{detail.status}
                        <span style={floatRightArea}>
                            <div style={button} onClick={this.pullClick}>Pull images</div>
                            <div style={button} onClick={this.stopClick}>Stop</div>
                            <div style={button} onClick={this.startClick}>Start</div>
                        </span>
                    </Container>
                    <Container style={generic_container}>
                        <img src="static/assets/network.png" /><span style={containerTitle}>network</span><br /><br />
                        {detail.ports.map(function(port){
                            return (
                                <ProjectPortDetail mapping={port} parent={parent} project={project}/>
                            )
                        })}
                    </Container>
                    <br />
                    <Container style={generic_container}>
                        <img src="static/assets/container.png" /><span style={containerTitle}>containers</span><br /><br />
                        {detail.containers.map(function(container){
                            return (
                                <ProjectContainerDetail container={container} parent={parent} project={project}/>
                            )
                        })}
                    </Container>
                    <div style={footer}></div>
                </div>
            )
        } else {

            return (
                <div> Loading ... </div>
            )
        }
    }
}

class ProjectPortDetail extends React.Component {

    constructor(props) {
        super(props);

        this.publishClick=this.publishClick.bind(this);
        this.descriptionChanged=this.descriptionChanged.bind(this);
        this.urlPathChanged=this.urlPathChanged.bind(this);

        this.state = {
            checked : this.props.mapping.exposed,
            description : this.props.mapping.description,
            urlPath : this.props.mapping.urlPath
        }
    }

    post (url, json) {
        fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: json
        })
    }

    descriptionChanged(event) {

        this.state.description = event.target.value
        console.log("Description " + this.state.description)
    }

    urlPathChanged(e) {

        this.state.urlPath = e.target.value
        console.log("UrlPath " + this.state.urlPath)
    }

    publishClick(e) {

        this.state.checked = e.target.checked

        if (this.state.checked){

            console.log("Publishing " + this.state.checked + " - " + this.state.description + " - " + this.state.urlPath)
            this.post("/dashboard/add", JSON.stringify(
                {
                    project: this.props.project,
                    parent: this.props.parent,
                    name: this.state.description,
                    port: this.props.mapping.map.split(":")[1],
                    path: this.state.urlPath
                }
            ))

        } else {

            console.log("Deleting " + this.props.mapping.exposeId + " : " + this.state.checked + " - " + this.state.description + " - " + this.state.urlPath)
            fetch("/dashboard/del?id=" + this.props.mapping.exposeId)
        }
    }

    render() {

        return (
            <div style={{...subcontainer,...portMap}}>
                <span style={orange}>{this.props.mapping.map.split(":")[1]}</span> : {this.props.mapping.port}
                <span style={floatRightArea}>
                    <input type="text" disabled={this.props.mapping.exposed} defaultValue={this.state.description} onBlur={this.descriptionChanged}/>
                    <input type="text" disabled={this.props.mapping.exposed} defaultValue={this.state.urlPath} onBlur={this.urlPathChanged}/>
                    <input type="checkbox" defaultChecked={this.props.mapping.exposed} onChange={this.publishClick}/>
                </span>
            </div>
        )
    }
}

class ProjectContainerDetail extends React.Component {

    constructor(props) {
        super(props);

        this.logClick=this.logClick.bind(this);
        this.startClick=this.startClick.bind(this);
        this.stopClick=this.stopClick.bind(this);
        this.deleteClick=this.deleteClick.bind(this);
    }

    logClick(e) {
        console.log("Show logs " + this.props.parent + " " + this.props.project + " container : " + this.props.container.compose);
        this.props.dispatch(setValue("logs", this.props.container.compose));
    }

    startClick(e) {
        console.log("Start container " + this.props.parent + " / " + this.props.project + " -> " + this.props.container.compose)
        fetch("/project/container/start?parent=" + this.props.parent + "&name=" + this.props.project + "&container=" + this.props.container.compose)
    }

    stopClick(e) {
        console.log("Stop container " + this.props.parent + " / " + this.props.project + " -> " + this.props.container.compose)
        fetch("/project/container/stop?parent=" + this.props.parent + "&name=" + this.props.project + "&container=" + this.props.container.compose)
    }

    deleteClick(e) {
        console.log("Delete container " + this.props.parent + " / " + this.props.project + " -> " + this.props.container.compose)
        fetch("/project/container/delete?parent=" + this.props.parent + "&name=" + this.props.project + "&container=" + this.props.container.compose)
    }

    render() {
        return  (

            <div style={{...subcontainer,...containerDetail}}>
                <div style={orange}>{this.props.container.compose}<span style={floatRightArea}> <div style={button} onClick={this.logClick}>Log</div> <div style={button} onClick={this.stopClick}>Stop</div> <div style={button} onClick={this.startClick}>Start</div></span></div><br />
                <span style={floatRightArea}> <div style={button} onClick={this.deleteClick}>Delete</div> </span>
                <table>
                    <tr>
                        <td>State</td>
                        <td>:</td>
                        <td>{this.props.container.status}</td>
                    </tr>
                    <tr>
                        <td>Name</td>
                        <td>:</td>
                        <td>{this.props.container.name}</td>
                    </tr>
                    <tr>
                        <td>Image</td>
                        <td>:</td>
                        <td>{this.props.container.image}</td>
                    </tr>
                    <tr>
                        <td>Volumes</td>
                        <td>:</td>
                    </tr>
                    {this.props.container.volumes.map(function(volume){
                        return (
                            <tr>
                                <td></td>
                                <td></td>
                                <td>{volume}</td>
                            </tr>
                        )
                    })}
                    <tr>
                        <td>Ports</td>
                        <td>:</td>
                    </tr>
                    {this.props.container.ports.map(function(port){
                        return (
                            <tr>
                                <td></td>
                                <td></td>
                                <td>{port}</td>
                            </tr>
                        )
                    })}

                </table>
            </div>
        )
    }
}

ProjectContainerDetail = connect()(ProjectContainerDetail)

export default connect()(ProjectDetail)
