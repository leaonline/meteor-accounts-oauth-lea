/* eslint-env meteor */
Package.describe({
  name: 'leaonline:oauth-lea',
  version: '1.0.2',
  // Brief, one-line summary of the package.
  summary: 'OAuth package to provide authorizaiton code login with lea',
  // URL to the Git repository containing the source code for this package.
  git: 'git@github.com:leaonline/meteor-accounts-oauth-lea.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
})

Package.onUse(api => {
  api.use('ecmascript@0.12.7', ['client', 'server'])
  api.use('oauth2@1.2.1', ['client', 'server'])
  api.use('oauth@1.2.8', ['client', 'server'])
  api.use('http@1.4.2', ['server'])
  api.use('random@1.1.0', 'client')
  api.use('service-configuration@1.0.11', ['client', 'server'])

  api.addFiles('lea_client.js', 'client')
  api.addFiles('lea_server.js', 'server')

  api.export('Lea')
})
