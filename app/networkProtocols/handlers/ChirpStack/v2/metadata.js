module.exports = {
  protocolHandlerName: 'ChirpStack 2.0',
  version:
    {
      versionText: 'Version 2.0',
      versionValue: '2.0'
    },
  networkType: 'Lora',
  oauthUrl: '',
  protocolHandlerNetworkFields: [
    {
      name: 'username',
      description: 'The username of the ChirpStack admin account',
      help: '',
      type: 'string',
      label: 'Username',
      value: '',
      required: true,
      placeholder: 'myChirpStackUsername',
      oauthQueryParameter: ''
    },
    {
      name: 'password',
      description: 'The password of the ChirpStack admin account',
      help: '',
      type: 'password',
      label: 'Password',
      value: '',
      required: true,
      placeholder: 'myChirpStackPassword',
      oauthQueryParameter: ''
    }
  ]
}
