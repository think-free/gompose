import Link from 'next/link'
import fetch from 'isomorphic-unfetch'
import { connect } from 'react-redux';

/* Dashboard */
/* ************************************************************************ */

const layoutStyle = {
    display: 'block',
    height: '100%',
    width: '100%',
    overflowY: 'auto'
}

class Dashboard extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            boards: [],
        };
    }

    async componentDidMount() {

        const res = await fetch('/dashboard')
        const data = await res.json()
        this.setState({ boards: data })

        this.interval = setInterval(() => {
            fetch('/dashboard')
            .then(response => response.json())
            .then(data => this.setState({ boards: data }))
        }, 5000);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    render() {

        const { boards } = this.state;

        return (
            <div style={layoutStyle}>
                {boards.map(function(board){
                    return (
                        <DashboardItem board={board}/>
                    )
                })}
            </div>
        )
    }
}

/* DashboardItem */
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

class DashboardItem extends React.Component {

    constructor(props) {
        super(props);

        this.handleClick=this.handleClick.bind(this);
    }

    handleClick(e) {
        var url = this.props.board.baseUrl
        if (url == ""){
            url = window.location.protocol + "//" + window.location.hostname
        }
        url = url + ":" + this.props.board.port
        url = url + this.props.board.path
        window.open(url);
    }

    render() {

        var imageUrl = this.props.board.imageOverrideUrl
        if (imageUrl == "" || imageUrl == undefined || imageUrl == null){
            console.log("Getting project image")
            if (this.props.board.parent != "" && this.props.board.parent != "none")
                imageUrl = "/files/"+this.props.board.parent+"/"+this.props.board.project+"/.logo.png"
            else
                imageUrl = "/files/"+this.props.board.project+"/.logo.png"
        }

        console.log(imageUrl)

        return (
            <div style={cellStyle} onClick={this.handleClick}>
                <div style={cellContent}>
                    <img src={imageUrl} alt="logo" width="90" height="90" />
                    {this.props.board.project}<br/>{this.props.board.name}
                </div>
            </div>
        )
    }
}

// project
// parent
// imageOverrideUrl
// name
// baseUrl
// port
// path

export default Dashboard
