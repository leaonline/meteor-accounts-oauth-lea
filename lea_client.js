Lea = {};

// Request Lea credentials for the user
//
// @param options {optional}
// @param credentialRequestCompleteCallback {Function} Callback function to call on
//   completion. Takes one argument, credentialToken on success, or Error on
//   error.
Lea.requestCredential = (options, credentialRequestCompleteCallback) => {

  // support both (options, callback) and (callback).
  if (!credentialRequestCompleteCallback && typeof options === 'function') {
    credentialRequestCompleteCallback = options;
    options = {};
  }

  const config = ServiceConfiguration.configurations.findOne({service: 'lea'});
  if (!config || !config.dialogUrl) {
    credentialRequestCompleteCallback && credentialRequestCompleteCallback(
      new ServiceConfiguration.ConfigError());
    return;
  }

  const credentialToken = Random.secret();
  const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent);
  const display = mobile ? 'touch' : 'popup';

  let scope = "email";
  if (options && options.requestPermissions)
    scope = options.requestPermissions.join(',');

  const loginStyle = OAuth._loginStyle('lea', config, options);

  let loginUrl =
    `${config.dialogUrl}?client_id=${encodeURIComponent(config.appId)}` +
    `&redirect_uri=${encodeURIComponent(config.redirectUri)}` +
    `&display=${encodeURIComponent(display)}&scope=${encodeURIComponent(scope)}` +
    `&response_type=code` +
    `&state=${OAuth._stateParam(loginStyle, credentialToken, options && options.redirectUrl)}`;

  // Handle authentication type (e.g. for force login you need auth_type: "reauthenticate")
  if (options && options.auth_type) {
    loginUrl += `&auth_type=${encodeURIComponent(options.auth_type)}`;
  }

  OAuth.launchLogin({
    loginService: "lea",
    loginStyle,
    loginUrl,
    credentialRequestCompleteCallback,
    credentialToken,
  });
};