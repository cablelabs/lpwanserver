import flyd from 'flyd'
import { findIndex, find, filter } from 'ramda'

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
		return flyd.combine(
			xs => find(x => x[prop || this.idKey] === val, xs()),
      [this.records]
    )
	}
	filter (prop, sortFn) {
		// return flyd.combine(
		// 	xs => vals => {
		// 		if (!Array.isArray(vals)) vals = [vals]
		// 		const result = xs().filter(x => vals.indexOf(x[prop]) > -1)
		// 	  if (sortFn) result.sort(sortFn)
		// 		return result
		// 	},
		//   [this.records]
		// )

		return vals => {
			if (!Array.isArray(vals)) vals = [vals]
			const _filter = filter(x => vals.indexOf(x[prop]) > -1)
			return flyd.combine(
				xs => {
					const result = _filter(xs())
					
				},
				[this.records]
			)
		}
	}
}