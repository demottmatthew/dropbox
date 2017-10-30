/*
 * authenticated-api.js -- REST Endpoints requiring authentication for use.
 */
'use strict'

const router = require('express').Router()
const db = require('./db')
const nodemailer = require('nodemailer')
const transporter = nodemailer.createTransport({
  host: 'mail.cock.li',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: 'BrandCentralStation@firemail.cc', // generated ethereal user
    pass: 'brandcentral' // generated ethereal password
  }
})

/**
 * @api {post} api/profile/:id Update user information
 * @apiName UpdateProfile
 * @apiGroup User
 *
 * @apiParam {Number} id User's unique ID
 *
 * @apiSuccess {Boolean} success true
 * @apiError   {Boolean} success false
 * @apiError   {String}  message Error message
 */
router.post('/api/profile/:id', async (req, res) => {
  const queryData = req.body
  queryData.id = req.params.id

  if (parseInt(req.params.id, 10) === parseInt(req.session.userId, 10)) {
    try {
      await db.updateProfile(queryData)
      res.send({
        success: true
      })
    } catch (e) {
      res.send({
        success: false,
        message: e.message
      })
    }
  } else {
    res.send({
      success: false,
      message: 'Insufficient permissions'
    })
  }
})

/**
 * @api {get} api/profile/:id Get user information
 * @apiName GetProfile
 * @apiGroup User
 *
 * @apiParam {Number} id User's unique ID
 *
 * @apiSuccess {Boolean} success   true
 * @apiSuccess {Object}  user      Profile data
 * @apiSuccess {String}  firstName User's first name
 * @apiSuccess {String}  lastName  User's last name
 * @apiSuccess {String}  username  User's username
 * @apiSuccess {String}  emailHash An MD5 hash of the user's email
 * @apiError   {Boolean} success   false
 * @apiError   {String}  message   Error message
 */
router.get('/api/profile/:id', async (req, res) => {
  try {
    res.send({
      success: true,
      user: await db.getProfileData(req.params.id)
    })
  } catch (e) {
    res.send({
      success: false,
      message: e.message
    })
  }
})

/**
 * @api {get} api/logout Log out of account
 * @apiName Logout
 * @apiGroup Login/Logout
 *
 * @apiSuccess {Boolean} success true
 * @apiError   {Boolean} success false
 * @apiError   {String}  message Error message
 */
router.get('/api/logout', async (req, res) => {
  try {
    await db.updateLastSeen(req.session.id)
    req.session.destroy()
    res.send({
      success: true,
      message: 'Logged out'
    })
  } catch (e) {
    res.send({
      success: false,
      message: e.message
    })
  }
})

/**
 * @api {put} api/user/:id/email Change email
 * @apiName ChangeEmail
 * @apiGroup User
 *
 * @apiParam {Number} id User's ID
 * @apiParam {Object} body Email change information
 * @apiParam {String} email New email address
 * @apiParam {String} password User's password
 *
 * @apiSuccess {Boolean} success true
 * @apiError   {Boolean} success false
 * @apiError   {String}  message Error message
 */
router.put('/api/user/:id/email', async (req, res) => {
  if (parseInt(req.params.id, 10) !== parseInt(req.session.userId, 10)) {
    res.send({
      success: false,
      message: 'Insufficient permissions'
    })
    return
  }

  try {
    const results = await db.checkNewEmail(req.session.userId, req.body)
    const OldEmail = {
      from: '"Brand Central Station" <BrandCentralStation@firemail.cc>', // sender address
      to: results.email,
      subject: 'Email Change Notification', // Subject line
      text: 'Hello, we noticed that your email has been changed on your account. Please contact us if this was not you.' // plain text body
    }

    const NewVerifyEmail = {
      from: '"Brand Central Station" <BrandCentralStation@firemail.cc>', // sender address
      to: req.body.email,
      subject: 'Email Verification', // Subject line
      text: `Hello, please click this link to verify your new email: http://localhost:8080/verify?token=${results.token}\n` // plain text body
    }

    transporter.sendMail(OldEmail, (error, info) => {
      if (error) {
        return console.log(error)
      }

      transporter.sendMail(NewVerifyEmail, (error, info) => {
        if (error) {
          return console.log(error)
        }
      })
    })

    res.send({
      success: true
    })
  } catch (e) {
    console.log(e)
    console.log(e.message)
    res.send({
      success: false,
      message: e.message
    })
  }
})

/**
 * @api {post} api/user/:id/channels Set a user's channels
 * @apiName SetChannels
 * @apiGroup User
 *
 * @apiParam {Number}   id User's ID
 * @apiParam {Number[]} channels List of channels to set
 *
 * @apiSuccess {Boolean} success true
 * @apiError   {Boolean} success false
 * @apiError   {String}  message Error message
 */
router.post('/api/user/:id/channels', async (req, res) => {
  try {
    await db.storeUserChannels(req.params.id, req.body.channels)
    res.send({
      success: true
    })
  } catch (e) {
    res.send({
      success: false,
      message: e.message
    })
  }
})

/**
 * @api {get} api/user/:id/channels Get a user's channels
 * @apiName GetChannels
 * @apiGroup User
 *
 * @apiParam {Number} id User's ID
 *
 * @apiSuccess {Boolean} success true
 * @apiError   {Boolean} success false
 * @apiError   {String}  message Error message
 */
router.get('/api/user/:id/channels', async (req, res) => {
  try {
    if (parseInt(req.params.id, 10) === parseInt(req.session.userId, 10)) {
      const channels = await db.retrieveUserChannels(req.params.id)
      res.send({
        success: true,
        channels
      })
    } else {
      throw new Error('Unauthorized')
    }
  } catch (e) {
    res.send({
      success: false,
      message: e.message
    })
  }
})

/**
 * @api {get} api/product/random Get a random product
 * @apiName GetRandomProduct
 * @apiGroup Product
 *
 * @apiParam {Number} channelId ID of a channel (query)
 *
 * @apiSuccess {Boolean} success     true
 * @apiSuccess {Object}  product     Product object
 * @apiSuccess {Number}  id          Product ID
 * @apiSuccess {String}  name        Name of the product
 * @apiSuccess {String}  description Description of the product
 * @apiSuccess {String}  pictureUrl  URL pointing at the product picture
 * @apiSuccess {String}  productUrl  URL pointing at a webpage for the product
 * @apiSuccess {String}  model       Model number of the product
 * @apiError   {Boolean} success     false
 * @apiError   {String}  message     Error message
 */
router.get('/api/product/random', async (req, res) => {
  try {
    res.send({
      success: true,
      product: await db.getRandomProduct(req.query.channelId)
    })
  } catch (e) {
    res.send({
      success: false,
      message: e.message
    })
  }
})

/**
 * @api {get} api/product/:id Get a product by its ID
 * @apiName GetProduct
 * @apiGroup Product
 *
 * @apiParam {Number} id Product ID
 *
 * @apiSuccess {Boolean} success     true
 * @apiSuccess {String}  name        Name of the product
 * @apiSuccess {String}  description Description of the product
 * @apiSuccess {String}  pictureUrl  URL pointing at the product picture
 * @apiSuccess {String}  productUrl  URL pointing at a webpage for the product
 * @apiSuccess {String}  model       Model number of the product
 * @apiError   {Boolean} success     false
 * @apiError   {String}  message     Error message
 */
router.get('/api/product/:id', async (req, res) => {
  try {
    res.send({
      success: true,
      product: await db.getProduct(req.params.id)
    })
  } catch (e) {
    res.send()
  }
})

/**
 * @api {post} api/product/like/:id Like a product
 * @apiName LikeProduct
 * @apiGroup Product
 *
 * @apiParam {Number} id Product ID
 *
 * @apiSuccess {Boolean} success true
 * @apiError   {Boolean} success false
 * @apiError   {String}  message Error message
 */
router.post('/api/product/like/:id', async (req, res) => {
  try {
    await db.likeProduct(req.session.userId, req.params.id)
    res.send({
      success: true
    })
  } catch (e) {
    res.send({
      success: false,
      message: e.message
    })
  }
})

/**
 * @api {post} api/product/dislike/:id Dislike a product
 * @apiName DislikeProduct
 * @apiGroup Product
 *
 * @apiParam {Number} id Product ID
 *
 * @apiSuccess {Boolean} success true
 * @apiError   {Boolean} success false
 * @apiError   {String}  message Error message
 */
router.post('/api/product/dislike/:id', async (req, res) => {
  try {
    await db.dislikeProduct(req.session.userId, req.params.id)
    res.send({
      success: true
    })
  } catch (e) {
    res.send({
      success: false,
      message: e.message
    })
  }
})

/**
 * @api {post} api/user/follow/:id Follow a user
 * @apiName FollowUser
 * @apiGroup User
 *
 * @apiParam {Number} id User to follow
 *
 * @apiSuccess {Boolean} success true
 * @apiError   {Boolean} success false
 * @apiError   {String}  message Error message
 * TODO: Rename to POST /api/user/:followee/followers/:follower
 */
router.post('/api/user/follow/:id', async (req, res) => {
  try {
    await db.followUser(req.session.userId, req.params.id)
    res.send({
      success: true
    })
  } catch (e) {
    res.send({
      success: false,
      message: e.message
    })
  }
})

/**
 * @api {post} api/user/unfollow/:id Unfollow a user
 * @apiName UnfollowUser
 * @apiGroup User
 *
 * @apiParam {Number} id User to unfollow
 *
 * @apiSuccess {Boolean} success true
 * @apiError   {Boolean} success false
 * @apiError   {String}  message Error message
 * TODO: Rename to DELETE /api/user/:followee/followers/:follower
 */
router.post('/api/user/unfollow/:id', async (req, res) => {
  try {
    await db.unfollowUser(req.session.userId, req.params.id)
    res.send({
      success: true
    })
  } catch (e) {
    res.send({
      success: false,
      message: e.message
    })
  }
})

/**
 * @api {get} api/user/unfollow/:id Unfollow a user
 * @apiName UnfollowUser
 * @apiGroup User
 *
 * @apiParam {Number} id User to unfollow
 *
 * @apiSuccess {Boolean} success true
 * @apiError   {Boolean} success false
 * @apiError   {String}  message Error message
 */
router.get('/api/user/following/:id', async (req, res) => {
  try {
    res.send({
      success: true,
      following: await db.getFollowing(req.params.id)
    })
  } catch (e) {
    res.send({
      success: false,
      message: e.message
    })
  }
})

/**
 * @api {post} api/channels/unsubscribe/:cid Unsubscribe from a channel
 * @apiName Unsubscribe
 * @apiGroup Channel
 *
 * @apiParam {Number} cid Channel to unsubscribe from
 *
 * @apiSuccess {Boolean} success true
 * @apiError   {Boolean} success false
 * @apiError   {String}  message Error message
 */
router.post('/api/channels/unsubscribe/:cid', async (req, res) => {
  try {
    await db.unsubscribeChannel(req.session.userId, req.params.cid)
    res.send({
      success: true
    })
  } catch (e) {
    res.send({
      success: false,
      message: e.message
    })
  }
})

/**
 * @api {post} api/channels/subscribe/:cid Subscribe to a channel
 * @apiName Subscribe
 * @apiGroup Channel
 *
 * @apiParam {Number} cid Channel to subscribe to
 *
 * @apiSuccess {Boolean} success true
 * @apiError   {Boolean} success false
 * @apiError   {String}  message Error message
 */
router.post('/api/channels/subscribe/:cid', async (req, res) => {
  try {
    await db.subscribeChannel(req.session.userId, req.params.cid)
    res.send({
      success: true
    })
  } catch (e) {
    res.send({
      success: false,
      message: e.message
    })
  }
})

/**
 * @api {get} api/channel/:id Get a channel
 * @apiName GetChannel
 * @apiGroup Channel
 *
 * @apiParam {Number} id Channel to retrieve
 *
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object}  channel Channel information object
 * @apiSuccess {Number}  id      Channel ID
 * @apiSuccess {String}  name    Channel name
 * @apiError   {Boolean} success false
 * @apiError   {String}  message Error message
 */
router.get('/api/channels/:id', async (req, res) => {
  try {
    res.send({
      success: true,
      channel: await db.getChannel(req.params.id)
    })
  } catch (e) {
    res.send({
      success: false,
      message: e.message
    })
  }
})

/**
 * @api {get} api/user/likedproducts/:id Get a user's liked products
 * @apiName GetChannel
 * @apiGroup Channel
 *
 * @apiParam {Number} id          User's ID
 * @apiParam {Number} page        Page number (query)
 * @apiParam {Number} productsPer Products per page (query)
 *
 * @apiSuccess {Boolean}  success     true
 * @apiSuccess {Number}   page        Page indicated in query
 * @apiSuccess {Number}   productsPer Products per page indicated in query
 * @apiSuccess {Object[]} channel     Channel information object
 * @apiSuccess {Number}   id          Product ID
 * @apiSuccess {String}   name        Name of the product
 * @apiSuccess {String}   description Description of the product
 * @apiSuccess {String}   pictureUrl  URL pointing at the product picture
 * @apiSuccess {String}   productUrl  URL pointing at a webpage for the product
 * @apiSuccess {String}   model       Model number of the product
 * @apiError   {Boolean}  success     false
 * @apiError   {String}   message     Error message
 */
router.get('/api/user/likedproducts/:id', async (req, res) => {
  if (req.query.page === undefined) {
    req.query.page = 1
  }
  if (req.query.productsPer === undefined) {
    req.query.productsPer = 10
  }
  try {
    res.send({
      success: true,
      page: req.query.page,
      productsPer: req.query.productsPer,
      totalProducts: await db.getNumLikedProducts(req.params.id),
      likedproducts: await db.getLikedProducts(req.params.id, req.query.page, req.query.productsPer)
    })
  } catch (e) {
    res.send({
      success: false,
      message: e
    })
  }
})

/**
 * @api {get} /api/users/search/:searchFor Search for users
 * @apiName SearchForUsers
 * @apiGroup
 *
 * @apiParam {String} searchFor entered search word
 * @apiParam {Number} searchlimit limit for return (query)
 *
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Number}  limit the number limit of the search
 * @apiSuccess {Number}  totalUsers the total number of results it would return if not limited
 * @apiSuccess {Array}  searchForUsers array of 'User' objects with the username and user_id
 * @apiError   {Boolean} success false
 * @apiError   {String}  message Error message
 */
router.get('/api/users/search/:searchFor', async (req, res) => {
  if (req.query.searchLimit === undefined) {
    req.query.searchLimit = 10
  }
  try {
    res.send({
        success: true,
        searchLimit: req.query.searchLimit,
        totalUsers: await db.getNumUsersSearch(req.params.searchFor),
        searchForUsers: await db.getSearchForUsers(req.params.searchFor, req.query.searchLimit)
  })
  } catch (e) {
    res.send({
      success: false,
      message: e
    })
  }
})

/**
 * @api {get} /api/channel/search/:searchFor Search for users
 * @apiName SearchForChannels
 * @apiGroup
 *
 * @apiParam {String} searchFor entered search word
 * @apiParam {Number} searchlimit limit for return (query)
 *
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Number}  limit the number limit of the search
 * @apiSuccess {Number}  totalChannels the total number of results it would return if not limited
 * @apiSuccess {Array}  searchForChannels array of 'Channel' objects with the
 * @apiError   {Boolean} success false
 * @apiError   {String}  message Error message
 */
router.get('/api/channel/search/:searchFor', async (req, res) => {
    if (req.query.searchLimit === undefined) {
    req.query.searchLimit = 10
  }
  try {
    res.send({
        success: true,
        searchLimit: req.query.searchLimit,
        totalChannels: await db.getNumChannelsSearch(req.params.searchFor),
        searchForChannels: await db.getSearchForChannels(req.params.searchFor, req.query.searchLimit)
  })
  } catch (e) {
      res.send({
      success: false,
      message: e
    })
  }
})

/**
 * @api {get} /api/users/channel/search/:searchFor Search for users and channels
 * @apiName SearchForChannelsAndUsers
 * @apiGroup
 *
 * @apiParam {String} searchFor entered search word
 * @apiParam {Number} searchlimit limit for return (query)
 *
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Number}  limit the number limit of the search
 * @apiSuccess {Number}  totalChannelsAndUsers the total number of results it would return if not limited
 * @apiSuccess {Array}  searchForChannels array of 'ChannelUser' objects with the
 * @apiError   {Boolean} success false
 * @apiError   {String}  message Error message
 */
router.get('/api/users/channel/search/:searchFor', async (req, res) => {
    if (req.query.searchLimit === undefined) {
      req.query.searchLimit = 10
  }
  try {
    res.send({
        success: true,
        searchLimit: req.query.searchLimit,
        totalChannelsAndUsers: await db.getNumChannelsAndUsersSearch(req.params.searchFor),
        searchResults: await db.getSearchForChannelsAndUsers(req.params.searchFor, req.query.searchLimit)
  })
  } catch (e) {
    res.send({
      success: false,
      message: e
    })
  }
})

/**
 * @api {get} /api/users/channel/search/:searchFor Search for users and channels
 * @apiName SearchForChannelsAndUsers
 * @apiGroup
 *
 * @apiParam {String} uid user id that you want to look for
 * @apiParam {Number} pid product id to check (query)
 *
 * @apiSuccess {Boolean} success true
 * @apiSuccess {String}  preference will return like/dislike/none
 * @apiError   {Boolean} success false
 * @apiError   {String}  message Error message
 */
router.get('/api/product/userpreference/:uid', async (req, res) => {

  try {
    res.send({
        success: true,
        preference: await db.getUserPreference(req.params.uid, req.query.pid)
  })
  } catch (e) {
    res.send({
      success: false,
      message: e
    })
  }
})

module.exports = router
