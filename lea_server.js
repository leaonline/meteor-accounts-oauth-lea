/* global ServiceConfiguration, Lea */
import { Meteor } from 'meteor/meteor'
import { OAuth } from 'meteor/oauth'

// eslint-disable-next-line
Lea = Lea || {}

let userAgent = 'Meteor'
if (Meteor.release) {
  userAgent += `/${Meteor.release}`
}

OAuth.registerService('lea', 2, null, async query => {
  const config = await ServiceConfiguration.configurations.findOneAsync({ service: 'lea' })
  if (!config) {
    throw new ServiceConfiguration.ConfigError()
  }
  const debug = config.debug
    ? (...args) => console.debug('[accounts-oauth-lea]:', ...args)
    : () => {}

  debug('run lea Oauth handler')

  const accessToken = await getAccessToken({ query, config, debug })
  debug('access token', accessToken)

  const identity = await getIdentity({ accessToken, config, debug })
  debug('identity', identity)

  const sealedToken = OAuth.sealSecret(accessToken)
  debug('sealed token', sealedToken)

  const profile = {}
  ;(config.identity || []).forEach(key => {
    profile[key] = identity[key]
  })
  debug('profile', profile)

  // we can now define in ServiceConfig additional fields that will not be saved
  // in user.profile but directly in the service data!
  const extraFields = {}
  ;(config.extraFields || []).forEach(key => {
    extraFields[key] = identity[key]
  })
  debug('extra fields', extraFields)

  return {
    serviceData: {
      id: identity.id,
      accessToken: sealedToken,
      email: identity.email || '',
      username: identity.login,
      ...extraFields
    },
    options: { profile }
  }
})

const getAccessToken = async ({ query, config, debug }) => {
  let response
  try {
    const body = {
      code: query.code,
      client_id: config.clientId,
      client_secret: OAuth.openSecret(config.secret),
      redirect_uri: OAuth._redirectUri('lea', config),
      state: query.state,
      grant_type: 'authorization_code'
    }
    debug('fetch access token', config.accessTokenUrl, 'POST', body)
    const request = await fetch(config.accessTokenUrl, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        Accept: 'application/json',
        'User-Agent': userAgent,
        'Content-Type': 'application/json'
      }
    })
    response = await request.json()
  } catch (err) {
    throw new Meteor.Error(
      'OAuth Failed',
      `Failed to complete OAuth handshake with lea. ${err.message}`,
      { response: err.response }
    )
  }

  // if the http response was a json object with an error attribute
  // we also need to process it as error
  if (response.error) {
    throw new Error(`Failed to complete OAuth handshake with lea. ${response.error}`)
  }
  else {
    return response.access_token
  }
}

const getIdentity = async ({ accessToken, config, debug }) => {
  try {
    const request = await fetch(config.identityUrl, {
      methods: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': userAgent,
        Authorization: `Bearer ${accessToken}`
      }
    })
    return await request.json()
  } catch (err) {
    const errorResponse = err.response
    throw new Meteor.Error(errorResponse.statusCode || '500', 'lea.oauth.getIdentity.failed', errorResponse)
  }
}

Lea.retrieveCredential = (credentialToken, credentialSecret) =>
  OAuth.retrieveCredential(credentialToken, credentialSecret)
