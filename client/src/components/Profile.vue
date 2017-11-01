<template>
  <div>
    <div v-if="user">
      <section class="section">
        <div class="is-centered">
          <img v-bind:src="'https://secure.gravatar.com/avatar/' + this.emailHash+ '?s=96&d=identicon'" class="profile-image" />
          <h1 class="title is-4">{{ user.FirstName }} {{ user.LastName }}</h1>
          <h1 class="subtitle">@{{ user.UserName }}</h1>
          <div v-if="user.Id != this.$store.state.User.Id">
          </div>
          <div v-else>
            <router-link :to="{ name: 'EditProfile' }" class="button">
              Edit Profile
            </router-link>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>



<script>
  import EditProfile from './EditProfile'
  var Classes = require('../TypeScriptFolder/Compliled/Classes').Classes
  var md5 = require('md5')

  export default {
    name: 'Profile',
    props: ['userId'],
    data () {
      return {
        user: undefined,
        emailHash: ''
      }
    },
    watch: {
      userId: function (newVal, oldVal) {
        this.loadUserInformation()
      }
    },
    components: {
      'EditProfile': EditProfile
    },
    created () {
      this.loadUserInformation()
    },
    methods: {
      hash (str) {
        return md5(str)
      },
      loadUserInformation () {
        var userId = this.$route.params.userId
        this.$http.get(`/api/profile/${userId}`)
        .then(response => {
          if (response.data.success) {
            this.user = new Classes.User()
            this.user.Id = Number(userId)
            this.user.FirstName = response.body.user.firstName
            this.user.LastName = response.body.user.lastName
            this.user.UserName = response.body.user.username
            this.emailHash = response.body.user.emailHash
          }
        }, response => {
          console.log('Failed to load channel information')
        })
      },
      isAuthenticatedUser () {
      }
    }
  }
</script>
