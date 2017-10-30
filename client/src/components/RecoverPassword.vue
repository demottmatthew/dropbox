<template>
  <div class="hero is-fullheight">
    <div v-if="!$route.query.token" class="hero-body">
      <div class="container">
        <div class="columns is-vcentered">
          <div class="column is-4 is-offset-4">
            <h4 class="title has-text-centered is-4">
              <img src="../assets/brand_central_icon.png" style="max-width: 20%">
            </h4>
            <div class="box">
              <h4 class="title has-text-centered is-4">Recover Password</h4>
              <article class="message is-danger" v-show="failureMessage">
                <div class="message-body">
                  {{ failureMessage }}
                </div>
              </article>

              <div class="field">
                <label class="label">Account Email</label>
                <div class="control">
                  <input class="input" type="text" placeholder="Email" name="email" v-model="Email" v-validate="{ required: true, email: true}"/>
                </div>
                <p class="help is-danger" v-show="errors.has('email')">{{ errors.first('email') }}</p>
              </div>

              <hr>
              <div class="control">
                <button class="button is-primary" @click="sendEmail">Send Email</button>
                <router-link class="button is-pulled-right" :to="{ name: 'Login' }">Cancel</router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="hero-body">
      <div class="container">
        <div class="columns is-vcentered">
          <div class="column is-4 is-offset-4">
            <h4 class="title has-text-centered is-4">
              <img src="../assets/brand_central_icon.png" style="max-width: 20%">
            </h4>
            <div class="box">
              <h4 class="title has-text-centered is-4">Reset Password</h4>
              <article class="message is-danger" v-show="failureMessage">
                <div class="message-body">
                  {{ failureMessage }}
                </div>
              </article>

              <div class="field">
                <label class="label">New Password</label>
                <div class="control">
                  <input class="input" type="password" placeholder="New Password" name="password"  v-model="NewPassword" v-validate="{ required: true, min: 8 }"/>
                </div>
                <p class="help is-danger" v-show="errors.has('password')">{{ errors.first('password') }}</p>
              </div>
              <div class="field">
                <label class="label">Confirm Password</label>
                <div class="control">
                  <input class="input" type="password" placeholder="Password confirmation" name="confirm password"  v-model="VerifyNewPassword" v-validate="{ required: true, confirmed: 'password' }"/>
                </div>
                <p class="help is-danger" v-show="errors.has('confirm password')">{{ errors.first('confirm password') }}</p>
              </div>

              <hr>
              <div class="control">
                <button class="button is-primary" @click="reset">Reset Password</button>
                <router-link class="button is-pulled-right" :to="{ name: 'Login' }">Cancel</router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    props: {
      token: {
        default: ''
      }
    },
    data () {
      return {
        Email: '',
        NewPassword: '',
        VerifyNewPassword: '',
        failureMessage: ''
      }
    },
    methods: {
      sendEmail () {
        // Quit if any inputs are invalid
        this.$validator.validateAll()
        if (this.errors.any()) {
          return
        }

        this.$http.post('/api/password/reset', {
          email: this.Email
        })
          .then(response => { // Success
            if (response.data.success) {
              this.$router.push({ name: 'Login' })
            } else {
              this.failureMessage = response.data.message
            }
          }, response => { // Error
            this.failureMessage = response.data.message
          })
      },
      reset () {
        if (!this.$route.query.token) return

        // Quit if any inputs are invalid
        this.$validator.validateAll()
        if (this.errors.any()) {
          return
        }

        var body = {
          token: this.$route.query.token,
          newPassword: this.NewPassword
        }

        this.$http.post(`/api/password/reset`, body)
          .then(response => { // Success
            if (response.body.success) {
              this.$router.push({ name: 'Login' })
            } else {
              this.failureMessage = response.data.message
            }
          }, response => { // Error
            this.failureMessage = response.data.message
          })
      }
    }
  }
</script>

