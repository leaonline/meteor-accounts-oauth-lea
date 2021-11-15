# Meteor OAuth lea

OAuth service configuration and handling for logging in with lea (your custom OAuth server).

This package will be automatically added by adding lea accounts via

```bash
$ meteor leaonline:accounts-lea
```

## Define the ServiceConfig

If you want to login in with lea your client app needs to define the `ServiceConfiguration`:

```javascript
/* global ServiceConfiguration */
import { Meteor } from 'meteor/meteor'

Meteor.startup(() => {
  const { oauth } = Meteor.settings
  ServiceConfiguration.configurations.upsert(
    { service: 'lea' }, // required
    {
      $set: {
        // required fields:
        loginStyle: 'popup',
        clientId: oauth.clientId,
        secret: oauth.secret,
        dialogUrl: oauth.dialogUrl,
        accessTokenUrl: oauth.accessTokenUrl,
        identityUrl: oauth.identityUrl,
        redirectUrl: oauth.redirectUrl,
        // additional fields injected into profile
        // optional; these are just examples:
        identity: [
          'firstName',
           'lastName',
        ],       
        
        // additional fields, injected into user.services.lea
        // optional; these are just examples:
        extraFields: [
          'roles'
        ]
      }
    }
  )
})
```

## License

MIT, see [license file](./LICENSE)

