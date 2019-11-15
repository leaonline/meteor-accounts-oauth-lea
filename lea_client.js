/* global ServiceConfiguration, Lea */
import { Random } from 'meteor/random'
import { OAuth } from 'meteor/oauth'

// eslint-disable-next-line
Lea = Lea || {}

// Request Lea credentials for the user
//
// @param options {optional}
// @param credentialRequestCompleteCallback {Function} Callback function to call on
//   completion. Takes one argument, credentialToken on success, or Error on
//   error.
Lea.requestCredential = (options, credentialRequestCompleteCallback) => {
  // support both (options, callback) and (callback).
  if (!credentialRequestCompleteCallback && typeof options === 'function') {
    credentialRequestCompleteCallback = options
    options = {}
  }

  const serviceConfig = ServiceConfiguration.configurations.findOne({ service: 'lea' })
  if (!serviceConfig || !serviceConfig.dialogUrl) {
    credentialRequestCompleteCallback && credentialRequestCompleteCallback(new ServiceConfiguration.ConfigError())
    return
  }

  const credentialToken = Random.secret()
  const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent)
  const display = mobile ? 'touch' : 'popup'

  let scope = ['email']
  if (options && options.requestPermissions) {
    scope = scope.concat(options.requestPermissions)
  }
  const flatScope = scope.map(encodeURIComponent).join('+')
  const loginStyle = OAuth._loginStyle('lea', serviceConfig, options)
  const dialogUrl = serviceConfig.dialogUrl
  const redirectUrl = OAuth._redirectUri('lea', serviceConfig)
  const state = OAuth._stateParam(loginStyle, credentialToken, options && options.redirectUrl)

  const loginUrl =
    `${dialogUrl}` +
    '?response_type=code' +
    `&client_id=${serviceConfig.clientId}` +
    `&scope=${flatScope}` +
    `&display=${display}` +
    `&redirect_uri=${encodeURIComponent(redirectUrl)}` +
    `&state=${encodeURIComponent(state)}`

  OAuth.launchLogin({
    loginService: 'lea',
    loginStyle,
    loginUrl,
    credentialRequestCompleteCallback,
    credentialToken,
    popupOptions: { width: 900, height: 450 }
  })
}
