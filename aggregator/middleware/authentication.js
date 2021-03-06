var debug = require('debug')('middleware:authentication')
var verifyJwt = require('byu-jwt')

verifyJwt.cacheWellknowns = true

const API_WELL_KNOWN = 'https://api.byu.edu/.well-known/openid-configuration'

module.exports.init = function (opts) {
  const BYPASS_AUTH = opts.bypassAuthentication

  return function (req, res, next) {
    debug('originalUrl: ' + req.url)
    debug('request method: ' + req.method)
    debug('request headers: ' + JSON.stringify(req.headers, null, 2))
    if (['GET', 'POST', 'PUT', 'DELETE'].find(m => m === req.method) === undefined) {
      debug('skipping auth check for \'' + req.method + '\' method')
      return next()
    }
    if (req.method === 'POST' && req.headers['x-amz-sns-topic-arn']) {
      // SNS Response webhook call - always allow
      debug('Skipping auth check for webhook \'' + req.headers['x-amz-sns-topic-arn'] + '\'')
      return next()
    }
    if (req.originalUrl === '/') {
      // skip auth check for health check url
      debug('Skipping auth check for health check')
      return next()
    }
    var currentToken = req.headers[verifyJwt.BYU_JWT_HEADER_CURRENT]
    var originalToken = req.headers[verifyJwt.BYU_JWT_HEADER_ORIGINAL]
    debug(JSON.stringify(req.headers, null, 2))
    if (!BYPASS_AUTH && !currentToken) {
      debug('no JWT present')
      res.setHeader('X-Received-JWT', false)
      return res.status(401).end(JSON.stringify({statusCode: 401, message: 'Access Error\n' + 'No Authentication token found'}))
    }

    const setUserData = function (data) {
      debug('valid JWT')
      debug(data)
      try {
        var user = {
          personId: data.byu.resourceOwner.personId,
          netId: data.byu.resourceOwner.netId,
          byuId: data.byu.resourceOwner.byuId
        }
        debug('user: ' + JSON.stringify(user))
        req.byu = req.byu || {}
        req.byu.user = user
      } catch (err) {
        debug('Valid user data not found in JWT!')
        res.status(403).end(JSON.stringify({statusCode: 403, message: 'Access Error\nUser data not found in JWT.'}))
      }
      next()
    }

    const rejectRequest = function (data) {
      debug('Invalid JWT', this.jwt)
      debug(data)
      res.setHeader('X-Invalid-JWT', this.jwt)
      res.status(403).end(JSON.stringify({statusCode: 403, message: 'Access Error\n' + 'No Authentication Token provided or Invalid Authentication Token found'}))
    }

    if (currentToken) {
      debug('Found current jwt')
      const currPromise = verifyJwt.jwtDecoded(currentToken, API_WELL_KNOWN)

      if (originalToken) {
        debug('Found original jwt')
        const origPromise = verifyJwt.jwtDecoded(originalToken, API_WELL_KNOWN)
        currPromise.then(function () {
          origPromise.then(setUserData).catch(rejectRequest.bind({jwt: originalToken}))
        })
        .catch(rejectRequest.bind({jwt: currentToken}))
      } else {
        currPromise.then(setUserData).catch(rejectRequest.bind({jwt: currentToken}))
      }
    } else {
      res.setHeader('X-Received-JWT', false)
      next()
    }
  }
}
