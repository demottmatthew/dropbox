/*
 * public-api.js -- Publicly-accessible REST endpoints.
 */

const router = require('express').Router()
const db = require('./db')
const nodemailer = require('nodemailer')

// create reusable transporter object using the default SMTP transport
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
 * @api {post} /api/login Login to an account
 * @apiName Login
 * @apiGroup Login/Logout
 *
 * @apiParam {String} username User's username
 * @apiParam {String} password User's password
 *
 * @apiSuccess {Boolean} success   true
 * @apiSuccess {Number}  id        User's ID
 * @apiSuccess {String}  lastName  User's last name
 * @apiSuccess {String}  firstName User's first name
 * @apiSuccess {String}  email     User's email
 * @apiSuccess {String}  lastSeen  When the user was last seen (currently unused)
 * @apiError   {Boolean} success   false
 * @apiError   {String}  message   Error message
 */
router.post('/api/login', async (req, res) => {
  try {
    const results = await db.loginUser(req.body)
    // console.log('Logged in', results.id, req.session.id)
    req.session.userId = results.id

    await db.updateLastSeen(results.id)
    res.send({
      success: true,
      id: results.id,
      lastName: results.lastName,
      firstName: results.firstName,
      email: results.email,
      lastSeen: results.lastSeen ? results.lastSeen : 'never'
    })
  } catch (e) {
    console.log(e)
    res.send({
      success: false,
      message: e.message
    })
  }
})

/**
 * @api {post} /api/register Register a new account
 * @apiName Register
 * @apiGroup Registration
 *
 * @apiParam {String} username  User's username
 * @apiParam {String} firstName User's first name
 * @apiParam {String} lastName  User's last name
 * @apiParam {String} password  User's password
 * @apiParam {String} email     User's email address
 *
 * @apiSuccess {Boolean} success   true
 * @apiSuccess {Number}  id        User's ID
 * @apiError   {Boolean} success   false
 * @apiError   {String}  message   Error message
 */
router.post('/api/register', async (req, res) => {
  try {
    const results = await db.registerUser(req.body)

    req.session.userId = results.insertId

    const registerEmail = {
      from: '"Brand Central Station" <BrandCentralStation@firemail.cc>', // sender address
      to: req.body.email,
      subject: 'Hello ✔', // Subject line
      text: 'Hello, thanks for signing up. Please click this link to verify your account:\n' // plain text body
    }

    registerEmail.text += `http://${process.env.URL}/verify?token=${results.token}`
    registerEmail.text += `\nYou can also enter the following code: ${results.code}`

    transporter.sendMail(registerEmail, (error, info) => {
      if (error) {
        throw error
      }
    })
    res.send({
      success: true,
      id: results.insertId
    })
  } catch (e) {
    console.log(e)
    res.send({
      success: false,
      message: e.message
    })
  }
})

/**
 * @api {post} /api/password/reset Reset a user's password
 * @apiName ResetPassword
 * @apiGroup User
 * @apiDescription This will send a reset token/link to the user's email if no
 * token is provided, otherwise it will accept a token and reset the user's
 * password to the specified new password.
 *
 * @apiParam {String} email       User's email
 * @apiParam {String} token       The verification token the user was given
 * @apiParam {String} newPassword The desired new password
 *
 * @apiSuccess {Boolean} success   true
 * @apiError   {Boolean} success   false
 * @apiError   {String}  message   Error message
 */
router.post('/api/password/reset', async (req, res) => {
  try {
    if (req.body.token) {
      await db.verifyTokenResetPassword(req.body.token, req.body.newPassword)
      res.send(JSON.stringify({ success: true }))
    } else {
      const token = await db.generatePasswordResetToken(req.body.email)
      const resetEmail = {
        from: '"Brand Central Station" <BrandCentralStation@firemail.cc>', // sender address
        to: req.body.email,
        subject: 'Reset Password ✔', // Subject line
        text: 'Hello, to reset your password, please click the following link:\n' // plain text body
      }

      resetEmail.text += `http://${process.env.URL}/reset?token=${token}`

      transporter.sendMail(resetEmail, (error, email) => {
        if (error) {
          throw error
        }

        res.send({
          success: true
        })
      })
    }
  } catch (e) {
    res.send({
      success: false,
      message: e.message
    })
  }
})

/**
 * @api {post} /api/verify Verify a user's email
 * @apiName Verify
 * @apiGroup Registration
 * @apiDescription This takes either a token or a code, both of which were sent
 * to the user in an email, and marks the user as having a verified email
 * address.
 *
 * @apiParam {String} email       User's email
 * @apiParam {String} token       The verification token the user was given
 * @apiParam {String} newPassword The desired new password
 *
 * @apiSuccess {Boolean} success   true
 * @apiError   {Boolean} success   false
 * @apiError   {String}  message   Error message
 */
router.post('/api/verify', async (req, res) => {
  try {
    if (req.body.token) {
      await db.verifyUserToken(req.body.token)
    } else if (req.body.code) {
      await db.verifyUserCode(req.body.code)
    } else {
      throw new Error('No code or token given.')
    }

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
 * @api {get} /api/authenticated Check if a client is authenticated
 * @apiName Authenticated
 * @apiGroup Util
 * @apiDescription Returns a message indicating whether or not the session is
 * authenticated. If the session is authenticated, the response also contains
 * information for the user who is authenticated. This should always return a
 * successful response, and contain a attribute called authenticated, which is
 * a boolean.
 *
 * @apiSuccess {Boolean} success       true
 * @apiSuccess {Boolean} authenticated Whether the user is authenticated
 * @apiSuccess {Object}  user          User object returned if the user is authenticated
 * @apiSuccess {Number}  id            User's ID
 * @apiSuccess {String}  lastName      User's last name
 * @apiSuccess {String}  firstName     User's first name
 * @apiSuccess {String}  username      User's username
 * @apiSuccess {String}  email         User's email
 * @apiError   {String}  message       Error message
 */
router.get('/api/authenticated', async (req, res) => {
  // Check to see if the session has a user
  if (!req.session.userId) {
    res.send({
      success: true,
      authenticated: false
    })
    return
  }

  try {
    // Fetch and return the user
    const results = await db.getUserWithId(req.session.userId)
    if (results.lenth < 1) res.status(404).send('User with that id does not exist')

    res.send({
      success: true,
      authenticated: true,
      user: {
        id: results[0].USER_ID,
        lastName: results[0].USER_LNAME,
        firstName: results[0].USER_FNAME,
        username: results[0].USERNAME,
        email: results[0].USER_EMAIL
      }
    })
  } catch (e) {
    if (e) res.status(404).send('Something went wrong')
  }
})

/**
 * @api {get} /api/channels/onboard Get onboarding channels
 * @apiName Authenticated
 * @apiGroup Util
 * @apiDescription Returns a collection of tags to present to the user during
 * the onboarding process.
 *
 * @apiSuccess {Boolean}  success  true
 * @apiSuccess {Number[]} channels Array of sixteen tags
 * @apiSuccess {Boolean}  success  false
 * @apiError   {String}   message  Error message
 */
router.get('/api/channels/onboard', async (req, res) => {
  try {
    res.send({
      success: true,
      channels: await db.getOnboardChannels()
    })
  } catch (e) {
    res.send({
      success: false,
      message: e.message
    })
  }
})

module.exports = router
