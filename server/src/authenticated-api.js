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
        user: 'csi3660Appointments@firemail.cc', // generated ethereal user
        pass: 'CSI3660dropbox' // generated ethereal password
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
      from: '"CSI 3660 Appointments" <csi3660Appointments@firemail.cc>', // sender address
      to: results.email,
      subject: 'Email Change Notification', // Subject line
      text: 'Hello, we noticed that your email has been changed on your account. Please contact us if this was not you.' // plain text body
    }

    const NewVerifyEmail = {
      from: '"CSI 3660 Appointments" <csi3660Appointments@firemail.cc>', // sender address
      to: req.body.email,
      subject: 'Email Verification', // Subject line
      text: `Hello, please click this link to verify your new email: http://${process.env.URL}/verify?token=${results.token}\n` // plain text body
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


router.post('/api/user/upload', async (req, res) => {
  try {
        req.body.file = Buffer.from(req.body.file, 'base64').toString()
        const results = await db.uploadFile(req.body.filename, req.body.filesize, req.body.file, req.session.userId)
        res.send({
        success: true,
        file: req.body.file
      })
  } catch (e) {
      console.log(e)
      res.send({
          success: false,
          message: e
      })
  }
})

router.get('/api/user/getfiles', async (req, res) => {
    if (req.query.page === undefined) {
    req.query.page = 1
}
if (req.query.filesPerPage === undefined) {
    req.query.filesPerPage = 10
}
try {
    res.send({
            success: true,
            page: req.query.page,
            filesPerPage: req.query.filesPerPage,
            totalFiles: await db.getNumFiles(req.query.page),
            files: await db.getFiles(req.query.page, req.query.filesPerPage)
})
} catch (e) {
    res.send({
        success: false,
        message: e
    })
}
})

router.post('/api/verify/password', async (req, res) => {
    try {
        const results = await db.verifyPassword(req.session.userId, req.body.password)
        res.send({
            success: true
      })
    } catch (e) {
      console.log(e)
      res.send({
          success: false,
          message: e
      })
    }
})

router.post('/api/add/appointment', async (req, res) => {
    try {
        const results = await db.addAppointment(req.body.title, req.body.desc, req.body.date, req.body.starttime, req.body.endtime, req.session.userId)
        res.send({
        success: true
    })
    } catch (e) {
        console.log(e)
        res.send({
            success: false,
            message: e
        })
    }
})

router.get('/api/user/getappointments', async (req, res) => {
    if (req.query.page === undefined) {
        req.query.page = 1
    }
    if (req.query.appsPerPage === undefined) {
        req.query.appsPerPage = 10
    }
    if(req.query.searchText === '') {
        try {
            res.send({
                    success: true,
                    page: req.query.page,
                    appsPerPage: req.query.appsPerPage,
                    totalApps: await db.getNumApps(req.query.uid),
                    apps: await db.getApps(req.query.page, req.query.appsPerPage, req.query.uid)
        })
        } catch (e) {
            console.log(e)
            res.send({
                success: false,
                message: e
            })
        }
    } else {
        try {
            res.send({
                    success: true,
                    page: req.query.page,
                    appsPerPage: req.query.appsPerPage,
                    totalApps: await db.getNumSearchApps(req.query.searchText, req.query.uid),
                    apps: await db.searchApps(req.query.page, req.query.appsPerPage, req.query.searchText, req.query.uid)
        })
        } catch (e) {
            console.log(e)
            res.send({
                success: false,
                message: e
            })
        }
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
 * @api {get} api/user/following/:id Unfollow a user
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
 * @api {get} /api/users/search Search for users
 * @apiName SearchForUsers
 * @apiGroup User
 *
 * @apiParam {String} query entered search word (query)
 * @apiParam {Number} limit limit for return (query)
 *
 * @apiSuccess {Boolean} success    true
 * @apiSuccess {Number}  limit      the number limit of the search
 * @apiSuccess {Array}   users      array of 'User' objects with the username and user_id
 * @apiError   {Boolean} success    false
 * @apiError   {String}  message    Error message
 */
router.get('/api/users/search', async (req, res) => {
    if (req.query.query === undefined) {
        req.query.query = ''
    }
    if (req.query.limit === undefined) {
        req.query.limit = 10
    }
    try {
        res.send({
            success: true,
            limit: parseInt(req.query.limit),
            users: await db.getSearchForUsers(req.query.query, parseInt(req.query.limit))
    })
    } catch (e) {
        res.send({
            success: false,
            message: e
        })
    }
})

module.exports = router
