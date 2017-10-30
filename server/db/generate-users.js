'use strict'

require('dotenv').config()
const mysql = require('promise-mysql')
const bcrypt = require('bcrypt')
const crypto = require('crypto-promise')
const faker = require('faker')
const fs = require('fs')
const path = require('path')

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

const count = process.argv[2]
const filename = process.argv[3]

const INSERT_USER_Q = `INSERT INTO USER
(USERNAME, USER_LNAME, USER_FNAME, USER_EMAIL, USER_PASS_HASH, VERIFIED)
VALUES(?, ?, ?, ?, ?, ?)`
const STORE_USER_CHANNEL_Q = 'INSERT INTO CHANNEL_USER_ASSIGN (CHANNEL_ID, USER_ID) VALUES ?;'
async function generateUser (count) {
  try {
    const [ firstName, lastName ] = faker.name.findName().split(' ')
    const username = `${faker.hacker.noun()}${faker.random.number(100)}`
    const email = `${faker.hacker.noun()}${faker.random.number(count * 100)}@null`
    const password = `${faker.hacker.ingverb()}${faker.hacker.noun()}`
    const hash = await bcrypt.hash(password, 10)
    const channelsNonunique = [...(await crypto.randomBytes(16))].map(num => (num % 16) + 1)
    const channels = channelsNonunique
      .filter((elem, pos) => channelsNonunique.indexOf(elem) === pos)
      .slice(0, 4)
    const results = await pool.query(INSERT_USER_Q, [
      username,
      lastName,
      firstName,
      email,
      hash,
      1
    ])
    const values = channels.map(channel => [ channel, results.insertId ])

    await pool.query(STORE_USER_CHANNEL_Q, [ values ])
    return {
      username,
      password,
      firstName,
      lastName,
      email
    }
  } catch (e) {
    console.log(e)
  }
}

(async function (count, filename = 'users.json') {
  const users = []
  for (let i = 0; i < count; i++) {
    const newUser = await generateUser(count)
    users.push(newUser)
  }

  fs.writeFileSync(path.join(__dirname, filename), JSON.stringify(users, null, 2))
  process.exit()
})(count, filename)
