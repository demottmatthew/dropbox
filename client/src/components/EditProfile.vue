<template>
  <div class="column is-10">
    <div class="column is-12 columns is-multiline">
      <div class="column is-12 is-size-5">
        <h1 class="title is-size-2.5">Profile</h1>
        <div class="field">
          <label class="label">First Name</label>
          <div class="control">
            <input class="input" type="text" v-bind:placeholder="user.FirstName" v-model="editedUser.FirstName" />
          </div>
        </div>
        <div class="field">
          <label class="label">Last Name</label>
          <div class="control">
            <input class="input" type="text" v-bind:placeholder="user.LastName" v-model="editedUser.LastName" />
          </div>
        </div>
        <div class="field">
          <label class="label">Username</label>
          <div class="control">
            <input class="input" type="text" v-bind:placeholder="user.UserName" name="username" v-model="editedUser.UserName" v-validate="{ required: true }"
            />
          </div>
          <p class="help is-danger" v-show="errors.has('username')">{{ errors.first('username') }}</p>
        </div>
        <button class="button is-primary" @click="Update">Update profile</button>
        <router-link class="button is-pulled-right" :to="{ name: 'Profile' }">Cancel</router-link>
      </div>
    </div>
  </div>
</template>



<script>
  /* global _ */
  import Profile from './Profile'
  import ChangePassword from './ChangePassword'

  export default {
    name: 'EditProfile',
    data () {
      return {
        user: this.$store.state.User,
        editedUser: _.cloneDeep(this.$store.state.User)
      }
    },
    components: {
      'Profile': Profile,
      'ChangePassword': ChangePassword
    },
    methods: {
      Update () {
        // Quit if any inputs are invalid
        this.$validator.validateAll()
        if (this.errors.any()) {
          return
        }

        const updateInfo = {}

        if (this.user.UserName !== this.editedUser.UserName) {
          updateInfo.username = this.editedUser.UserName
          this.user.UserName = this.editedUser.UserName
        }

        if (this.user.FirstName !== this.editedUser.FirstName) {
          updateInfo.firstName = this.editedUser.FirstName
          this.user.FirstName = this.editedUser.FirstName
        }

        if (this.user.LastName !== this.editedUser.LastName) {
          updateInfo.lastName = this.editedUser.LastName
          this.user.LastName = this.editedUser.LastName
        }

        // Send a request to the api to update the user's information
        this.$http.post(`/api/profile/${this.user.Id}`, updateInfo)
          .then(response => {
            console.log(response)
            this.user = this.editedUser
          }, response => {
            console.log(response)
          })
      }
    }
  }
</script>
