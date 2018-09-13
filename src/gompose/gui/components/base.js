import Header from './header'

const layoutStyle = {
    display: 'block',
    position: 'fixed',
    height: 'auto',
    bottom:0,
    top:0,
    left:0,
    right:0,
    margin: 20,
    padding: 20,
    border: '1px solid #DDD'
}

const Base = (props) => (
    <div>
        <style global jsx>{`
          html,
          body,
          body > div:first-child,
          div#__next,
          div#__next > div,
          div#__next > div > div {
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
          }
        `}</style>

        <div style={layoutStyle}>
            <Header />
            {props.children}
        </div>
    </div>
)

export default Base
