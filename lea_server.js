Lea = {};
import crypto from 'crypto';

const settings = Meteor.settings.oauth.lea
const auth_access_token_url = settings.accessTokenUrl
const auth_identity_url = settings.identityUrl

Lea.handleAuthFromAccessToken = (accessToken, expiresAt) => {
  // include basic fields from lea
  const whitelisted = ['id', 'email', 'name', 'first_name', 'last_name',
    'middle_name', 'name_format', 'picture', 'short_name'];

  const identity = getIdentity(accessToken, whitelisted);

  const fields = {};
  whitelisted.forEach(field => fields[field] = identity[field]);
  const serviceData = {
    accessToken,
    expiresAt,
    ...fields,
  };

  return {
    serviceData,
    options: {profile: {name: identity.name}}
  };
};

OAuth.registerService('lea', 2, null, query => {
  const response = getTokenResponse(query);
  const { accessToken } = response;
  const { expiresIn } = response;

  return Lea.handleAuthFromAccessToken(accessToken, (+new Date) + (1000 * expiresIn));
});

// checks whether a string parses as JSON
const isJSON = str => {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

// returns an object containing:
// - accessToken
// - expiresIn: lifetime of token in seconds
const getTokenResponse = query => {
  const config = ServiceConfiguration.configurations.findOne({service: 'lea'});
  if (!config)
    throw new ServiceConfiguration.ConfigError();

  let responseContent;
  try {
    // Request an access token
    responseContent = HTTP.get(
      auth_access_token_url, {
        params: {
          client_id: config.appId,
          redirect_uri: OAuth._redirectUri('lea', config),
          client_secret: OAuth.openSecret(config.secret),
          code: query.code
        }
      }).data;
  } catch (err) {
    throw Object.assign(
      new Error(`Failed to complete OAuth handshake with Lea. ${err.message}`),
      { response: err.response },
    );
  }

  const accessToken = responseContent.access_token;
  const tokenExpires = responseContent.expires_in;

  if (!accessToken) {
    throw new Error("Failed to complete OAuth handshake with lea " +
      `-- can't find access token in HTTP response. ${responseContent}`);
  }
  return {
    accessToken: accessToken,
    expiresIn: tokenExpires
  };
};

const getIdentity = (accessToken, fields) => {
  const config = ServiceConfiguration.configurations.findOne({service: 'lea'});
  if (!config)
    throw new ServiceConfiguration.ConfigError();

  // Generate app secret proof that is a sha256 hash of the app access token, with the app secret as the key
  const hmac = crypto.createHmac('sha256', OAuth.openSecret(config.secret));
  hmac.update(accessToken);

  try {
    return HTTP.get(auth_identity_url, {
      params: {
        access_token: accessToken,
        appsecret_proof: hmac.digest('hex'),
        fields: fields.join(",")
      }
    }).data;
  } catch (err) {
    throw Object.assign(
      new Error(`Failed to fetch identity from Lea. ${err.message}`),
      { response: err.response },
    );
  }
};

Lea.retrieveCredential = (credentialToken, credentialSecret) =>
  OAuth.retrieveCredential(credentialToken, credentialSecret);

