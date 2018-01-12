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
pool.verifyPassword = (user, pass) => {
  return new Promise(async (resolve, reject) => {
    if (!user || !pass) {
        reject(new Error('Missing a required field'))
        return
    }
    try {
      const results = await pool.query(GETPASSHASH_Q, [ user ])

      if (results.length === 0) {
        resolve(false)
      }
      const res = await bcrypt.compare(pass, results[0].USER_PASS_HASH)
      if (res) {
        // successful
        resolve(true)
      } else {
        // failure
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
      // const passwordCheck = await verifyPassword(id, info.password)
        const passwordCheck = true
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
      console.error(e);
        reject(e)
    }
  })
}

// const FILES_Q = 'SELECT FILENAME, FILESIZE,  CONVERT(FILEDATA USING utf8) AS FDATA FROM FILES LIMIT ?,?'
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
        // var btoa = require('btoa')
        if (results.length > 0) {
            for (let i = 0; i < results.length; i++) {
                const file = {
                    filename: results[i].FILENAME,
                    filesize: results[i].FILESIZE,
                    // const blob = new Blob(atob(el.file), { type: `application/${nameArr[nameArr.length - 1]}` })
                    // file: Buffer(results[i].FILEDATA, 'base64').toString('base64')
                    // file: Buffer(new Blob(results[i].FILEDATA, { type: `application/${nameArr[nameArr.length - 1]}` }), 'base64').toString('base64')
                    // file: results[i].FILEDATA
                    file: Buffer(results[i].FILEDATA, 'base64').toString('base64')
                }
                // const test = Buffer(file.file, 'base64').toString('base64')
                const test = Buffer(file.file, 'base64').toString('base64')
                console.log(test);
                console.log(Buffer.from(test, 'base64'));
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


const ADDAPPOINTMENT_Q = 'INSERT INTO APPOINTMENTS (TITLE, DESCRIPTION, APP_DATE, APP_STARTTIME, APP_ENDTIME, USER_ID) VALUES(?, ?, ?, ?, ?, ?)'

pool.addAppointment = (title, desc, date, starttime, endtime, uid) => {
    return new Promise(async (resolve, reject) => {
        if (!title || !desc || !date || !starttime || !endtime || !uid) {
        reject(new Error('Missing a required field'))
        return
    }
    try {
        await pool.query(ADDAPPOINTMENT_Q, [title, desc, date, starttime, endtime, uid])
        resolve()
    } catch (e) {
        console.error(e);
        reject(e)
    }
})
}

const APPS_Q = `SELECT APP_ID, TITLE, DESCRIPTION, SUBSTRING(APP_DATE, 1, 10) AS ADATE, SUBSTRING(APP_STARTTIME, 1, 5) AS ASTARTTIME, 
SUBSTRING(APP_ENDTIME, 1, 5) AS AENDTIME, USER_FNAME, USER_LNAME, APPOINTMENTS.USER_ID FROM (APPOINTMENTS INNER JOIN USER ON APPOINTMENTS.USER_ID = USER.USER_ID) 
ORDER BY APP_DATE, ASTARTTIME ASC LIMIT ?,?`

const userAPPS_Q = `SELECT APP_ID, TITLE, DESCRIPTION, SUBSTRING(APP_DATE, 1, 10) AS ADATE, SUBSTRING(APP_STARTTIME, 1, 5) AS ASTARTTIME, 
SUBSTRING(APP_ENDTIME, 1, 5) AS AENDTIME, USER_FNAME, USER_LNAME, APPOINTMENTS.USER_ID FROM (APPOINTMENTS INNER JOIN USER ON APPOINTMENTS.USER_ID = USER.USER_ID) WHERE USER.USER_ID = ?
ORDER BY APP_DATE, ASTARTTIME ASC LIMIT ?,?`
pool.getApps = (page, appsPerPage, uid) => {
    return new Promise(async (resolve, reject) => {
        if (!appsPerPage || !page) {
        reject(new Error('Missing required field'))
    }

    try {
        const start = ((page - 1) * appsPerPage)
        const end = (page * appsPerPage)
        var results = ''
        if(!uid){
            results = await pool.query(APPS_Q, [start, end ])
        } else {
            results = await pool.query(userAPPS_Q, [uid, start, end ])
        }
        const appsarray = []
        if (results.length > 0) {
            for (let i = 0; i < results.length; i++) {
                var date = results[i].ADATE
                date = date.substring(5, 7) + '-' + date.substring(8, 10) + '-' + date.substring(0, 4)
                var starttime = results[i].ASTARTTIME
                var endtime = results[i].AENDTIME
                var starthours = parseInt(starttime.substring(0,2))
                var startmins = starttime.substring(3,6)
                var endhours = parseInt(endtime.substring(0,2))
                var endmins = endtime.substring(3,6)
                var convertedstartHours = 0
                var convertedendHours = 0
                var AM_PM = ' AM'
                if (starthours >= 13 && starthours < 24) {
                    convertedstartHours = starthours - 12
                    AM_PM = ' PM'
                    starttime = convertedstartHours.toString() + ':' + startmins.toString() + AM_PM
                } else if (starthours === 12) {
                    AM_PM = ' PM'
                    starttime = starttime + AM_PM
                } else if (starthours >= 24) {
                    convertedstartHours = starthours - 12
                    AM_PM = ' AM'
                    starttime = convertedstartHours.toString() + ':' + startmins.toString() + AM_PM
                } else {
                    starttime = starttime + AM_PM
                }
                AM_PM = ' AM'
                if (endhours >= 13 && endhours < 24) {
                    convertedendHours = endhours - 12
                    AM_PM = ' PM'
                    endtime = convertedendHours.toString() + ':' + endmins.toString() + AM_PM
                } else if (endhours === 12) {
                    AM_PM = ' PM'
                    endtime = endtime + AM_PM
                } else if (endhours >= 24) {
                    convertedendHours = endhours - 12
                    AM_PM = ' AM'
                    endtime = convertedendHours.toString() + ':' + endmins.toString() + AM_PM
                } else {
                    endtime = endtime + AM_PM
                }
                const app = {
                    appid: results[i].APP_ID,
                    title: results[i].TITLE,
                    description: results[i].DESCRIPTION,
                    date: date,
                    starttime: starttime,
                    endtime: endtime,
                    fname: results[i].USER_FNAME,
                    lname: results[i].USER_LNAME,
                    userID: results[i].USER_ID
                }
                appsarray[i] = app
            }
            resolve(appsarray)
        } else {
            resolve([])
        }
    } catch (e) {
        console.log(e)
        reject(e)
    }
})
}

const NUMAPPS_Q = `SELECT TITLE, DESCRIPTION, APP_DATE, APP_STARTTIME, APP_ENDTIME, USER_FNAME, USER_LNAME, APPOINTMENTS.USER_ID FROM 
(APPOINTMENTS INNER JOIN USER ON APPOINTMENTS.USER_ID = USER.USER_ID)`

const userNUMAPPS_Q = `SELECT TITLE, DESCRIPTION, APP_DATE, APP_STARTTIME, APP_ENDTIME, USER_FNAME, USER_LNAME, APPOINTMENTS.USER_ID FROM 
(APPOINTMENTS INNER JOIN USER ON APPOINTMENTS.USER_ID = USER.USER_ID) WHERE USER.USER_ID = ?`
pool.getNumApps = uid => {
    return new Promise(async (resolve, reject) => {
        try {
            var results = ''
            if(!uid){
                results = await pool.query(NUMAPPS_Q, [])
            } else {
                results = await pool.query(userNUMAPPS_Q, [uid])
            }
            resolve(results.length)
        } catch (e) {
                reject(e)
            }
        })
}

const searchAPPS_Q = `SELECT APP_ID, TITLE, DESCRIPTION, SUBSTRING(APP_DATE, 1, 10) 
AS ADATE, SUBSTRING(APP_STARTTIME, 1, 5) AS ASTARTTIME, SUBSTRING(APP_ENDTIME, 1, 5) AS AENDTIME, USER_FNAME, USER_LNAME, APPOINTMENTS.USER_ID FROM 
(APPOINTMENTS INNER JOIN USER ON APPOINTMENTS.USER_ID = USER.USER_ID) WHERE TITLE LIKE ? OR DESCRIPTION LIKE ? OR USER_FNAME LIKE ? OR USER_LNAME LIKE ? ORDER BY APP_DATE, 
ASTARTTIME ASC LIMIT ?,?`
const searchUserAPPS_Q = `SELECT APP_ID, TITLE, DESCRIPTION, SUBSTRING(APP_DATE, 1, 10) AS ADATE, SUBSTRING(APP_STARTTIME, 1, 5) 
AS ASTARTTIME, SUBSTRING(APP_ENDTIME, 1, 5) AS AENDTIME, USER_FNAME, USER_LNAME, APPOINTMENTS.USER_ID FROM (APPOINTMENTS INNER JOIN USER ON APPOINTMENTS.USER_ID = USER.USER_ID) 
WHERE USER.USER_ID = ? AND (TITLE LIKE ? OR DESCRIPTION LIKE ? OR USER_FNAME LIKE ? OR USER_LNAME LIKE ?) ORDER BY APP_DATE, ASTARTTIME ASC LIMIT ?,?`
pool.searchApps = (page, appsPerPage, searchString, uid) => {
    return new Promise(async (resolve, reject) => {
        if (!appsPerPage || !page || !searchString) {
        reject(new Error('Missing required field'))
    }

    try {
        const wildcardSearchString = '%' + searchString + '%'
        const start = ((page - 1) * appsPerPage)
        const end = parseInt(appsPerPage)
        var results = ''
        if(!uid){
            results = await pool.query(searchAPPS_Q, [wildcardSearchString, wildcardSearchString, wildcardSearchString, wildcardSearchString, start, end])
        } else {
            results = await pool.query(searchUserAPPS_Q, [uid, wildcardSearchString, wildcardSearchString, wildcardSearchString, wildcardSearchString, start, end])
        }
        const appsarray = []
        if (results.length > 0) {
            for (let i = 0; i < results.length; i++) {
                var date = results[i].ADATE
                date = date.substring(5, 7) + '-' + date.substring(8, 10) + '-' + date.substring(0, 4)
                var starttime = results[i].ASTARTTIME
                var endtime = results[i].AENDTIME
                var starthours = parseInt(starttime.substring(0,2))
                var startmins = starttime.substring(3,6)
                var endhours = parseInt(endtime.substring(0,2))
                var endmins = endtime.substring(3,6)
                var convertedstartHours = 0
                var convertedendHours = 0
                var AM_PM = ' AM'
                if (starthours >= 13 && starthours < 24) {
                    convertedstartHours = starthours - 12
                    AM_PM = ' PM'
                    starttime = convertedstartHours.toString() + ':' + startmins.toString() + AM_PM
                } else if (starthours === 12) {
                    AM_PM = ' PM'
                    starttime = starttime + AM_PM
                } else if (starthours >= 24) {
                    convertedstartHours = starthours - 12
                    AM_PM = ' AM'
                    starttime = convertedstartHours.toString() + ':' + startmins.toString() + AM_PM
                } else {
                    starttime = starttime + AM_PM
                }
                AM_PM = ' AM'
                if (endhours >= 13 && endhours < 24) {
                    convertedendHours = endhours - 12
                    AM_PM = ' PM'
                    endtime = convertedendHours.toString() + ':' + endmins.toString() + AM_PM
                } else if (endhours === 12) {
                    AM_PM = ' PM'
                    endtime = endtime + AM_PM
                } else if (endhours >= 24) {
                    convertedendHours = endhours - 12
                    AM_PM = ' AM'
                    endtime = convertedendHours.toString() + ':' + endmins.toString() + AM_PM
                } else {
                    endtime = endtime + AM_PM
                }
                const app = {
                    appid: results[i].APP_ID,
                    title: results[i].TITLE,
                    description: results[i].DESCRIPTION,
                    date: date,
                    starttime: starttime,
                    endtime: endtime,
                    fname: results[i].USER_FNAME,
                    lname: results[i].USER_LNAME,
                    userID: results[i].USER_ID
                }
                appsarray[i] = app
            }
            resolve(appsarray)
        } else {
            resolve([])
        }
    } catch (e) {
        console.log(e)
        reject(e)
    }
})
}

const numSearchAPPS_Q = `SELECT TITLE, DESCRIPTION, SUBSTRING(APP_DATE, 1, 10) 
AS ADATE, SUBSTRING(APP_STARTTIME, 1, 5) AS ASTARTTIME, SUBSTRING(APP_ENDTIME, 1, 5) AS AENDTIME, USER_FNAME, USER_LNAME, APPOINTMENTS.USER_ID FROM 
(APPOINTMENTS INNER JOIN USER ON APPOINTMENTS.USER_ID = USER.USER_ID) WHERE TITLE LIKE ? OR DESCRIPTION LIKE ? OR USER_FNAME LIKE ? OR USER_LNAME LIKE ? ORDER BY APP_DATE, 
ASTARTTIME ASC`

const numSearchUserAPPS_Q = `SELECT TITLE, DESCRIPTION, SUBSTRING(APP_DATE, 1, 10) AS ADATE, SUBSTRING(APP_STARTTIME, 1, 5) 
AS ASTARTTIME, SUBSTRING(APP_ENDTIME, 1, 5) AS AENDTIME, USER_FNAME, USER_LNAME, APPOINTMENTS.USER_ID FROM (APPOINTMENTS INNER JOIN USER ON APPOINTMENTS.USER_ID = USER.USER_ID) 
WHERE USER.USER_ID = ? AND TITLE LIKE ? OR DESCRIPTION LIKE ? OR USER_FNAME LIKE ? OR USER_LNAME LIKE ? ORDER BY APP_DATE, ASTARTTIME ASC`
pool.getNumSearchApps = (searchString, uid) => {
    return new Promise(async (resolve, reject) => {
        const wildcardSearchString = '%' + searchString + '%'
        try {
            var results = ''
            if(!uid){
                results = await pool.query(numSearchAPPS_Q, [wildcardSearchString, wildcardSearchString, wildcardSearchString, wildcardSearchString])
            } else {
                results = await pool.query(numSearchAPPS_Q, [uid, wildcardSearchString, wildcardSearchString, wildcardSearchString, wildcardSearchString])
            }
            resolve(results.length)
        } catch (e) {
            reject(e)
        }
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

const FOLLOWING_Q = 'SELECT USERNAME, USER.USER_FNAME, USER.USER_LNAME, USER.USER_EMAIL, FOLLOWING.USER_FOLLOWED_ID FROM (FOLLOWING INNER JOIN USER ON FOLLOWING.USER_FOLLOWED_ID = USER.USER_ID) WHERE FOLLOWING.FOLLOWER_ID = ?'
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
                    id: results[i].USER_FOLLOWED_ID,
                    firstName: results[i].USER_FNAME,
                    lastName: results[i].USER_LNAME,
                    emailHash: (await crypto.hash('md5')(results[i].USER_EMAIL)).toString('hex')
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

const SEARCHUSERS_Q = 'SELECT USER_ID, USERNAME, USER_FNAME, USER_LNAME, USER_EMAIL FROM USER WHERE CONCAT(USERNAME, USER_FNAME, USER_LNAME) LIKE ? LIMIT ?'
pool.getSearchForUsers = (searchFor, limit) => {
    return new Promise(async (resolve, reject) => {
        if (!searchFor || !limit) {
        reject(new Error('Missing required field'))
        return
    }

    try {
        const wildcard = '%' + searchFor + '%'
        const results = await pool.query(SEARCHUSERS_Q, [wildcard, limit])
        const userArray = []
        if (results.length > 0) {
            for (let i = 0; i < results.length; i++) {
                const USER = {
                    id: results[i].USER_ID,
                    username: results[i].USERNAME,
                    firstName: results[i].USER_FNAME,
                    lastName: results[i].USER_LNAME,
                    emailHash: (await crypto.hash('md5')(results[i].USER_EMAIL)).toString('hex')
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

const NUMUSERSSEARCH_Q = 'SELECT USER_ID, USERNAME, USER_FNAME, USER_LNAME FROM USER WHERE CONCAT(USERNAME, USER_FNAME, USER_LNAME) LIKE ?'
pool.getNumUsersSearch = searchFor => {
    return new Promise(async (resolve, reject) => {
        if (!searchFor) {
            reject(new Error('Missing required field'))
            return
        }

        try {
            const wildcard = '%' + searchFor + '%'
            const results = await pool.query(NUMUSERSSEARCH_Q, [wildcard])
            resolve(results.length)
        } catch (e) {
            reject(e)
        }
    })
}

const getAPP_Q = `SELECT APP_ID, TITLE, DESCRIPTION, SUBSTRING(APP_DATE, 1, 10) AS ADATE, SUBSTRING(APP_STARTTIME, 1, 5) AS ASTARTTIME, 
SUBSTRING(APP_ENDTIME, 1, 5) AS AENDTIME, USER_FNAME, USER_LNAME, APPOINTMENTS.USER_ID FROM (APPOINTMENTS INNER JOIN USER ON APPOINTMENTS.USER_ID = USER.USER_ID) 
WHERE APP_ID = ?`

pool.getApp = (appid) => {
    return new Promise(async (resolve, reject) => {
        if (!appid) {
            reject(new Error('Missing required field'))
        }

        try {
            var results = ''
            results = await pool.query(getAPP_Q, [appid])
            if (results.length > 0) {
                    var date = results[0].ADATE
                    date = date.substring(5, 7) + '-' + date.substring(8, 10) + '-' + date.substring(0, 4)
                    var starttime = results[0].ASTARTTIME
                    var endtime = results[0].AENDTIME
                    var starthours = parseInt(starttime.substring(0,2))
                    var startmins = starttime.substring(3,6)
                    var endhours = parseInt(endtime.substring(0,2))
                    var endmins = endtime.substring(3,6)
                    var convertedstartHours = 0
                    var convertedendHours = 0
                    var AM_PM = ' AM'
                    if (starthours >= 13 && starthours < 24) {
                        convertedstartHours = starthours - 12
                        AM_PM = ' PM'
                        starttime = convertedstartHours.toString() + ':' + startmins.toString() + AM_PM
                    } else if (starthours === 12) {
                        AM_PM = ' PM'
                        starttime = starttime + AM_PM
                    } else if (starthours >= 24) {
                        convertedstartHours = starthours - 12
                        AM_PM = ' AM'
                        starttime = convertedstartHours.toString() + ':' + startmins.toString() + AM_PM
                    } else {
                        starttime = starttime + AM_PM
                    }
                    AM_PM = ' AM'
                    if (endhours >= 13 && endhours < 24) {
                        convertedendHours = endhours - 12
                        AM_PM = ' PM'
                        endtime = convertedendHours.toString() + ':' + endmins.toString() + AM_PM
                    } else if (endhours === 12) {
                        AM_PM = ' PM'
                        endtime = endtime + AM_PM
                    } else if (endhours >= 24) {
                        convertedendHours = endhours - 12
                        AM_PM = ' AM'
                        endtime = convertedendHours.toString() + ':' + endmins.toString() + AM_PM
                    } else {
                        endtime = endtime + AM_PM
                    }
                    const app = {
                        appid: results[0].APP_ID,
                        title: results[0].TITLE,
                        description: results[0].DESCRIPTION,
                        date: date,
                        starttime: starttime,
                        endtime: endtime,
                        fname: results[0].USER_FNAME,
                        lname: results[0].USER_LNAME,
                        userID: results[0].USER_ID
                    }
                resolve(app)
            } else {
                resolve([])
            }
        } catch (e) {
            console.log(e)
            reject(e)
        }
    })
}

const updateAPPOINTMENT_Q = 'UPDATE APPOINTMENTS SET TITLE = ?, DESCRIPTION = ?, APP_DATE = ?, APP_STARTTIME = ?, APP_ENDTIME = ? WHERE APP_ID = ?'

pool.updateApp = (id, title, desc, date, starttime, endtime) => {
    return new Promise(async (resolve, reject) => {
        if (!id || !title || !desc || !date || !starttime || !endtime) {
        reject(new Error('Missing a required field'))
        return
    }
    try {
        await pool.query(updateAPPOINTMENT_Q, [title, desc, date, starttime, endtime, id])
        resolve()
    } catch (e) {
        console.error(e);
        reject(e)
    }
})
}

module.exports = pool
