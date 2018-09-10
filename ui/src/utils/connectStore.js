import React from 'react'
import flyd from 'flyd'

export default function connect (opts) {
	return component => class extends React.Component {
		constructor (props, ...rest) {
			super(props, ...rest)

			this.keys = Object.keys(opts.state)
			this.parentStreams = this.buildParentStreams(props)
			this.state = this.buildInitialState()
		}
		buildParentStreams (props) {
			return this.keys.reduce((acc, x) => {
				acc[x] = opts.state[x](props)
				return acc
			}, {})
		}
		buildInitialState () {
			return this.keys.reduce((acc, x) => {
				acc[x] = this.parentStreams[x]()
				return acc
			}, {})
		}
		componentDidMount () {
			this.streams = this.keys.reduce((acc, x) => {
				acc.push(flyd.on(
					y => this.setState({ [x]: y }),
					this.parentStreams[x]
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