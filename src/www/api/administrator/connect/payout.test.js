// /* eslint-env mocha */
// const assert = require('assert')
// const TestHelper = require('../../../../../test-helper.js')

// describe('/api/administrator/connect/payout', () => {
//   describe('Payout#GET', () => {
//     it('should reject invalid payoutid', async () => {
//       const administrator = await TestHelper.createAdministrator()
//       const req = TestHelper.createRequest(`/api/administrator/connect/payout?payoutid=invalid`)
//       req.account = administrator.account
//       req.session = administrator.session
//       const payout = await req.get()
//       assert.strictEqual(payout.message, 'invalid-payoutid')
//     })

//     it('should return payout data', async () => {
//       const administrator = await TestHelper.createAdministrator()
//       const user = await TestHelper.createUser()
//       await TestHelper.createStripeAccount(user, { type: 'individual', country: 'US' })
//       await TestHelper.createStripeRegistration(user, { city: 'New York City', postal_code: '10001', personal_id_number: '000000000', line1: 'First Street', day: '1', month: '1', year: '1950', state: 'New York', ssn_last_4: '0000' })
//       await TestHelper.createExternalAccount(user, { currency: 'usd', country: 'US', account_holder_name: `${user.profile.firstName} ${user.profile.lastName}`, account_type: 'individual', account_number: '000123456789', routing_number: '110000000' })
//       await TestHelper.submitStripeAccount(user)
//       await TestHelper.createPayout(user)
//       await TestHelper.waitForPayout(user.stripeAccount.id, null)
//       const req = TestHelper.createRequest(`/api/administrator/connect/payout?payoutid=${user.payout.id}`)
//       req.account = administrator.account
//       req.session = administrator.session
//       const payout = await req.get()
//       assert.strictEqual(payout.id, user.payout.id)
//     })
//   })
// })
