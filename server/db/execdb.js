/*
 * setup.js -- Sets up the database.
 */
'use strict'

require('dotenv').config()
const cp = require('child_process')
const commandPassword = `mysql -u${process.env.DB_USER} -p${process.env.DB_PASS} < ${process.argv[2]}.sql`
const commandNoPassword = `mysql -u${process.env.DB_USER} < ${process.argv[2]}.sql`
cp.exec(process.env.DB_PASS === '' ? commandNoPassword : commandPassword,
  function (error, stdout, stderr) {
    if (error) {
      console.log(error)
      return
    }

    if (process.argv[2] === 'setup') {
      console.log('\x1b[32m%s\x1b[0m', 'DATABASES INITIALIZED')
    } else if (process.argv[2] === 'teardown') {
      console.log('\x1b[31m%s\x1b[0m', 'DATABASES DROPPED')
    }
  })
