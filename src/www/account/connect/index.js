const dashboard = require('@userappstore/dashboard')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  const stripeAccounts = await global.api.user.connect.StripeAccounts._get(req)
  const company = []
  let individual
  if (stripeAccounts && stripeAccounts.length) {
    for (const stripeAccount of stripeAccounts) {
    stripeAccount.createdFormatted = dashboard.Timestamp.date(stripeAccount.created)
      if (stripeAccount.payouts_enabled) {
        stripeAccount.statusMessage = 'verified'
      } else if (stripeAccount.verification.disabled_reason) {
        stripeAccount.statusMessage = `${stripeAccount.verification.disabled_reason}`
      } else if (stripeAccount.verification.details_code) {
        stripeAccount.statusMessage = `${stripeAccount.verification.details_code}`
      } else if (stripeAccount.metadata.submitted) {
        stripeAccount.statusMessage = 'under-review'
      } else {
        stripeAccount.statusMessage = 'not-submitted'
      }
      if (stripeAccount.legal_entity.type === 'individual') {
        individual = stripeAccount
      } else {
        company.push(stripeAccount)
      }
    }
  }
  req.data = { stripeAccounts, individual, company }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.route.html)
  const removeElements = []
  if (req.data.stripeAccounts && req.data.stripeAccounts.length) {
    if (req.data.individual) {
      dashboard.HTML.renderTemplate(doc, req.data.individual, 'stripe-account-row', 'individual-accounts-table')
      doc.getElementById('create-individual-link').setAttribute('disabled', 'disabled')
    } else {
      removeElements.push('individual-container')
    }
    if (req.data.company && req.data.company.length) {
      dashboard.HTML.renderTable(doc, req.data.company, 'stripe-account-row', 'company-accounts-table')
    } else {
      removeElements.push('company-container')
    }
    for (const stripeAccount of req.data.stripeAccounts) {
      if (stripeAccount.statusMessage) {
        dashboard.HTML.renderTemplate(doc, null, stripeAccount.statusMessage, `registration-status-${stripeAccount.id}`)
      }
    }
  } else {
    removeElements.push('individual-container', 'company-container')
  }
  for (const field of removeElements) {
    const element = doc.getElementById(field)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
