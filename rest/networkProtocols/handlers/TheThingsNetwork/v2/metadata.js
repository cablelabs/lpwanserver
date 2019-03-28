module.exports = {
  activeApplicationNetworkProtocols: {},
  metaData:
    {
      protocolHandlerName: 'TheThingsNetwork',
      version:
        {
          versionText: 'Version 2.0',
          versionValue: '2.0'
        },
      networkType: 'Lora',
      oauthUrl: 'https://account.thethingsnetwork.org/users/authorize',
      protocolHandlerNetworkFields: [
        {
          name: 'clientId',
          description: 'The client id chosen when registering the LPWan',
          help: '',
          type: 'string',
          label: 'Client ID',
          value: '',
          required: true,
          placeholder: 'your-things-client-id',
          oauthQueryParameter: ''
        },
        {
          name: 'clientSecret',
          description: 'The client secret provided when registering the LPWan',
          help: '',
          type: 'string',
          label: 'Client Secret',
          value: '',
          required: true,
          placeholder: 'e.g. ZDTXlylatAHYPDBOXx...',
          oauthQueryParameter: ''
        },
        {
          name: 'username',
          description: 'The username of the TTN admin account',
          help: '',
          type: 'string',
          label: 'Username',
          value: '',
          required: false,
          placeholder: 'myTTNUsername',
          oauthQueryParameter: ''
        },
        {
          name: 'password',
          description: 'The password of the TTN admin account',
          help: '',
          type: 'password',
          label: 'Password',
          value: '',
          required: false,
          placeholder: 'myTTNPassword',
          oauthQueryParameter: ''
        }
      ],
      oauthRequestUrlQueryParams: [
        {
          name: 'response_type',
          valueSource: 'value',
          value: 'code'
        },
        {
          name: 'client_id',
          valueSource: 'protocolHandlerNetworkField',
          protocolHandlerNetworkField: 'clientId'
        },
        {
          name: 'redirect_uri',
          valueSource: 'frontEndOauthReturnUri'
        }
      ],
      oauthResponseUrlQueryParams: [ 'code' ],
      oauthResponseUrlErrorParams: [ 'error', 'error_description' ]
    }
}
