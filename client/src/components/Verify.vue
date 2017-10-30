<template>
  <div class="hero is-fullheight">
    <div class="hero-body">
      <div class="container">
        <div class="columns is-vcentered">
          <div class="column is-4 is-offset-4">
            <div class="box">
              <h4 class="title has-text-centered is-4 is-spaced">
                Verify Email Address
              </h4>
              <h2 class="is-spaced" style="padding-bottom: 20px;">
                Enter the six digit verification code we just sent to you.
              </h2>
              <article class="message is-danger" v-show="failureMessage">
                <div class="message-body">
                  {{ failureMessage }}
                </div>
              </article>
              <div class="field">
                <label class="label">Verification Code</label>
                <div class="control">
                  <input class="input" type="text" placeholder="123456" name="code" v-model="code" v-validate="{ min: 6 }"/>
                </div>
                <p class="help is-danger" v-show="errors.has('code')">{{ errors.first('code') }}</p>
              </div>
              <hr>
              <div class="control">
                <button class="button is-primary" v-bind:disabled="code.length != 6" v-on:click="verify">Continue</button>
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
    data () {
      return {
        VerifyDisplayFlags: {
          Loading: true,
          Failed: false
        },
        code: '',
        failureMessage: ''
      }
    },
    mounted () {
      this.verify()
    },
    methods: {
      verify () {
        const token = this.$route.query.token
        const code = this.$route.query.code
        var body = {}
        if (token) {
          body.token = token
        } else if (code && code.length === 6) {
          body.code = code
        } else if (this.code.length === 6) {
          body.code = this.code
        } else {
          // stop if neither the code or token is provided
          return
        }
        this.$http.post(`/api/verify`, body)
          .then(response => {
            if (response.body.success) {
              this.$http.get(`/api/user/${this.$store.state.User.Id}/channels`)
                .then(response => {
                  if (response.body.success) {
                    if (response.body.channels.length === 0) {
                      this.$router.push({ name: 'Interests' })
                    } else {
                      this.$router.push({ name: 'Browse' })
                    }
                  } else {
                    this.failureMessage = response.body.message
                  }
                }, response => {
                  console.log(response)
                })
            } else {
              this.failureMessage = response.body.message
            }
          }, response => {
            console.log(response)
          })
      }
    }
  }
</script>
