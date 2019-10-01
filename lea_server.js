/* global Lea, ServiceConfiguration */
import { Meteor } from 'meteor/meteor'
import { OAuth } from 'meteor/oauth'
import { HTTP } from 'meteor/http'
import { WebApp } from 'meteor/webapp'

Lea = Lea || {}

const settings = Meteor.settings.oauth.lea

let userAgent = 'Meteor'
if (Meteor.release) {
  userAgent += `/${Meteor.release}`
}

OAuth.registerService('lea', 2, null, query => {
  console.log('lea service', query)
  const accessToken = getAccessToken(query)
  const identity = getIdentity(accessToken)
  return {
    serviceData: {
      id: identity.id,
      accessToken: OAuth.sealSecret(accessToken),
      email: identity.email || '',
      username: identity.login
    },
    options: { profile: { name: identity.name } }
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
  console.log('[Accounts lea]: getAccessToken', settings.accessTokenUrl)
  try {
    response = HTTP.post(settings.accessTokenUrl, options)
  } catch (err) {
    throw Object.assign(new Error(`Failed to complete OAuth handshake with lea. ${err.message}`), { response: err.response })
  }

  // if the http response was a json object with an error attribute
  if (response.data.error) {
    throw new Error(`Failed to complete OAuth handshake with lea. ${response.data.error}`)
  } else {
    return response.data.access_token
  }
}

const getIdentity = accessToken => {
  try {
    return HTTP.get(
      settings.identityUrl, {
        headers: { 'User-Agent': userAgent },
        params: { access_token: accessToken }
      }).data
  } catch (err) {
    throw Object.assign(
      new Error(`Failed to fetch identity from lea. ${err.message}`),
      { response: err.response }
    )
  }
}

Lea.retrieveCredential = (credentialToken, credentialSecret) => OAuth.retrieveCredential(credentialToken, credentialSecret)
