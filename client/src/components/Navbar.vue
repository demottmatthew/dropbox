<template>
  <nav class="navbar has-shadow" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
      <router-link class="navbar-item" :to="{ name: 'WelcomeScreen' }">
        <img src="../assets/brand_central_icon.png">
      </router-link>
      <router-link class="navbar-item" :to="{ name: 'WelcomeScreen' }">
        Browse
      </router-link>
    </div>
    <div class="navbar-end">
      <div class="navbar-item has-dropdown is-hoverable">
        <a class="navbar-link">
          <img v-bind:src="'https://secure.gravatar.com/avatar/' + hash(this.$store.state.User.Email) + '?s=46&d=identicon'" class="profile-image" />
          <p>{{ this.$store.state.User.UserName }}</p>
        </a>
        <div class="navbar-dropdown is-right">
          <div class="navbar-item" style="display:block;">
            <b>{{ this.$store.state.User.FirstName }} {{ this.$store.state.User.LastName }}</b>
            <br> @{{ this.$store.state.User.UserName }}
          </div>
          <hr class="navbar-divider">
          <router-link :to="{ name: 'Profile', params:{ userId: this.$store.state.User.Id } }" class="navbar-item">Profile</router-link>
          <router-link :to="{ name: 'EditProfile' }" class="navbar-item">Settings</router-link>
          <!--<a class="navbar-item">About</a>  
          about is empty right now. we can add it back when we get something to put here--> 
          <hr class="navbar-divider">
          <a class="navbar-item" @click="signOut">Sign out</a>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
  var md5 = require('md5')

  export default {
    name: 'Navbar',
    data () {
      return {
        user: this.$store.state.User
      }
    },
    methods: {
      signOut () {
        this.$http.get('/api/logout')
          .then(response => {
            this.$store.commit('LogOut')
            this.$router.push({ name: 'Login' })
          }, response => {
            console.log(response)
          })
      },
      hash (str) {
        return md5(str)
      }
    }
  }
</script>
