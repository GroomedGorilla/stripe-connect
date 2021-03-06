const countriesIndex = require('../../../../countries-index.json')
const dashboard = require('@userappstore/dashboard')
const navbar = require('./navbar-stripe-account.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.stripeid) {
    throw new Error('invalid-stripeid')
  }
  if (req.session.lockURL === req.url && req.session.unlocked) {
    try {
      await global.api.user.connect.UpdatePaymentInformation._patch(req)
    } catch (error) {
      req.error = error.message
    }
  }
  const stripeAccount = await global.api.user.connect.StripeAccount._get(req)
  if (stripeAccount.metadata.accountid !== req.account.accountid) {
    throw new Error('invalid-stripe-account')
  }
  const stripeCountries = await global.api.user.connect.CountrySpecs._get(req)
  let countrySpec
  for (const country of stripeCountries) {
    country.name = countriesIndex[country.id]
    if (country.id === stripeAccount.country) {
      countrySpec = country
    }
  }
  if (!countrySpec) {
    throw new Error(`invalid-country-${stripeAccount.country}`)
  }
  const currencies = []
  for (const currency in countrySpec.supported_bank_account_currencies) {
    currencies.push({ name: currency.toUpperCase(), currency, object: 'currency' })
  }
  const countries = []
  for (const country of stripeCountries) {
    countries.push({ name: countriesIndex[country.id], code: country.id, object: 'country' })
  }
  req.data = { stripeAccount, stripeCountries, countries, currencies, countrySpec }
}

async function renderPage (req, res, messageTemplate) {
  if (req.success) {
    if (req.query && req.query.returnURL) {
      return dashboard.Response.redirect(req, res, req.query.returnURL)
    }
    messageTemplate = 'success'
  } else if (req.error) {
    messageTemplate = req.error
  }
  const doc = dashboard.HTML.parse(req.route.html, req.data.stripeAccount, 'stripeAccount')
  navbar.setup(doc, req.data.stripeAccount, req.data.countrySpec)
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate === 'success') {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      return dashboard.Response.end(req, res, doc)
    }
  }
  req.body = req.body || {}
  if (req.data.stripeAccount.legal_entity.type === 'company') {
    if (!req.body.company) {
      doc.getElementById('company').setAttribute('checked', 'checked')
    }
  } else {
    if (!req.body.individual) {
      doc.getElementById('individual').setAttribute('checked', 'checked')
    }
  }
  const selectedCountry = req.body.country || req.data.countrySpec.id
  for (const country of req.data.stripeCountries) {
    if (country.id !== selectedCountry) {
      const countryContainer = doc.getElementById(`${country.id}-container`)
      countryContainer.parentNode.removeChild(countryContainer)
    }
  }
  dashboard.HTML.renderList(doc, req.data.countries, 'country-option', 'country')
  dashboard.HTML.renderList(doc, req.data.currencies, 'currency-option', 'currency')
  for (const fieldName in req.body) {
    const el = doc.getElementById(fieldName)
    if (!el) {
      continue
    }
    switch (el.tag) {
      case 'select':
        if (fieldName === 'country') {
          dashboard.HTML.setSelectedOptionByValue(doc, el.attr.id, req.body[fieldName] || req.data.countrySpec.id)
        } else {
          dashboard.HTML.setSelectedOptionByValue(doc, el.attr.id, req.body[fieldName])
        }
        continue
      case 'input':
        if (el.attr.type === 'radio' || el.attr.type === 'checkbox') {
          el.attr.checked = 'checked'
        } else {
          el.attr.value = req.body[fieldName]
        }
        continue
    }
  }
  if (!req.body.account_type || req.body.account_type === 'individual') {
    doc.getElementById('individual').setAttribute('checked', 'checked')
  } else {
    doc.getElementById('company').setAttribute('checked', 'checked')
  }
  if (req.data.countrySpec && !req.body.country) {
    dashboard.HTML.setSelectedOptionByValue(doc, 'country', req.data.countrySpec.id)
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (!req.body || req.body.refresh === 'true') {
    return renderPage(req, res)
  }
  try {
    await global.api.user.connect.UpdatePaymentInformation._patch(req)
    if (req.success) {
      return renderPage(req, res, 'success')
    }
    return dashboard.Response.redirect(req, res, '/account/authorize')
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
