import Link from 'next/link'
import fetch from 'isomorphic-unfetch'
import { createStore } from 'redux'
import { Provider }  from 'react-redux'

import Store from '../components/store.js'
import { setValue } from '../components/store.js'
import Login from '../components/login.js'
import Logged from '../components/logged.js'

const store = createStore(Store);

class Index extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            logged: true
        };

        store.subscribe(() =>
            console.log(store.getState())
        )
    }

    async componentDidMount() {
        document.title = "Gompose";
    }

    render() {

        if (this.state.logged){
            return (
                <Provider store={store}>
                    <Logged />
                </Provider>
            )
        } else {
            return (
                <Provider store={store}>
                    <Login />
                </Provider>
            )
        }
    }
}

export default Index
