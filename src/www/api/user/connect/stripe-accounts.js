const dashboard = require('@userappstore/dashboard')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    if (req.query.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    let stripeids
    if (req.query.all) {
      stripeids = await dashboard.StorageList.listAll(`${req.appid}/account/stripeAccounts/${req.query.accountid}`)
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) || 0 : 0
      stripeids = await dashboard.StorageList.list(`${req.appid}/account/stripeAccounts/${req.query.accountid}`, offset)
    }
    if (!stripeids || !stripeids.length) {
      return null
    }
    const stripeAccounts = []
    for (const stripeid of stripeids) {
      req.query.stripeid = stripeid
      const stripeAccount = await global.api.user.connect.StripeAccount._get(req)
      if (!stripeAccount) {
        throw new Error('invalid-stripeid')
      }
      stripeAccounts.push(stripeAccount)
    }
    return stripeAccounts
  }
}
