const dashboard = require('@userappstore/dashboard')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.stripeid) {
      throw new Error('invalid-stripeid')
    }
    const stripeAccount = await global.api.user.connect.StripeAccount._get(req)
    if (!stripeAccount) {
      throw new Error('invalid-stripeid')
    }
    let payoutids
    if (req.query.all) {
      payoutids = await dashboard.StorageList.listAll(`${req.appid}/stripeAccount/payouts/${req.query.stripeid}`)
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      payoutids = await dashboard.StorageList.list(`${req.appid}/stripeAccount/payouts/${req.query.stripeid}`, offset)
    }
    if (!payoutids || !payoutids.length) {
      return
    }
    const payouts = []
    for (const payoutid of payoutids) {
      req.query.payoutid = payoutid
      const payout = await global.api.administrator.connect.Payout._get(req)
      payouts.push(payout)
    }
    return payouts
  }
}
