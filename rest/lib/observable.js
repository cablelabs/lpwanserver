const EventEmitter = require('events')
const R = require('ramda')

class Observable extends EventEmitter {
  constructor ({ delimiter = '.' }) {
    super()
    this.values = {}
    this.delimiter = delimiter
  }

  previewSet (path, value) {
    if (path.indexOf(this.delimiter) < 0) return R.assoc(path, value, this.values)
    return R.assocPath(path.split(this.delimiter), value, this.values)
  }

  previewMergeDeep (data) {
    return R.mergeDeepRight(this.values, data)
  }

  setAllValues (values) {
    this.values = values
    this.emit('change', this.values)
    return this
  }

  get (path) {
    if (path.indexOf(this.delimiter) < 0) return R.prop(path, this.values)
    return R.path(path.split(this.delimiter), this.values)
  }

  set (path, value) {
    this.setAllValues(this.previewSet(path, value))
    this.emit(`change:${path}`, value)
    return this
  }

  mergeDeep (data) {
    return this.setAllValues(this.previewMergeDeep(data))
  }
}

class ValidatedObservable extends Observable {
  constructor ({ validate, ...opts }) {
    super(opts)
    this.validate = validate || (() => true)
  }

  setAllValues (values) {
    const valid = this.validate(values)
    return valid && super.setAllValues(values)
  }
}

module.exports = {
  Observable,
  ValidatedObservable
}
