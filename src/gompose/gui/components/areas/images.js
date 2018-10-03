import React from 'react'
import { connect } from 'react-redux'
import Container from '../container.js'
import { setValue } from '../store.js'
import UploadForm from '../fileuploader.js'

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

const floatTopRightArea = {
    position: 'absolute',
    top: '15px',
    right: '20px'
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
    textTransform: 'uppercase',
    userSelect:'none'
}

const mapStateToProps = (state) => {

    return {
        hideUntaggedImages: state.hideUntaggedImages,
        ImageUpload: state.ImageUpload
    }
}

class Images extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            images: [],
        };

        this.props.hideUntaggedImages = true;
        this.props.ImageUpload = false;

        this.removeUntagged=this.removeUntaggedClick.bind(this);
        this.hideShowUntaggedClick=this.hideShowUntaggedClick.bind(this);
        this.showUploadImageForm=this.showUploadImageForm.bind(this);
    }

    componentDidMount() {

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
        var url = "/images"

        fetch(url)
        .then(response => response.json())
        .then(data => this.setState({ images: data }))
    }

    removeUntaggedClick(e) {
        fetch("/images/removeintermediate")
    }

    hideShowUntaggedClick(e) {

        this.props.dispatch(setValue("hideUntaggedImages", !this.props.hideUntaggedImages));
    }

    showUploadImageForm(e) {

        this.props.dispatch(setValue("ImageUpload", !this.props.ImageUpload));
    }

    render() {

        var upload = this.props.ImageUpload;

        if (upload) {

            return (
                <div style={layoutStyle}>
                    <Container style={container_toolbar}> <span style={button_toolbar} onClick={this.showUploadImageForm}>Back</span></Container>
                    <Container style={generic_container}>
                        <div style={orange}>Upload image</div>
                        <br />
                        <UploadForm url="/images/upload"done={this.showUploadImageForm}/>
                    </Container>
                </div>
            )

        } else {

            const { images } = this.state;

            var hide = this.props.hideUntaggedImages;

            return (
                <div style={layoutStyle}>
                    <Container style={container_toolbar}> <span style={button_toolbar} onClick={this.hideShowUntaggedClick}>{hide ? "Show" : "Hide"} untagged</span>|<span style={button_toolbar} onClick={this.showUploadImageForm}>Upload</span></Container>

                    {images.map(function(image){

                        if (image.RepoTags === undefined)
                            return (null);

                        if (hide && image.RepoTags[0] === "<none>:<none>")
                            return (null);

                        else {
                            return (
                                <ImageDetail image={image}/>
                            )
                        }
                    })}

                    <div style={footer}></div>
                </div>
            );
        }
    }
}

class ImageDetail extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
        };

        this.deleteClick=this.deleteClick.bind(this);
    }

    deleteClick(e) {
        console.log("Deleting image " + this.props.image.Id)
        fetch("/images/delete?id=" + this.props.image.Id )
    }

    render() {
        var date = new Date(this.props.image.Created * 1000)
        var created = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear() + " @ " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds()

        return (
            <div>
                <Container style={generic_container}>
                        <div>
                            {this.props.image.RepoTags.map(function(tag){
                                return (
                                    <div style={orange}>{tag}</div>
                                )
                            })}
                            <span style={floatTopRightArea}> <div style={button} onClick={this.deleteClick}>Delete</div> </span><br />
                        </div>
                        <table>
                            <tr>
                                <td>Id</td>
                                <td>:</td>
                                <td>{this.props.image.Id.slice(7, 19)}</td>
                            </tr>
                            <tr>
                                <td>Created</td>
                                <td>:</td>
                                <td>{created}</td>
                            </tr>
                            <tr>
                                <td>Size</td>
                                <td>:</td>
                                <td>{Math.round(this.props.image.Size / 1000000)} MB</td>
                            </tr>
                        </table>
                </Container>
                <br />
            </div>
        );
    }
}

export default connect(mapStateToProps)(Images);
