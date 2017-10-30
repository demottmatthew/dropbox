<template>
  <div class="hero is-fullheight">
    <div class="hero-body">
      <div class="container">
        <div class="columns is-vcentered">
          <div class="column is-4 is-offset-4">
            <h4 class="title has-text-centered is-4">
              <img src="../assets/brand_central_icon.png" style="max-width: 20%">
            </h4>
            <div class="box">
              <h4 class="title has-text-centered is-4">Register Account</h4>
              <article class="message is-danger" v-show="failureMessage">
                <div class="message-body">
                  {{ failureMessage }}
                </div>
              </article>
              <div class="field">
                <label class="label">First Name</label>
                <div class="control">
                  <input class="input" type="text" placeholder="First Name" v-model="user.FirstName" />
                </div>
              </div>
              <div class="field">
                <label class="label">Last Name</label>
                <div class="control">
                  <input class="input" type="text" placeholder="Last Name" v-model="user.LastName" />
                </div>
              </div>
              <div class="field">
                <label class="label">Username</label>
                <div class="control">
                  <input class="input" type="text" placeholder="Username" name="username" v-model="user.UserName" v-validate="{ required: true }"/>
                </div>
                <p class="help is-danger" v-show="errors.has('username')">{{ errors.first('username') }}</p>
              </div>
              <div class="field">
                <label class="label">Email</label>
                <div class="control">
                  <input class="input" type="text" placeholder="Email" name="email" v-model="user.Email" v-validate="{ required: true, email: true}"/>
                </div>
                <p class="help is-danger" v-show="errors.has('email')">{{ errors.first('email') }}</p>
              </div>
              <hr>
              <div class="field">
                <label class="label">Password</label>
                <div class="control">
                  <input class="input" type="password" placeholder="Password" name="password" v-model="user.Password" v-validate="{ required: true, min: 8}"/>
                </div>
                <p class="help is-danger" v-show="errors.has('password')">{{ errors.first('password') }}</p>
              </div>
              <div class="field">
                <label class="label">Confirm Password</label>
                <div class="control">
                  <input class="input" type="password" placeholder="Confirm Password" name="confirm password"v-model="confirmPassword" @keydown.enter="login" v-validate="{required: true, confirmed: 'password'}"/>
                </div>
                <p class="help is-danger" v-show="errors.has('confirm password')">{{ errors.first('confirm password') }}</p>
              </div>
              <hr>
              <div class="control">
                <button class="button is-primary" @click="register">Register</button>
              </div>
            </div>
            <p class="has-text-centered">
                Already have an account?
                <router-link :to="{ name: 'Login' }"><u>Login</u></router-link>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  var Classes = require('../TypeScriptFolder/Compliled/Classes').Classes

  export default {
    name: 'Register',
    data () {
      return {
        user: new Classes.User(),
        confirmPassword: '',
        failureMessage: ''
      }
    },
    methods: {
      register () {
        // Quit if any inputs are invalid
        this.$validator.validateAll()
        if (this.errors.any()) {
          return
        }

        // Basic validation
        if (this.user.UserName === '') {
          this.failureMessage = 'Username cannot be blank'
          return
        }
        if (this.user.Password !== this.confirmPassword) {
          this.failureMessage = 'Passwords must match'
          return
        }
        // Everything looks okay
        const registration = {
          username: this.user.UserName,
          firstName: this.user.FirstName,
          lastName: this.user.LastName,
          password: this.user.Password,
          email: this.user.Email
        }
        this.$http.post('/api/register', registration)
          .then(response => { // Success
            if (response.data.success) {
              this.$router.push({ name: 'Verify' })
            } else {
              console.log(response)
              this.failureMessage = response.data.message
            }
          }, response => { // Error
            console.log(response)
            this.failureMessage = response.data.message
          })
      }
    }
  }
</script>
