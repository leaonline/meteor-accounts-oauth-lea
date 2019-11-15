/* global ServiceConfiguration */
import { Meteor } from 'meteor/meteor'
import { OAuth } from 'meteor/oauth'
import { HTTP } from 'meteor/http'

global.Lea = global.Lea || {}

let userAgent = 'Meteor'
if (Meteor.release) {
  userAgent += `/${Meteor.release}`
}

OAuth.registerService('lea', 2, null, query => {
  const config = ServiceConfiguration.configurations.findOne({ service: 'lea' })
  if (!config) {
    throw new ServiceConfiguration.ConfigError()
  }

  const accessToken = getAccessToken(query)
  const identity = getIdentity(accessToken)
  const sealedToken = OAuth.sealSecret(accessToken)

  const profile = {}
  ;(config.identity || []).forEach(key => {
    profile[key] = identity[key]
  })

  return {
    serviceData: {
      id: identity.id,
      accessToken: sealedToken,
      email: identity.email || '',
      username: identity.login
    },
    options: { profile }
  }
})

const getAccessToken = query => {
  const config = ServiceConfiguration.configurations.findOne({ service: 'lea' })
  if (!config) {
    throw new ServiceConfiguration.ConfigError()
  }

  let response
  const options = {
    headers: {
      Accept: 'application/json',
      'User-Agent': userAgent
    },
    params: {
      code: query.code,
      client_id: config.clientId,
      client_secret: OAuth.openSecret(config.secret),
      redirect_uri: OAuth._redirectUri('lea', config),
      state: query.state,
      grant_type: 'authorization_code'
    }
  }

  try {
    response = HTTP.post(config.accessTokenUrl, options)
  } catch (err) {
    throw Object.assign(new Error(`Failed to complete OAuth handshake with lea. ${err.message}`), { response: err.response })
  }

  // if the http response was a json object with an error attribute
  if (response.data && response.data.error) {
    throw new Error(`Failed to complete OAuth handshake with lea. ${response.data.error}`)
  } else {
    return response.data.access_token
  }
}

const getIdentity = (accessToken) => {
  const config = ServiceConfiguration.configurations.findOne({ service: 'lea' })
  if (!config) {
    throw new ServiceConfiguration.ConfigError()
  }

  let response
  const options = {
    headers: { Accept: 'application/json', 'User-Agent': userAgent, Authorization: `Bearer ${accessToken}` }
  }

  try {
    response = HTTP.get(config.identityUrl, options)
  } catch (err) {
    throw Object.assign(
      new Error(`Failed to fetch identity from lea. ${err.message}`),
      { response: err.response }
    )
  }

  return response && response.data
}

global.Lea.retrieveCredential = (credentialToken, credentialSecret) => OAuth.retrieveCredential(credentialToken, credentialSecret)
