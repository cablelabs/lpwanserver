import React from 'react'

export default function connectStores (opts) {
  return component => class extends React.Component {
    constructor (props, ...rest) {
      super(props, ...rest)
      this.state = {}
    }
    componentDidMount () {

    }
    render () {
      return React.createElement(component, { ...this.state, ...this.actions })
    }
  }
}

const opts = [
  [
    store,
    state,
    actions
  ]
]