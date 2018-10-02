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
                        <div>
                            <Container style={generic_container}>
                                <div><div style={orange}>{container.Names[0] != undefined ? container.Names[0].substring(1) : container.Id}</div><br />
                                    <table>
                                        <tr>
                                            <td>State</td>
                                            <td>:</td>
                                            <td>{container.Status} ({container.State})</td>
                                        </tr>
                                        <tr>
                                            <td>Command</td>
                                            <td>:</td>
                                            <td>{container.Command}</td>
                                        </tr>
                                        <tr>
                                            <td>Image</td>
                                            <td>:</td>
                                            <td>{container.Image}</td>
                                        </tr>
                                    </table>
                                </div>
                            </Container>
                            <br />
                        </div>
                    )
                })}

                <div style={footer}></div>
            </div>
        );
    }
}

export default connect(mapStateToProps)(Containers);
