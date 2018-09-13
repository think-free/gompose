import React from 'react'

const container = {
    boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)',
    borderRadius: '25px',
    backgroundColor: "#FFF",
    color: "#000"
}

class Container extends React.Component {

    constructor(props) {
        super(props);
    }

    render () {
        if (this.props.style != null){
            return (
                <div style={{...container,...this.props.style}}>{this.props.children}</div>
            )
        } else {
            return (
                <div style={container}>{this.props.children}</div>
            )
        }
    }
}

export default Container;
