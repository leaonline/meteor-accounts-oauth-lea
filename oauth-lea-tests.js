// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from 'meteor/tinytest'

// Import and rename a variable exported by oauth-lea.js.
import { name as packageName } from 'meteor/leaonline:oauth-lea'

// Write your tests here!
// Here is an example.
Tinytest.add('oauth-lea - example', function (test) {
  test.equal(packageName, 'oauth-lea')
})
