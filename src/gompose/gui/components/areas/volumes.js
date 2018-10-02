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
        Volumes: state.Volumes
    }
}

const footer = {
    display: 'block',
    position: 'relative',
    top: 70,
    height: '70px'
}

class Volumes extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            volumes: [],
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
        var url = "/volumes"

        fetch(url)
        .then(response => response.json())
        .then(data => this.setState({ volumes: data.sort(function(a, b){return a.Name > b.Name}) }))
    }

    render() {
        const { volumes } = this.state;

        return (
            <div style={layoutStyle}>
                {volumes.map(function(volume){
                    return (
                        <div>
                            <Container style={generic_container}>
                                <div><div style={orange}>{volume.Name}</div><br />
                                    <table>
                                        <tr>
                                            <td>Mount point</td>
                                            <td>:</td>
                                            <td>{volume.Mountpoint}</td>
                                        </tr>
                                        <tr>
                                            <td>Drive</td>
                                            <td>:</td>
                                            <td>{volume.Driver}</td>
                                        </tr>
                                        <tr>
                                            <td>Created</td>
                                            <td>:</td>
                                            <td>{volume.CreatedAt}</td>
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

export default connect(mapStateToProps)(Volumes);
