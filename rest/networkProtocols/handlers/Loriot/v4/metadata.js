module.exports = {
  protocolHandlerName: 'Loriot',
  version:
    {
      versionText: 'Version 4.0',
      versionValue: '4.0'
    },
  networkType: 'Lora',
  oauthUrl: '',
  protocolHandlerNetworkFields: [
    {
      name: 'apiKey',
      description: 'The api key created through the Loriot console.',
      help: '',
      type: 'string',
      label: 'API Key',
      value: '',
      required: true,
      placeholder: '',
      oauthQueryParameter: ''
    }
  ]
}
