
import { connect } from 'react-redux';
import { setValue } from '../components/store.js'

const layoutStyle = {
    padding: 20,
    marginTop: 10,
    width: 200,
    border: '1px solid #DDD',
    backgroundColor: "#EEE"
}

const listStyle = {
    listStyleType: 'none',
    margin: 0,
    padding: 0,
    width: 200
}

class Menu extends React.Component {

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        this.props.dispatch(setValue("currentTab", "Dashboard"))
    }

    render(){
        return(
            <div style={layoutStyle}>
                <ul style={listStyle}>
                    <ElementList>Dashboard</ElementList>
                    <ElementList>Projects</ElementList>
                    <ElementList>Containers</ElementList>
                    <ElementList>Images</ElementList>
                    <ElementList>Volumes</ElementList>
                </ul>
            </div>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        currentTab: state.currentTab
    }
}

class ElementList extends React.Component {

    constructor(props) {
        super(props);

        this.handleClick=this.handleClick.bind(this); // For 'this' to be available in 'handleClick' function
    }

    handleClick(e) {
        this.props.dispatch(setValue("currentTab",this.props.children ));
    }

    render(){
        if (this.props.children == this.props.currentTab){

            return (
                <li onClick={this.handleClick}>
                    {this.props.children}
                    <style jsx>{`

                        li {
                            border: 1px solid #E65D1E;
                            margin: 5px;
                            padding: 5px;
                            background-color: #E65D1E;
                            color: #FFF;
                            font-size: 1.2em;
                            user-select:none;
                        }

                        li:hover {
                            color: #FFF;
                            border: 1px solid #E65D1E;
                            background-color: #E65D1E;
                        }

                    `}</style>
                </li>
            )
        } else {
            return (
                <li onClick={this.handleClick}>
                    {this.props.children}
                    <style jsx>{`

                        li {
                            border: 1px solid #DDD;
                            margin: 5px;
                            padding: 5px;
                            background-color: #FFF;
                            color: #E65D1E;
                            font-size: 1.2em;
                            user-select:none;
                            box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
                        }

                        li:hover {
                            color: #FFF;
                            border: 1px solid #E65D1E;
                            background-color: #E65D1E;
                        }

                    `}</style>
                </li>
            )
        }

    }
}

ElementList = connect(mapStateToProps)(ElementList) // To have access to the dispacher (Create a 'smart' component) + mapStateToProps to be get the value from the store mapped on the component

export default connect()(Menu)
