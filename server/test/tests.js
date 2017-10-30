process.env.NODE_ENV = 'test'

const { describe, it, beforeEach, afterEach } = require('mocha')
const chai = require('chai')
const should = chai.should()
const chaiHttp = require('chai-http')
chai.use(chaiHttp)

const lint = require('mocha-eslint')

const paths = [
  'src',
  'test',
  'db/execdb.js'
]

const options = {
  // Specify style of output
  formatter: 'compact', // Defaults to `stylish`

  // Only display warnings if a test is failing
  alwaysWarn: false, // Defaults to `true`, always show warnings

  // Increase the timeout of the test if linting takes to long
  timeout: 5000, // Defaults to the global mocha `timeout` option

  // Increase the time until a test is marked as slow
  slow: 1000, // Defaults to the global mocha `slow` option

  // Consider linting warnings as errors and return failure
  strict: true, // Defaults to `false`, only notify the warnings

  // Specify the mocha context in which to run tests
  contextName: 'eslint' // Defaults to `eslint`, but can be any string
}

const crypto = require('crypto-promise')
const mysql = require('promise-mysql')
process.env.DB_NAME = 'BRAND_CENTRAL_TESTING'
const server = require('../src/server')

require('dotenv').config()

const pool = mysql.createPool({
  'connectionLimit': 5,
  'host': process.env.DB_HOST,
  'user': process.env.DB_USER,
  'password': process.env.DB_PASS,
  'database': process.env.TEST_DB_NAME,
  'waitForConnections': true,
  'timezone': 'utc',
  'multipleStatements': 'true'
})

const userData = {
  username: 'tester',
  email: 'test@null',
  newEmail: 'testing@null',
  lastName: 'titor',
  firstName: 'john',
  password: 'password'
}
const followedUserData = {
  username: 'tester0',
  email: 'test0@null',
  lastName: 'titor',
  firstName: 'john',
  password: 'password'
}
let userId
let cookie
const likeData = {
  productID: '15',
  productName: 'testname'
}
const channelId = 1
let followedUserId

lint(paths, options)

describe('HTTP Routes', () => {
  beforeEach((done) => {
    done()
  })

  afterEach((done) => {
    done()
  })

  it('Should GET /', (done) => {
    chai.request(server)
      .get('/')
      .end((err, res) => {
        should.not.exist(err)
        res.status.should.equal(200)
        done()
      })
  })
})

describe('Registering a user', () => {
  it('Should POST to /api/register', () => {
    return new Promise((resolve, reject) => {
      try {
        chai.request(server)
          .post('/api/register')
          .send(userData)
          .end((err, res) => {
            should.not.exist(err)
            res.status.should.equal(200)
            res.body.success.should.equal(true)
            should.exist(res.body.id)

            userId = res.body.id
            // sessionID = res.session.userId
            resolve()
          })
      } catch (e) {
        reject(e)
      }
    })
  })

  it('Should create a new user', () => {
    return new Promise(async (resolve, reject) => {
      const user = (await pool.query('select * from user'))[0]
      should.exist(user)
      user.USER_ID.should.equal(userId)
      user.USERNAME.should.equal(userData.username)
      user.USER_EMAIL.should.equal(userData.email)
      user.USER_LNAME.should.equal(userData.lastName)
      user.USER_FNAME.should.equal(userData.firstName)
      user.VERIFIED.should.equal(0)
      // Going to assume password is correct for now.

      resolve()
    })
  })

  it('Should POST to /api/verify with a rigged code', () => {
    return new Promise(async (resolve, reject) => {
      const user = (await pool.query('select * from user'))[0]
      user.VERIFIED.should.equal(0)

      chai.request(server)
        .post('/api/verify')
        .send({
          code: user.VER_CODE
        })
        .end((err, res) => {
          should.not.exist(err)
          res.body.success.should.equal(true)
          resolve()
        })
    })
  })

  it('Should verify using a code', () => {
    return new Promise(async (resolve, reject) => {
      try {
        const user = (await pool.query('select * from user'))[0]
        user.VERIFIED.should.equal(1)

        await pool.query('update user set verified = \'0\' where verified = 1')
        resolve()
      } catch (e) {
        reject(e)
      }
    })
  })

  it('Should POST to /api/verify with a rigged token', () => {
    return new Promise(async (resolve, reject) => {
      // Check that the user has been un-verified before this runs,
      // or the test is meaningless.
      const user = (await pool.query('select * from user'))[0]
      user.VERIFIED.should.equal(0)

      chai.request(server)
        .post('/api/verify')
        .send({
          token: user.VER_TOKEN
        })
        .end((err, res) => {
          should.not.exist(err)
          res.body.success.should.equal(true)
          resolve()
        })
    })
  })

  it('Should verify using a token', () => {
    return new Promise(async (resolve, reject) => {
      try {
        const user = (await pool.query('select * from user'))[0]
        user.VERIFIED.should.equal(1)

        resolve()
      } catch (e) {
        reject(e)
      }
    })
  })
})

describe('Logging in', () => {
  it('Should POST to /api/login', () => {
    return new Promise((resolve, reject) => {
      chai.request(server)
        .post('/api/login')
        .send({
          username: userData.username,
          password: userData.password
        })
        .end((err, res) => {
          const sessionCookie = res.headers['set-cookie'][0].split(';')[0]

          should.not.exist(err)
          res.body.success.should.equal(true)
          should.exist(sessionCookie)

          cookie = sessionCookie
          // TODO: Check other values

          resolve()
        })
    })
  })
})

describe('Changing a user\'s email', () => {
  it('Should PUT /api/user/:id/email', () => {
    return new Promise((resolve, reject) => {
      chai.request(server)
        .put(`/api/user/${userId}/email`)
        .set('cookie', cookie)
        .send({
          email: userData.newEmail,
          password: userData.password
        })
        .end((err, res) => {
          should.not.exist(err)
          res.body.success.should.equal(true)
          resolve()
        })
    })
  })

  const USER_EMAIL_Q = 'select USER_EMAIL FROM USER WHERE USER_ID = ?'
  it('Should set the new email', () => {
    return new Promise(async (resolve, reject) => {
      try {
        const results = await pool.query(USER_EMAIL_Q, [ userId ])

        results[0].USER_EMAIL.should.equal(userData.newEmail)
        userData.oldEmail = userData.email
        userData.email = userData.newEmail
        resolve()
      } catch (e) {
        reject(e)
      }
    })
  })
})

describe('Getting a user\'s profile', () => {
  it('Should return a user\'s profile', () => {
    return new Promise(async (resolve, reject) => {
      let hash
      try {
        hash = (await crypto.hash('md5')(userData.email)).toString('hex')
      } catch (e) {
        reject(e)
      }

      chai.request(server)
        .get(`/api/profile/${userId}`)
        .set('cookie', cookie)
        .end((err, res) => {
          const user = res.body.user

          should.not.exist(err)
          res.body.success.should.equal(true)
          user.firstName.should.equal(userData.firstName)
          user.lastName.should.equal(userData.lastName)
          user.username.should.equal(userData.username)
          user.emailHash.should.equal(hash)
          resolve()
        })
    })
  })
})

describe('Channel navigation', () => {
  it('Should GET /api/product', () => {
    return new Promise((resolve, reject) => {
      chai.request(server)
        .get('/api/product/random?channelId=1')
        .set('cookie', cookie)
        .end((err, res) => {
          should.not.exist(err)
          res.body.success.should.equal(true)
          should.exist(res.body.product)
          // TODO: Check other values

          resolve()
        })
    })
  })
})

describe('Liking a product', () => {
  it('Should POST to /api/product/like/:id', () => {
    return new Promise((resolve, reject) => {
      chai.request(server)
        .post(`/api/product/like/${likeData.productID}`)
        .set('cookie', cookie)
        .end((err, res) => {
          should.not.exist(err)
          res.body.success.should.equal(true)
          resolve()
        })
    })
  })

  it('Should create a new like', () => {
    return new Promise(async (resolve, reject) => {
      try {
        const like = (await pool.query('select * from likes'))[0]
        should.exist(like)
        like.USER_ID.should.equal(userId)
        like.PRODUCT_ID.should.equal(parseInt(likeData.productID, 10))
        resolve()
      } catch (e) {
        reject(e)
      }
    })
  })
})

describe('Disliking a product', () => {
  it('Should POST to /api/product/dislike/:id', () => {
    return new Promise((resolve, reject) => {
      chai.request(server)
        .post(`/api/product/dislike/${likeData.productID}`)
        .set('cookie', cookie)
        .end((err, res) => {
          should.not.exist(err)
          res.body.success.should.equal(true)
          resolve()
        })
    })
  })

  it('Should create a new dislike', () => {
    return new Promise(async (resolve, reject) => {
      try {
        const dislike = (await pool.query('select * from dislikes'))[0]
        should.exist(dislike)
        dislike.USER_ID.should.equal(userId)
        dislike.PRODUCT_ID.should.equal(parseInt(likeData.productID, 10))
        resolve()
      } catch (e) {
        reject(e)
      }
    })
  })
})

describe('Following a user', () => {
  it('Should create a new user', () => {
    return new Promise((resolve, reject) => {
      try {
        chai.request(server)
          .post('/api/register')
          .send(followedUserData)
          .end((err, res) => {
            should.not.exist(err)
            res.status.should.equal(200)
            res.body.success.should.equal(true)
            should.exist(res.body.id)

            followedUserId = res.body.id
            resolve()
          })
      } catch (e) {
        reject(e)
      }
    })
  })

  it('Should POST to /api/user/follow/:id', () => {
    return new Promise((resolve, reject) => {
      chai.request(server)
        .post(`/api/user/follow/${followedUserId}`)
        .set('cookie', cookie)
        .end((err, res) => {
          should.not.exist(err)
          res.body.success.should.equal(true)
          resolve()
        })
    })
  })

  it('Should follow a user', () => {
    return new Promise(async (resolve, reject) => {
      try {
        const follow = (await pool.query('select * from following'))[0]
        should.exist(follow)
        follow.FOLLOWER_ID.should.equal(userId)
        follow.USER_FOLLOWED_ID.should.equal(followedUserId)
        resolve()
      } catch (e) {
        reject(e)
      }
    })
  })
})

describe('Unfollowing a user', () => {
  it('Should POST to /api/user/unfollow/:id', () => {
    return new Promise((resolve, reject) => {
      chai.request(server)
        .post(`/api/user/unfollow/${followedUserId}`)
        .set('cookie', cookie)
        .end((err, res) => {
          should.not.exist(err)
          res.body.success.should.equal(true)
          resolve()
        })
    })
  })

  it('Should unfollow a user', () => {
    return new Promise(async (resolve, reject) => {
      try {
        const follow = (await pool.query('select * from following'))[0]
        should.not.exist(follow)
        resolve()
      } catch (e) {
        reject(e)
      }
    })
  })
})

describe('Subscribing to a channel', () => {
  it('Should POST to /api/channels/subscribe/:cid', () => {
    return new Promise((resolve, reject) => {
      chai.request(server)
        .post(`/api/channels/subscribe/${channelId}`)
        .set('cookie', cookie)
        .end((err, res) => {
          should.not.exist(err)
          res.body.success.should.equal(true)
          resolve()
        })
    })
  })

  it('Should subscribe to a channel', () => {
    return new Promise(async (resolve, reject) => {
      try {
        const subscribe = (await pool.query('select * from channel_user_assign'))[0]
        should.exist(subscribe)
        subscribe.CHANNEL_ID.should.equal(channelId)
        subscribe.USER_ID.should.equal(userId)
        resolve()
      } catch (e) {
        reject(e)
      }
    })
  })
})

describe('Unsubscribing from a channel', () => {
  it('Should POST to /api/channels/unsubscribe/:cid', () => {
    return new Promise((resolve, reject) => {
      chai.request(server)
        .post(`/api/channels/unsubscribe/${channelId}`)
        .set('cookie', cookie)
        .end((err, res) => {
          should.not.exist(err)
          res.body.success.should.equal(true)
          resolve()
        })
    })
  })

  it('Should unsubscribe from a channel', () => {
    return new Promise(async (resolve, reject) => {
      try {
        const subscribe = (await pool.query('select * from channel_user_assign'))[0]
        should.not.exist(subscribe)
        resolve()
      } catch (e) {
        reject(e)
      }
    })
  })
})

describe('Cleanup', () => {
  it('Clean up database', () => {
    return new Promise(async (resolve, reject) => {
      try {
        await pool.query('delete from user;', [])
        await pool.query('delete from likes;', [])
        await pool.query('delete from dislikes;', [])
        resolve()
      } catch (e) {
        reject(e)
      }
    })
  })
})
