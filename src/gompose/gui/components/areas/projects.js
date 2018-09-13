import Link from 'next/link'
import fetch from 'isomorphic-unfetch'
import { connect } from 'react-redux';

import ToolBar from '../projecttoolbar.js'
import Detail from './projectdetail.js'
import { setValue } from '../../components/store.js'

/* Projects */
/* ************************************************************************ */

const layoutStyle = {
    display: 'block',
    height: '100%',
    width: '100%',
    overflowY: 'auto'
}

const mapStateToProps = (state) => {
    return {
        projectParent: state.projectParent,
        projectDetail: state.projectDetail
    }
}

class Projects extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            boards: [],
            create: false,
            git: false
        };

        this.getData=this.getData.bind(this);
        this.backClick=this.backClick.bind(this);
    }

    async componentDidMount() {

        // Resetting states
        this.props.projectParent = "none";
        this.props.projectDetail = "none";
        this.props.dispatch(setValue("projectParent", "none"));
        this.props.dispatch(setValue("projectDetail", "none"));

        // Getting first boards
        this.getData();

        // Periodicaly refresh states
        this.interval = setInterval(() => {
            this.getData();
        }, 5000);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.projectParent != this.props.projectParent){
            this.getData();
        }
    }

    async getData(url){
        const parent = this.props.projectParent;
        var url = "/projects"
        if (parent != undefined && parent != "none")
            url = "/projects?parent=" + parent;

        fetch(url)
        .then(response => response.json())
        .then(data => this.setState({ boards: data.projects, create: data.allowcreate, git: data.isgit }))
    }

    backClick(e) {
        this.props.dispatch(setValue("projectParent", "none"));
    }

    render() {

        const { boards } = this.state;

        if (this.props.projectDetail == "none") {

            return (
                <div style={layoutStyle}>
                    <ToolBar addBt={!this.state.git && this.state.create} updateBt={this.state.git} backBt={this.props.projectParent != "none"} parent={this.props.projectParent} project="none" isDetail={false} />
                    {boards.map(function(board){
                        return (
                            <ProjectsItem key={board.ID} name={board.name} image={board.logo} parent={board.parent} state={board.state}/>
                        )
                    })}
                </div>
            )
        } else {

            return (
                <div style={layoutStyle}>
                    <Detail parent={this.props.projectParent} project={this.props.projectDetail}/>
                </div>
            )
        }
    }
}

/* ProjectsItem */
/* ************************************************************************ */

const cellStyle = {
    display: 'block',
    float: 'left',
    height: '200px',
    width: '200px'
}

const cellContent = {
    position: 'relative',
    display: 'block',
    height: '110px',
    width: '110px',
    bottom:5,
    top:5,
    left:5,
    right:5,
    margin: 20,
    padding: 20,
    backgroundColor: '#FFF',
    boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)',
    textAlign: 'center',
    fontVariant: 'small-caps',
    textTransform: 'uppercase',
    fontSize: '0.8em',
    cursor: 'pointer'
}

const cellStateStopped = {
    position:'absolute',
    bottom: 2,
    right: 2,
    left: 2,
    top: 2,
    border: '1px solid #0D0'
}

const cellStateRunning = {
    position:'absolute',
    bottom: 2,
    right: 2,
    left: 2,
    top: 2,
    border: '1px solid #0D0'
}

const cellStateFolder = {
    position:'absolute',
    bottom: 2,
    right: 2,
    left: 2,
    top: 2
}

class ProjectsItem extends React.Component {

    constructor(props) {
        super(props);

        this.handleClick=this.handleClick.bind(this);
    }

    handleClick(e) {
        if (this.props.parent){
            this.props.dispatch(setValue("projectParent",this.props.name));
        } else {
            this.props.dispatch(setValue("projectDetail", this.props.name));
        }
    }

    render() {

        var stateStyle = this.props.state == "running" ? cellStateRunning : this.props.state == "stopped" ? cellStateStopped : cellStateFolder
        return (
            <div style={cellStyle} onClick={this.handleClick}>
                <div style={cellContent}>
                    <div style={stateStyle} />
                    <img src={this.props.image} alt="logo" width="100" height="100" />
                    {this.props.name}
                </div>
            </div>
        )
    }
}

ProjectsItem = connect()(ProjectsItem)

export default connect(mapStateToProps)(Projects)
