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
              <h4 class="title has-text-centered is-4">Login</h4>
              <article class="message is-danger" v-show="failureMessage">
                <div class="message-body">
                  {{ failureMessage }}
                </div>
              </article>
              <div class="field">
                <label class="label">Username</label>
                <div class="control">
                  <input class="input" type="text" placeholder="Username" v-model="user.UserName" />
                </div>
              </div>
              <div class="field">
                <label class="label">Password</label>
                <div class="control">
                  <input class="input" type="password" placeholder="Password" v-model="user.Password" @keydown.enter="login"/>
                </div>
              </div>
              <hr>
              <div class="control">
                <button class="button is-primary" @click="login">Login</button>
              </div>
            </div>
            <p class="has-text-centered">
              Don't have an account?
              <router-link :to="{ name: 'Register' }"><u>Register</u></router-link>
            </p>
            <p class="has-text-centered">
              Forgot your password?
              <router-link :to="{name: 'ResetPassword', params:{token: '/'}}"><u>Reset Password</u></router-link>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import Register from './Register'
  import ResetPassword from './RecoverPassword'
  import { mapMutations } from 'vuex'
  var Classes = require('../TypeScriptFolder/Compliled/Classes').Classes

  export default {
    name: 'LogIn',
    data () {
      return {
        user: new Classes.User(),
        failureMessage: ''
      }
    },
    components: {
      'ResetPassword': ResetPassword,
      'Register': Register
    },
    methods: {
      ...mapMutations([
        'setUser'
      ]),
      login () {
        if (this.user.UserName !== '' && this.user.Password !== '') {
          const loginInfo = {
            username: this.user.UserName,
            password: this.user.Password
          }

          this.$http.post('/api/login', loginInfo)
            .then(response => { // Success
              if (response.data.success) {
                this.user.Id = response.data.id
                this.user.FirstName = response.data.firstName
                this.user.LastName = response.data.lastName
                this.user.Email = response.data.email
                this.$store.commit('setUser', this.user)
                this.$router.push({ name: 'Browse' })
              } else {
                this.failureMessage = response.data.message
              }
            }, response => { // Failure
              this.failureMessage = response.data.message
            })
        } else {
          this.failureMessage = 'Username or password cannot be blank'
        }
      }
    }
  }
</script>
