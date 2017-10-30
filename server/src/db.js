/*
 * db.js -- Database setup and related functions.
 */
'use strict'

const mysql = require('promise-mysql')
const bcrypt = require('bcrypt')
const moment = require('moment-range').extendMoment(require('moment'))
const crypto = require('crypto-promise')

const pool = mysql.createPool({
  'connectionLimit': 5,
  'host': process.env.DB_HOST,
  'user': process.env.DB_USER,
  'password': process.env.DB_PASS,
  'database': process.env.DB_NAME,
  'waitForConnections': true,
  'timezone': 'utc',
  'multipleStatements': 'true'
})

const GETPASSHASH_Q = 'SELECT USER_PASS_HASH FROM USER WHERE USER_ID = ?'
const verifyPassword = (user, pass) => {
  return new Promise(async (resolve, reject) => {
    try {
      const results = await pool.query(GETPASSHASH_Q, [ user ])

      if (results.length === 0) {
        resolve(false)
      }

      const res = await bcrypt.compare(pass, results[0].USER_PASS_HASH)

      if (res) {
        // successful login
        resolve(true)
      } else {
        // login failure
        resolve(false)
      }
    } catch (e) {
      reject(e)
    }
  })
}

/*
 * Put user details into database, checking for whether their GID is already
 * in the database.
 */
const DUPCHECK_Q = 'SELECT USERNAME, USER_EMAIL FROM USER WHERE USERNAME = ? OR USER_EMAIL = ?'
const REGISTER_Q = `INSERT INTO USER
(USERNAME, USER_LNAME, USER_FNAME, USER_EMAIL, USER_PASS_HASH, VER_TOKEN, VER_CODE, LAST_SEEN)
VALUES(?, ?, ?, ?, ?, ?, ?, ?)`
pool.registerUser = info => {
  return new Promise(async (resolve, reject) => {
    if (!info.username || !info.email ||
      !info.lastName || !info.firstName || !info.password) {
      reject(new Error('Missing a required field'))
      return
    }

    try {
      const results = await pool.query(DUPCHECK_Q, [info.username, info.email])
      if (typeof results !== 'undefined' && results.length > 0) {
        // username or email already taken/in use
        if (info.username === results[0].USERNAME) {
          reject(new Error('That username is already taken.'))
        } else if (info.email === results[0].USER_EMAIL) {
          reject(new Error('A user with that email is already registered.'))
        } else {
          reject(new Error('Unknown SQL collision.'))
        }
      } else {
        const hash = await bcrypt.hash(info.password, 10)
        const token = (await crypto.randomBytes(16)).toString('hex')
        const code = [...(await crypto.randomBytes(6))].map(num => num % 10).join('')
        const res = await pool.query(REGISTER_Q, [
          info.username,
          info.lastName,
          info.firstName,
          info.email,
          hash,
          token,
          code,
          moment().format('YYYY-MM-DD HH:mm:ss')
        ])

        res.token = token
        res.code = code
        resolve(res)
        // if (err.code === 'ER_DUP_ENTRY')
        // err.message = 'A user with that ID is already registered'
      }
    } catch (e) {
      reject(e)
    }
  })
}

const DUPCHECKEMAIL_Q = 'SELECT USER_ID FROM USER WHERE USER_EMAIL = ?'
const GETOLDEMAIL_Q = 'SELECT USER_EMAIL FROM USER WHERE USER_ID = ?'
const CHANGEEMAIL_Q = 'UPDATE USER SET USER_EMAIL = ?, VERIFIED = \'0\', VER_TOKEN = ? WHERE USER_ID = ?;'
pool.checkNewEmail = (id, info) => {
  return new Promise(async (resolve, reject) => {
    if (!id || !info.email || !info.password) {
      reject(new Error('Missing a required field'))
      return
    }

    try {
      const existingEmails = await pool.query(DUPCHECKEMAIL_Q, [ info.email ])
      const passwordCheck = await verifyPassword(id, info.password)
      if (!passwordCheck) {
        reject(new Error('Invalid password'))
      } else if (existingEmails.length > 0) {
        reject(new Error('Email already used'))
      } else {
        const token = (await crypto.randomBytes(16)).toString('hex')
        const email = await pool.query(GETOLDEMAIL_Q, [ id ])

        await pool.query(CHANGEEMAIL_Q, [ info.email, token, id ])

        resolve({
          token,
          email: email[0].USER_EMAIL
        })
      }
    } catch (e) {
      reject(e)
    }
  })
}

/*
 * Check user's password and return user info if it is valid
 */
const LOGIN_Q = 'SELECT USER_ID, USER_LNAME, USER_FNAME, USER_EMAIL, USER_PASS_HASH, VERIFIED, LAST_SEEN FROM USER WHERE USERNAME = ?'
pool.loginUser = info => {
  return new Promise(async (resolve, reject) => {
    try {
      const results = await pool.query(LOGIN_Q, [ info.username ])

      if (results.length === 0) {
        // login failure
        reject(new Error('Username or password invalid'))
        return
      } else if (results[0].VERIFIED !== 1) {
        reject(new Error('User not verified '))
        return
      }

      const res = await bcrypt.compare(info.password, results[0].USER_PASS_HASH)

      if (res) {
        // successful login
        resolve({
          id: results[0].USER_ID,
          lastName: results[0].USER_LNAME,
          firstName: results[0].USER_FNAME,
          email: results[0].USER_EMAIL,
          lastSeen: results[0].LAST_SEEN
        })
      } else {
        // login failure
        reject(new Error('Username or password invalid'))
      }
    } catch (e) {
      reject(e)
    }
  })
}

pool.updateProfile = info => {
  return new Promise(async (resolve, reject) => {
    const newColumns = {}
    if (info.firstName) newColumns.USER_FNAME = info.firstName
    if (info.lastName) newColumns.USER_LNAME = info.lastName
    if (info.email) newColumns.USER_EMAIL = info.email

    try {
      if (info.password) {
        // Separate query for user password to avoid nasty control flow.
        const hash = await bcrypt.hash(info.password, 10)
        pool.query('UPDATE USER SET USER_PASS_HASH = ? WHERE USER_ID = ?', [hash, info.id])
      }

      // Check to make sure there are attributes to set
      if (Object.keys(newColumns).length !== 0) {
        const UPDATE_PROFILE_Q = `UPDATE USER SET ? WHERE USER_ID = ?`
        pool.query(UPDATE_PROFILE_Q, [newColumns, info.id])
      }
    } catch (e) {
      reject(e)
    }
  })
}

const GET_USER_Q = 'SELECT * FROM USER WHERE USER_ID = ?'
pool.getUserWithId = id => pool.query(GET_USER_Q, [ id ])

const VERIFY_TOKEN_Q = 'UPDATE USER SET VERIFIED = \'1\' WHERE VER_TOKEN = ?'
pool.verifyUserToken = token => pool.query(VERIFY_TOKEN_Q, [ token ])

const VERIFY_CODE_Q = 'UPDATE USER SET VERIFIED = \'1\' WHERE VER_CODE = ?'
pool.verifyUserCode = code => pool.query(VERIFY_CODE_Q, [ code ])

const PROFILE_Q = `SELECT USER_FNAME, USER_LNAME, USERNAME, USER_EMAIL
FROM USER WHERE USER_ID = ?`
pool.getProfileData = id => {
  return new Promise(async (resolve, reject) => {
    if (!id) {
      reject(new Error('Missing user ID'))
      return
    }

    try {
      const results = await pool.query(PROFILE_Q, [ id ])
      if (results.length === 1) {
        const profile = {
          firstName: results[0].USER_FNAME,
          lastName: results[0].USER_LNAME,
          username: results[0].USERNAME,
          emailHash: (await crypto.hash('md5')(results[0].USER_EMAIL)).toString('hex')
        }
        resolve(profile)
      } else {
        reject(new Error('No such user'))
      }
    } catch (e) {
      reject(e)
    }
  })
}

// This function will query the database for the first 16 tags.
const GET_ONBOARD_CHANNELS_Q = `SELECT * FROM CHANNEL LIMIT 16;`
pool.getOnboardChannels = pool.query.bind(pool, GET_ONBOARD_CHANNELS_Q, [])

const LAST_SEEN_Q = `
UPDATE USER
  SET LAST_SEEN = CURRENT_TIMESTAMP()
  WHERE USER_ID = ?`
pool.updateLastSeen = id => pool.query(LAST_SEEN_Q, [ id ])

/**
 * If the token is valid and exists in the system, the password for the user
 * associated with that token is changed to newPassword.
 * @param {String} token
 * @param {String} newPassword
 * @param {Function} callback
 */
const CHECKTOKEN_Q = 'SELECT USER_ID FROM RESET_PASSWORD_TOKENS WHERE TOKEN = ?;'
const CHANGEPASSWORD_Q = 'UPDATE USER SET USER_PASS_HASH = ? WHERE USER_ID = ?;'
pool.verifyTokenResetPassword = (token, newPassword) => {
  return new Promise(async (resolve, reject) => {
    try {
      const results = await pool.query(CHECKTOKEN_Q, [ token ])
      if (results.length > 0) {
        const hash = await bcrypt.hash(newPassword, 10)
        await pool.query(CHANGEPASSWORD_Q, [ hash, results[0].USER_ID ])
        resolve()
      } else {
        reject(new Error('Token not found'))
      }
    } catch (e) {
      reject(e)
    }
  })
}

/**
 * Generates a password reset token for the specified email. The email must
 * exist in the database in order to generate a password reset token.
 * @param {String} email
 */
const CHECKEMAIL_Q = 'SELECT USER_ID, USER_EMAIL FROM USER WHERE USER_EMAIL = ?;'
const WRITETOKEN_Q = 'INSERT INTO RESET_PASSWORD_TOKENS (USER_ID , TOKEN) VALUES(?, ?);'
pool.generatePasswordResetToken = email => {
  return new Promise(async (resolve, reject) => {
    if (!email) {
      reject(new Error('Missing email'))
    } else {
      try {
        const results = await pool.query(CHECKEMAIL_Q, [ email ])
        if (results.length > 0) {
          // TODO: Are we going to use this value?
          // const hash = await bcrypt.hash(email, 10)
          require('crypto').randomBytes(16, async (err, buffer) => {
            if (err) {
              reject(err)
            }

            const token = buffer.toString('hex')
            await pool.query(WRITETOKEN_Q, [ results[0].USER_ID, token ])
            resolve(token)
          })
        } else {
          reject(new Error('Email not found'))
        }
      } catch (e) {
        reject(e)
      }
    }
  })
}

const STORE_USER_CHANNEL_Q = 'INSERT INTO CHANNEL_USER_ASSIGN (CHANNEL_ID, USER_ID) VALUES ?;'
pool.storeUserChannels = (user, channels) => {
  return new Promise(async (resolve, reject) => {
    if (!channels || channels.length === 0) {
      reject(new Error('Missing channels'))
    }

    try {
      const values = channels.map(channel => [ channel, parseInt(user) ])
      await pool.query(STORE_USER_CHANNEL_Q, [ values ])
      resolve()
    } catch (e) {
      reject(e)
    }
  })
}

const SELECT_USER_CHANNEL_Q = 'SELECT CHANNEL.CHANNEL_ID, CHANNEL_NAME FROM (CHANNEL INNER JOIN CHANNEL_USER_ASSIGN ON CHANNEL.CHANNEL_ID = CHANNEL_USER_ASSIGN.CHANNEL_ID) WHERE USER_ID = ?;'
pool.retrieveUserChannels = user => {
  return new Promise(async (resolve, reject) => {
    if (!user) {
      reject(new Error('Missing user'))
    }

    try {
      const results = await pool.query(SELECT_USER_CHANNEL_Q, [ user ])
      const channelsArray = results.map(result => {
        return { id: result.CHANNEL_ID, name: result.CHANNEL_NAME }
      })

      resolve(channelsArray)
    } catch (e) {
      console.log(e)
      reject(e)
    }
  })
}

const GET_RAND_PRODUCT_Q = 'SELECT * FROM (((PRODUCT INNER JOIN PROD_TAG_ASSIGN ON PRODUCT.PRODUCT_ID = PROD_TAG_ASSIGN.PRODUCT_ID) INNER JOIN TAG ON PROD_TAG_ASSIGN.TAG_ID = TAG.TAG_ID) INNER JOIN CHANNEL_TAG_ASSIGN ON TAG.TAG_ID = CHANNEL_TAG_ASSIGN.TAG_ID) WHERE CHANNEL_TAG_ASSIGN.CHANNEL_ID = ?;'
pool.getRandomProduct = channel => {
  return new Promise(async (resolve, reject) => {
    if (!channel) {
      reject(new Error('Missing channels'))
    }

    // const productCount = await pool.query('SELECT COUNT(*) FROM PRODUCT')
    // const productId = parseInt(Math.random() * (productCount[0]['COUNT(*)'] - 0) + 0, 10)
    // const code = [...(await crypto.randomBytes(6))].map(num => num % 10).join('')
    // console.log(productId)
    try {
      const results = await pool.query(GET_RAND_PRODUCT_Q, [ channel ])

      if (results.length > 0) {
        const productNum = parseInt(Math.random() * (results.length - 0) + 0, 10)
        const product = {
          id: results[productNum].PRODUCT_ID,
          name: results[productNum].PROD_NAME,
          description: results[productNum].PROD_DESC,
          pictureUrl: results[productNum].PROD_PICT_URL,
          productUrl: results[productNum].PROD_URL,
          model: results[productNum].PROD_MODEL
        }

        resolve(product)
      } else {
        reject(new Error('No product found.'))
      }
    } catch (e) {
      reject(e)
    }
  })
}

const LIKE_Q = `INSERT INTO LIKES (USER_ID, PRODUCT_ID) VALUES(?, ?)`
pool.likeProduct = (user, product) => {
  return new Promise(async (resolve, reject) => {
    if (!user || !product) {
      reject(new Error('Missing a required field'))
      return
    }

    try {
      await pool.query(LIKE_Q, [user, product])
      resolve()
    } catch (e) {
      reject(e)
    }
  })
}

const DISLIKE_Q = `INSERT INTO DISLIKES (USER_ID, PRODUCT_ID) VALUES(?, ?)`
pool.dislikeProduct = (user, product) => {
  return new Promise(async (resolve, reject) => {
    if (!user || !product) {
      reject(new Error('Missing a required field'))
      return
    }

    try {
      await pool.query(DISLIKE_Q, [user, product])
      resolve()
    } catch (e) {
      reject(e)
    }
  })
}

pool.unlikeProduct = (user, product) => {
  return new Promise(async (resolve, reject) => {

  })
}

const FOLLOW_Q = `INSERT INTO FOLLOWING (FOLLOWER_ID, USER_FOLLOWED_ID) VALUES(?, ?)`
pool.followUser = (follower, followee) => {
  return new Promise(async (resolve, reject) => {
    if (!follower || !followee) {
      reject(new Error('Missing a required field'))
    }
    try {
      await pool.query(FOLLOW_Q, [follower, followee])
      resolve()
    } catch (e) {
      reject(e)
    }
  })
}

const UNFOLLOW_Q = `DELETE FROM FOLLOWING WHERE FOLLOWER_ID = ? AND USER_FOLLOWED_ID = ?`
pool.unfollowUser = (follower, followee) => {
  return new Promise(async (resolve, reject) => {
    if (!follower || !followee) {
      reject(new Error('Missing a required field'))
    }
    try {
      await pool.query(UNFOLLOW_Q, [follower, followee])
      resolve()
    } catch (e) {
      reject(e)
    }
  })
}

const FOLLOWING_Q = 'SELECT USERNAME, FOLLOWING.USER_FOLLOWED_ID FROM (FOLLOWING INNER JOIN USER ON FOLLOWING.USER_FOLLOWED_ID = USER.USER_ID) WHERE FOLLOWING.FOLLOWER_ID = ?'
pool.getFollowing = user => {
  return new Promise(async (resolve, reject) => {
    if (!user) {
      reject(new Error('Missing user id'))
    }

    try {
      const results = await pool.query(FOLLOWING_Q, [user])
      const following = []
      if (results.length > 0) {
        for (let i = 0; i < results.length; i++) {
          const userObject = {
            username: results[i].USERNAME,
            id: results[i].USER_FOLLOWED_ID
          }
          following.push(userObject)
        }

        resolve(following)
      } else {
        resolve([])
      }
    } catch (e) {
      reject(e)
    }
  })
}

const LIKEDPRODUCTS_Q = 'SELECT * FROM (LIKES INNER JOIN PRODUCT ON LIKES.PRODUCT_ID = PRODUCT.PRODUCT_ID) WHERE LIKES.USER_ID = ? LIMIT ?,?'
pool.getLikedProducts = (user, page, productsPer) => {
  return new Promise(async (resolve, reject) => {
    if (!user || !page) {
      reject(new Error('Missing required field'))
    }

    try {
      const startproduct = ((page - 1) * productsPer)
      const endproduct = (page * productsPer)
      const results = await pool.query(LIKEDPRODUCTS_Q, [ user, startproduct, endproduct ])
      const productsarray = []
      if (results.length > 0) {
        for (let i = 0; i < results.length; i++) {
          const product = {
            id: results[i].PRODUCT_ID,
            name: results[i].PROD_NAME,
            description: results[i].PROD_DESC,
            pictureUrl: results[i].PROD_PICT_URL,
            productUrl: results[i].PROD_URL,
            model: results[i].PROD_MODEL
          }
          productsarray[i] = product
        }
        resolve(productsarray)
      } else {
        resolve([])
      }
    } catch (e) {
      console.log(e)
      reject(e)
    }
  })
}

const CHANNEL_Q = 'SELECT * FROM CHANNEL WHERE CHANNEL_ID = ?'
pool.getChannel = (channelId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const results = await pool.query(CHANNEL_Q, [ channelId ])
      if (results.length > 0) {
        const channel = {
          id: results[0].CHANNEL_ID,
          name: results[0].CHANNEL_NAME
        }

        resolve(channel)
      } else { resolve() }
    } catch (e) {
      reject(e)
    }
  })
}

const NUMLIKEDPRODUCTS_Q = 'SELECT * FROM (LIKES INNER JOIN PRODUCT ON LIKES.PRODUCT_ID = PRODUCT.PRODUCT_ID) WHERE LIKES.USER_ID = ?'
pool.getNumLikedProducts = user => {
  return new Promise(async (resolve, reject) => {
    if (!user) {
      reject(new Error('Missing required field'))
      return
    }

    try {
      const results = await pool.query(NUMLIKEDPRODUCTS_Q, [user])
      resolve(results.length)
    } catch (e) {
      reject(e)
    }
  })
}

const UNSUBSCRIBECHANNEL_Q = 'DELETE FROM CHANNEL_USER_ASSIGN WHERE USER_ID = ? AND CHANNEL_ID = ?'
pool.unsubscribeChannel = (user, channel) => {
  return new Promise(async (resolve, reject) => {
    if (!user || !channel) {
      reject(new Error('Missing a required field'))
      return
    }

    try {
      await pool.query(UNSUBSCRIBECHANNEL_Q, [user, channel])
      resolve()
    } catch (e) {
      reject(e)
    }
  })
}

const SUBSCRIBECHANNEL_Q = 'INSERT INTO CHANNEL_USER_ASSIGN (USER_ID, CHANNEL_ID) VALUES(?, ?)'
pool.subscribeChannel = (user, channel) => {
  return new Promise(async (resolve, reject) => {
    if (!user || !channel) {
      reject(new Error('Missing a required field'))
      return
    }

    try {
      await pool.query(SUBSCRIBECHANNEL_Q, [user, channel])
      resolve()
    } catch (e) {
      reject(e)
    }
  })
}

const SEARCHUSERS_Q = 'SELECT USERNAME, USER_ID FROM USER WHERE USERNAME LIKE ? LIMIT ?'
pool.getSearchForUsers = (searchFor, limit) => {
  return new Promise(async (resolve, reject) => {
    if (!searchFor || !limit) {
      reject(new Error('Missing required field'))
      return
    }

    try {
      const wildcard = searchFor.concat('%')
      const results = await pool.query(SEARCHUSERS_Q, [wildcard, limit])
      const userArray = []
      if (results.length > 0) {
        for (let i = 0; i < results.length; i++) {
          const USER = {
            id: results[i].USER_ID,
            name: results[i].USERNAME
          }
          userArray[i] = USER
        }
        resolve(userArray)
      } else {
        resolve([])
      }
    } catch (e) {
      console.log(e)
      reject(e)
    }
  })
}

const NUMUSERSSEARCH_Q = 'SELECT USERNAME, USER_ID FROM USER WHERE USERNAME LIKE ?'
pool.getNumUsersSearch = searchFor => {
  return new Promise(async (resolve, reject) => {
      if (!searchFor) {
      reject(new Error('Missing required field'))
      return
    }

    try {
      const wildcard = searchFor.concat('%')
      const results = await pool.query(NUMUSERSSEARCH_Q, [wildcard])
      resolve(results.length)
    } catch (e) {
      reject(e)
    }
  })
}

const SEARCHCHANNELS_Q = 'SELECT CHANNEL_NAME, CHANNEL_ID FROM CHANNEL WHERE CHANNEL_NAME LIKE ? LIMIT ?'
pool.getSearchForChannels = (searchFor, limit) => {
  return new Promise(async (resolve, reject) => {
    if (!searchFor || !limit) {
    reject(new Error('Missing required field'))
    return
  }

  try {
    const wildcard = searchFor.concat('%')
    const results = await pool.query(SEARCHCHANNELS_Q, [wildcard, limit])
    const channelArray = []
    if (results.length > 0) {
      for (let i = 0; i < results.length; i++) {
        const Channel = {
          id: results[i].CHANNEL_ID,
          name: results[i].CHANNEL_NAME
        }
        channelArray[i] = Channel
      }
      resolve(channelArray)
    } else {
      resolve([])
    }
  } catch (e) {
    console.log(e)
    reject(e)
  }
})
}

const NUMCHANNELSSEARCH_Q = 'SELECT CAHNNEL_NAME, CHANNEL_ID FROM CAHNNEL WHERE CHANNEL_NAME LIKE ?'
pool.getNumChannelsSearch = searchFor => {
  return new Promise(async (resolve, reject) => {
    if (!searchFor) {
    reject(new Error('Missing required field'))
    return
  }

  try {
    const wildcard = searchFor.concat('%')
    const results = await pool.query(NUMCHANNELSSEARCH_Q, [wildcard])
    resolve(results.length)
  } catch (e) {
    reject(e)
  }
})
}

const SEACHUSERANDCHANNEL_Q = 'SELECT CHANNEL_ID, CHANNEL_NAME, USER_ID, USERNAME FROM ((SELECT CHANNEL_ID, CHANNEL_NAME, \' \' AS USER_ID, \' \' AS USERNAME FROM CHANNEL) UNION (SELECT \' \' AS CHANNEL_ID, \' \' AS CHANNEL_NAME, USER_ID, USERNAME FROM USER)) AS USERCHANNEL WHERE CHANNEL_NAME LIKE ? OR USERNAME LIKE ? LIMIT ?'

pool.getSearchForChannelsAndUsers = (searchFor, limit) => {
  return new Promise(async (resolve, reject) => {
    if (!searchFor || !limit) {
      reject(new Error('Missing required field'))
      return
    }

    try {
      const wildcard = searchFor.concat('%')
      const results = await pool.query(SEACHUSERANDCHANNEL_Q, [wildcard, wildcard, limit])
      const channelUserArray = []
      if (results.length > 0) {
        for (let i = 0; i < results.length; i++) {
          const channelUser = {
            cid: results[i].CHANNEL_ID,
            cname: results[i].CHANNEL_NAME,
            uid: results[i].USER_ID,
            username: results[i].USERNAME
          }
          channelUserArray[i] = channelUser
        }
        resolve(channelUserArray)
      } else {
        resolve([])
      }
    } catch (e) {
      console.log(e)
      reject(e)
    }
  })
}

const NUMCHANNELSANDUSERSEARCH_Q = 'SELECT CHANNEL_ID, CHANNEL_NAME, USER_ID, USERNAME FROM ((SELECT CHANNEL_ID, CHANNEL_NAME, \' \' AS USER_ID, \' \' AS USERNAME FROM CHANNEL) UNION (SELECT \' \' AS CHANNEL_ID, \' \' AS CHANNEL_NAME, USER_ID, USERNAME FROM USER)) AS USERCHANNEL WHERE CHANNEL_NAME LIKE ? OR USERNAME LIKE ?'

pool.getNumChannelsAndUsersSearch = searchFor => {
    return new Promise(async (resolve, reject) => {
      if (!searchFor) {
        reject(new Error('Missing required field'))
        return
      }

    try {
      const wildcard = searchFor.concat('%')
      const results = await pool.query(NUMCHANNELSANDUSERSEARCH_Q, [wildcard, wildcard])
      resolve(results.length)
    } catch (e) {
      reject(e)
    }
  })
}

const CHECKLIKES_Q = 'SELECT USER_ID, PRODUCT_ID FROM LIKES WHERE USER_ID = ? AND PRODUCT_ID = ?'
const CHECKDISLIKES_Q = 'SELECT USER_ID, PRODUCT_ID FROM DISLIKE WHERE USER_ID = ? AND PRODUCT_ID = ?'
pool.getUserPreference = (userID, productID) => {
  return new Promise(async (resolve, reject) => {
      if (!userID || !productID) {
        reject(new Error('Missing required field'))
        return
    }

    try {
      const likeresults = await pool.query(CHECKLIKES_Q, [userID, productID])
      const dislikeresults = await pool.query(CHECKDISLIKES_Q, [userID, productID])
      if (likeresults.length > 0) {
        resolve('like')
      } else if (dislikeresults.length > 0) {
        resolve('dislike')
      } else {
        resolve('none')
      }
    } catch (e) {
      reject(e)
    }
  })
}

module.exports = pool
