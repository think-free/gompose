import React from 'react'
import { connect } from 'react-redux'

import { setValue } from './store.js'
import Container from './container.js'

const container = {
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

const input = {
    height: '1.3em'
}

class ProjectToolbar extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            addGit : false
        }

        this.backClick=this.backClick.bind(this);
        this.addClick=this.addClick.bind(this);
        this.updateClick=this.updateClick.bind(this);

        this.addGitClick=this.addGitClick.bind(this);
        this.cancelAddGitClick=this.cancelAddGitClick.bind(this);
    }

    backClick(e) {

        if (this.props.isLog){
            this.props.dispatch(setValue("logs", "none"));
        } else if (this.props.isDetail){
            this.props.dispatch(setValue("projectDetail", "none"));
        } else {
            this.props.dispatch(setValue("projectParent", "none"));
        }
    }

    addClick(e) {
        this.setState({'addGit' : true});
    }

    updateClick(e){
        console.log("Update project " + this.props.parent + " / " + this.props.project)
        fetch("/project/update?parent=" + this.props.parent + "&name=" + this.props.project)
    }

    addGitClick(e) {
        console.log(this.state.text)
        this.setState({'addGit' : false});
    }

    cancelAddGitClick(e) {
        this.setState({'addGit' : false});
    }

    render () {

        if (this.state.addGit) {

            return (
                <Container style={{...container,...input}}>&nbsp;&nbsp;&nbsp;
                    <input type="text" onChangeText={(text) => this.setState({text})}/>
                    <span style={button} onClick={this.addGitClick}>Add</span> |
                    <span style={button} onClick={this.cancelAddGitClick}>Cancel</span>
                </Container>
            )

        } else if (!this.props.addBt && !this.props.updateBt && !this.props.backBt){
            return <div/>
        } else if (!this.props.addBt && !this.props.updateBt){
            return (
                <Container style={container}> <span style={button} onClick={this.backClick}>Back</span> </Container>
            )
        } else if (!this.props.backBt && !this.props.updateBt){
            return (
                <Container style={container}> <span style={button} onClick={this.addClick}>Add git</span> </Container>
            )
        } else if (!this.props.updateBt){
            return (
                <Container style={container}> {this.props.addBt ? <span><span style={button} onClick={this.addClick}>Add git</span>|</span> : null} {this.props.backBt ?<span style={button} onClick={this.backClick}>Back</span> : null} </Container>
            )
        } else {
            return (
                <Container style={container}> {this.props.addBt ? <span><span style={button} onClick={this.addClick}>Add git</span>|</span> : null} {this.props.updateBt ? <span style={button} onClick={this.updateClick}>Git pull</span> : null } {this.props.backBt ? <span>|<span style={button} onClick={this.backClick}>Back</span></span> : null} </Container>
            )
        }
    }
}

export default connect()(ProjectToolbar);
