<template>
  <div class="column is-10">
    <div class="column is-12 columns is-multiline">
      <div class="column is-12 is-size-5">
        <h1 class="title is-size-2.5">Email</h1>
        <article class="message is-danger" v-show="failureMessage">
          <div class="message-body">
            {{ failureMessage }}
          </div>
        </article>
        <div class="field">
          <label class="label">New Email</label>
          <div class="control">
            <input class="input" type="text" placeholder="Email" name="email" v-model="email" v-validate="{ required: true, email: true}"/>
          </div>
          <p class="help is-danger" v-show="errors.has('email')">{{ errors.first('email') }}</p>
        </div>
        <div class="field">
          <label class="label">Current Password</label>
          <div class="control">
            <input class="input" type="password" placeholder="Password" v-model="password" />
          </div>
        </div>
        <button class="button is-primary" @click="changeEmail">Change email address</button>
        <router-link class="button is-pulled-right" :to="{ name: 'EditProfile' }">Cancel</router-link>
      </div>
    </div>
  </div>
</template>


<script>
  export default {
    data () {
      return {
        email: '',
        password: '',
        user: this.$store.state.User,
        failureMessage: ''
      }
    },
    methods: {
      changeEmail () {
        this.$validator.validateAll()
        if (this.errors.any()) {
          return
        }
        const emailModificationBody = {
          email: this.email,
          password: this.password
        }

        this.$http.put(`/api/user/${this.user.Id}/email`, emailModificationBody)
          .then(response => {
            if (response.body.success) {
              this.user.Email = emailModificationBody.NewEmail
              this.$router.push({name: 'EditProfile'})
            } else {
              console.log(response)
              this.failureMessage = response.data.message
            }
          }, response => { // Failure
            this.failureMessage = response.data.message
          })
      }
    }
  }
</script>
