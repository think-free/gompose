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
        Images: state.Images
    }
}

const footer = {
    display: 'block',
    position: 'relative',
    top: 70,
    height: '70px'
}

const container_toolbar = {
    position: 'relative',
    float: 'right',
    textAlign: 'center',
    top: 0,
    height: '1.2em',
    right: 30,
    padding: '0.1em',
    cursor: 'pointer'
}

const button_toolbar = {
    width: 65,
    height: '1em',
    textAlign: 'center',
    padding: '10px',
    color: "#E65D1E",
    fontVariant: 'small-caps',
    textTransform: 'uppercase'
}

const mapStateToProps = (state) => {
    return {
        hideIntermediateImages: state.hideIntermediateImages
    }
}

class Images extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            images: [],
        };

        this.removeUntagged=this.removeUntaggedClick.bind(this);
        this.hideShowIntermediateClick=this.hideShowIntermediateClick.bind(this);
    }

    async componentDidMount() {

        this.getData();

        // Periodicaly refresh states
        this.interval = setInterval(() => {
            this.getData();
        }, 2000);
    }

    async getData(url){
        var url = "/images"

        fetch(url)
        .then(response => response.json())
        .then(data => this.setState({ images: data }))
    }

    removeUntaggedClick(e) {
        fetch("/images/removeintermediate")
    }

    hideShowIntermediateClick(e) {

        this.props.dispatch(setValue("hideIntermediateImages", !this.props.hideIntermediateImages));
    }

    render() {
        const { images } = this.state;

        return (
            <div style={layoutStyle}>
                <Container style={container_toolbar}> <span style={button_toolbar} onClick={this.hideShowIntermediateClick}>{this.props.hideIntermediateImages ? "Hide" : "Show"} intermediate</span> <span style={button_toolbar} onClick={this.removeUntaggedClick}>Clean intermediate</span>|<span style={button_toolbar}>Upload</span></Container>

                {images.map(function(image){

                    if (this.props.hideIntermediateImages && image.RepoTags[0] === "<none>:<none>")
                        return ()

                    var date = new Date(image.Created * 1000)
                    var created = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear() + " @ " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds()

                    return (
                        <div>
                            <Container style={generic_container}>
                                    {image.RepoTags.map(function(tag){
                                        return (
                                            <div><div style={orange}>{tag}</div><br /></div>
                                        )
                                    })}
                                    <table>
                                        <tr>
                                            <td>Id</td>
                                            <td>:</td>
                                            <td>{image.Id.slice(7, 19)}</td>
                                        </tr>
                                        <tr>
                                            <td>Created</td>
                                            <td>:</td>
                                            <td>{created}</td>
                                        </tr>
                                        <tr>
                                            <td>Size</td>
                                            <td>:</td>
                                            <td>{Math.round(image.Size / 1000000)} MB</td>
                                        </tr>
                                    </table>
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

export default connect(mapStateToProps)(Images);
