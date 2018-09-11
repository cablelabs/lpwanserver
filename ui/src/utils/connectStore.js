import React from 'react'
import flyd from 'flyd'

export default function connect (opts) {
	return component => class extends React.Component {
		constructor (props, ...rest) {
			super(props, ...rest)
			this.keys = Object.keys(opts.state)
			this.state = this.buildInitialState()
		}
		getStreamValue(val, map) {
			return map ? map(val, this.props) : val
		}
		buildInitialState () {
			const { props, keys } = this
			return keys.reduce((acc, x) => {
				const { map, stream } = opts.state[x]
				acc[x] = map ? map(stream(props)(), props) : stream(props)()
				return acc
			}, {})
		}
		componentDidMount () {
			this.streams = this.keys.reduce((acc, x) => {
				const { map, stream } = opts.state[x]
				acc.push(flyd.on(
					y => this.setState({ [x]: map ? map(y, this.props) : y }),
					stream(this.props)
				))
				return acc
			}, [])
		}
		componentWillUnmount () {
			this.streams.forEach(x => x.end(true))
		}
		render () {
			return React.createElement(component, { ...this.props, ...this.state })
		}
	}
}