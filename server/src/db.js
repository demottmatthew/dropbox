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
(USERNAME, USER_LNAME, USER_FNAME, USER_EMAIL, USER_PASS_HASH, VER_TOKEN, VER_CODE)
VALUES(?, ?, ?, ?, ?, ?, ?)`
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
const LOGIN_Q = 'SELECT USER_ID, USER_LNAME, USER_FNAME, USER_EMAIL, USER_PASS_HASH, VERIFIED FROM USER WHERE USERNAME = ?'
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
          email: results[0].USER_EMAIL
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

const UPLOAD_Q = 'INSERT INTO FILES (FILENAME, FILESIZE, FILEDATA, TIME_SUBMITTED, USER_ID) VALUES(?, ?, ?, ?, ?)'

pool.uploadFile = (filename, filesize, file, uid) => {
    return new Promise(async (resolve, reject) => {
        if (!filename || !filesize || !file || !uid) {
        reject(new Error('Missing a required field'))
        return
    }

    try {
        await pool.query(UPLOAD_Q, [filename, filesize, file, moment().format('YYYY-MM-DD HH:mm:ss'), uid])
        resolve()
    } catch (e) {
        reject(e)
    }
  })
}

const FILES_Q = 'SELECT FILENAME, FILESIZE, FILEDATA FROM FILES LIMIT ?,?'
pool.getFiles = (page, filesPerPage) => {
    return new Promise(async (resolve, reject) => {
        if (!filesPerPage || !page) {
        reject(new Error('Missing required field'))
    }

    try {
        const startfile = ((page - 1) * filesPerPage)
        const endfile = (page * filesPerPage)
        const results = await pool.query(FILES_Q, [startfile, endfile ])
        const filesarray = []
        if (results.length > 0) {
            for (let i = 0; i < results.length; i++) {
                const file = {
                    filename: results[i].FILENAME,
                    filesize: results[i].FILESIZE,
                    file: results[i].FILEDATA
                }
                filesarray[i] = file
            }
            resolve(filesarray)
        } else {
            resolve([])
        }
    } catch (e) {
        console.log(e)
        reject(e)
    }
})
}

const NUMFILES_Q = 'SELECT FILENAME, FILESIZE, FILEDATA FROM FILES'
pool.getNumFiles = user=> {
    return new Promise(async (resolve, reject) => {
    try {
        const results = await pool.query(NUMFILES_Q, [])
        resolve(results.length)
    } catch (e) {
        reject(e)
    }
})
}

module.exports = pool
