function createClient ({ connector, onSuccess, onError }) {
  async function runCommand (name, command, args) {
    try {
      const result = await connector(name, command, args)
      if (onSuccess) await onSuccess(name, command, args, result)
      return result
    }
    catch (error) {
      if (onError) onError(error)
      throw error
    }
  }

  function commandHandler (name) {
    return {
      get (_, command) {
        return (...args) => runCommand(name, command, args)
      }
    }
  }

  const nameHandler = {
    get (_, name) {
      return new Proxy({}, commandHandler(name))
    }
  }

  return new Proxy({}, nameHandler)
}

function classConnector (classInstance) {
  return (name, command, args, result) => {
    if (!result) return classInstance[command](name, ...args)
    return classInstance[command](name, args, result)
  }
}

module.exports = {
  createClient,
  classConnector
}
