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
    textTransform: 'uppercase'
}

class ProjectToolbar extends React.Component {

    constructor(props) {
        super(props);

        this.backClick=this.backClick.bind(this);
        this.addClick=this.addClick.bind(this);
        this.updateClick=this.updateClick.bind(this);
    }

    backClick(e) {
        if (this.props.isDetail){
            this.props.dispatch(setValue("projectDetail", "none"));
        } else {
            this.props.dispatch(setValue("projectParent", "none"));
        }
    }

    addClick(e) {
        this.props.dispatch(setValue("projectParent", "none"));
        this.props.dispatch(setValue("projectDetail", "none"));
    }

    updateClick(e){
        console.log("Update project " + this.props.parent + " / " + this.props.project)
        fetch("/project/update?parent=" + this.props.parent + "&name=" + this.props.project)
    }

    render () {
        if (!this.props.addBt && !this.props.updateBt && !this.props.backBt){
            return <div/>
        } else if (!this.props.addBt && !this.props.updateBt){
            return (
                <Container style={container}> <span style={button} onClick={this.backClick}>Back</span> </Container>
            )
        } else if (!this.props.backBt && !this.props.updateBt){
            return (
                <Container style={container}> <span style={button} onClick={this.addClick}>Add</span> </Container>
            )
        } else if (!this.props.updateBt){
            return (
                <Container style={container}> {this.props.addBt ? <span><span style={button} onClick={this.addClick}>Add</span>|</span> : null} {this.props.backBt ?<span style={button} onClick={this.backClick}>Back</span> : null} </Container>
            )
        } else {
            return (
                <Container style={container}> {this.props.addBt ? <span><span style={button} onClick={this.addClick}>Add</span>|</span> : null} {this.props.updateBt ? <span style={button} onClick={this.updateClick}>Update</span> : null } {this.props.backBt ? <span>|<span style={button} onClick={this.backClick}>Back</span></span> : null} </Container>
            )
        }
    }
}

export default connect()(ProjectToolbar);
