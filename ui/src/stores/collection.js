import flyd from 'flyd'
import { findIndex, find } from 'ramda'

export default class Collection {
	constructor ({ idKey = 'id' } = {}) {
		this.idKey = idKey
		this.records = flyd.stream([])
	}
	insert (xs) {
		const { idKey } = this
		if (!Array.isArray(xs)) xs = [xs]
		let records = xs.reduce((acc, x) => {
			const idx = findIndex(y => y[idKey] === x[idKey], acc)
			if (idx < 0) acc.push(x)
			else acc.splice(idx, 1, x)
			return acc
		}, [...this.records()])
	  this.records(records)
	}
	findOne (val, prop) {
		if (!prop) prop = this.idKey
		return flyd.map(
			// used == instead of === because many IDs are ints.  change to === when IDs are strings.
			// eslint-disable-next-line
			find(x => x[prop] == val),
      this.records
    )
	}
	// filter returns a stream of functions, curried to filter/sort on a prop
	filter (prop, sortFn) {
		return flyd.map(
			xs => vals => {
				if (!Array.isArray(vals)) vals = [vals]
				const result = xs.filter(x => vals.indexOf(x[prop]) > -1)
			  if (sortFn) result.sort(sortFn)
				return result
			},
		  this.records
		)
	}
	getAll () {
		return this.records
	}
}