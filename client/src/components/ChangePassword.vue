<template>
  <div class="column is-10">
    <div class="column is-12 columns is-multiline">
      <div class="column is-12 is-size-5">
        <h1 class="title is-size-2.5">Password</h1>
        <article class="message is-danger" v-show="failureMessage">
          <div class="message-body">
            {{ failureMessage }}
          </div>
        </article>
        <div class="field">
          <label class="label">Current password</label>
          <div class="control">
            <input class="input" type="password" placeholder="Current password" v-model="passwordVerification.CurrentPassword" />
          </div>
          <p class="help">You must provide your current password in order to change it.</p>
        </div>
        <div class="field">
          <label class="label">New password</label>
          <div class="control">
            <input class="input" type="password" placeholder="New password" name="password" v-model="passwordVerification.NewPassword" v-validate="{ required: true, min: 8 }"/>
          </div>
          <p class="help is-danger" v-show="errors.has('password')">{{ errors.first('password') }}</p>
        </div>
        <div class="field">
          <label class="label">Password confirmation</label>
          <div class="control">
            <input class="input" type="password" placeholder="Password confirmation" name="confirm password" v-model="passwordVerification.VerifyNewPassword" v-validate="{ required: true, confirmed: 'password' }"/>
          </div>
          <p class="help is-danger" v-show="errors.has('confirm password')">{{ errors.first('confirm password') }}</p>
        </div>
        <button class="button is-primary" @click="changePassword">Change Password</button>
        <router-link class="button is-pulled-right" :to="{ name: 'EditProfile' }">Cancel</router-link>
      </div>
    </div>
  </div>
</template>

<script>
  import EditProfile from './EditProfile'
  var Classes = require('../TypeScriptFolder/Compliled/Classes').Classes

  export default {
    name: 'ChangePassword',
    data () {
      return {
        user: this.$store.state.User,
        passwordVerification: new Classes.PasswordVerification(),
        failureMessage: ''
      }
    },
    components: {
      'EditProfile': EditProfile
    },
    methods: {
      changePassword () {
        // Quit if any inputs are invalid
        this.$validator.validateAll()
        if (this.errors.any()) {
          return
        }
        const passwordVerificationBody = {
          password: this.passwordVerification.CurrentPassword
        }
        // TODO: We should combine these two requests into a single request.
        this.$http.post('/api/verify/password', passwordVerificationBody)
          .then(response => {
            if (response.data.success) {
              this.user.Password = this.passwordVerification.NewPassword
              this.$http.post(`/api/profile/${this.user.Id}`, {
                password: this.passwordVerification.NewPassword
              })
                .then(response => {
                  console.log(response)
                }, response => {
                  console.log(response)
                })
              this.$router.go(-1)
            } else {
              this.failureMessage = response.data.message
            }
          }, response => { // Failure
            this.failureMessage = response.data.message
          })
      }
    }
  }
</script>
