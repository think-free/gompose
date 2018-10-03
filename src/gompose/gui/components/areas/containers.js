import React from 'react'
import { connect } from 'react-redux'
import Container from '../container.js'
import { setValue } from '../store.js'

const layoutStyle = {
    display: 'block',
    height: '100%',
    width: '100%',
    overflowY: 'auto'
}

const orange = {
    color: "#E65D1E"
}

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

const generic_container = {
    display: 'block',
    position: 'relative',
    top: 35,
    width: '90%',
    left: 20,
    padding: '15px'
}

const mapStateToProps = (state) => {
    return {
        Containers: state.Containers
    }
}

const footer = {
    display: 'block',
    position: 'relative',
    top: 70,
    height: '70px'
}

class Containers extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            containers: [],
        };
    }

    async componentDidMount() {

        this.getData();

        // Periodicaly refresh states
        this.interval = setInterval(() => {
            this.getData();
        }, 2000);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    async getData(url){
        var url = "/containers"

        fetch(url)
        .then(response => response.json())
        .then(data => this.setState({ containers: data }))
    }

    render() {
        const { containers } = this.state;

        return (
            <div style={layoutStyle}>
                {containers.map(function(container){
                    return (
                        <ContainerDetail container={container}/>
                    )
                })}

                <div style={footer}></div>
            </div>
        );
    }
}


class ContainerDetail extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
        };

        this.deleteClick=this.deleteClick.bind(this);
    }

    deleteClick(e) {
        console.log("Deleting container " + this.props.container.Id)
        fetch("/containers/delete?id=" + this.props.container.Id )
    }

    render() {
        return (
            <div>
                <Container style={generic_container}>
                    <div><div style={orange}>{this.props.container.Names[0] != undefined ? this.props.container.Names[0].substring(1) : this.props.container.Id} <span style={floatRightArea}> <div style={button} onClick={this.deleteClick}>Delete</div> </span></div><br />

                        <table>
                            <tr>
                                <td>State</td>
                                <td>:</td>
                                <td>{this.props.container.Status} ({this.props.container.State})</td>
                            </tr>
                            <tr>
                                <td>Command</td>
                                <td>:</td>
                                <td>{this.props.container.Command}</td>
                            </tr>
                            <tr>
                                <td>Image</td>
                                <td>:</td>
                                <td>{this.props.container.Image}</td>
                            </tr>
                        </table>
                    </div>
                </Container>
                <br />
            </div>
        );
    }
}

export default connect(mapStateToProps)(Containers);
