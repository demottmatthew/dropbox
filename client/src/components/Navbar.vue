<template>
  <nav class="navbar has-shadow" role="navigation" aria-label="main navigation">
    <div v-if="$route.name === 'Home'">
      <div class="navbar-brand">
        <router-link class="navbar-item" :to="{ name: 'Login' }">
          Login
        </router-link>
        <router-link class="navbar-item" :to="{ name: 'Register' }">
          Register
        </router-link>
      </div>
    </div>
    <div v-else-if="$route.name === 'Login'">
      <div class="navbar-brand">
        <router-link class="navbar-item" :to="{ name: 'Login' }">
          Login
        </router-link>
        <router-link class="navbar-item" :to="{ name: 'Register' }">
          Register
        </router-link>
      </div>
    </div>
    <div v-else-if="$route.name === 'Register'">
      <div class="navbar-brand">
        <router-link class="navbar-item" :to="{ name: 'Login' }">
          Login
        </router-link>
        <router-link class="navbar-item" :to="{ name: 'Register' }">
          Register
        </router-link>
      </div>
    </div>
    <div v-else>
      <div class="navbar-brand">
        <router-link class="navbar-item" :to="{ name: 'Browse' }">
          <img src="../assets/appointment.jpg">
        </router-link>
        <router-link class="navbar-item" :to="{ name: 'Browse' }">
          Appointment
        </router-link>
        <router-link class="navbar-item" :to="{ name: 'Calendar', params:{ userId: '', vbit: '1' } }">
          Calendar
        </router-link>
        <router-link class="navbar-item" :to="{ name: 'ArchiveCalendar', params:{ userId: '', vbit: '0' } }">
          Archive
        </router-link>
      </div>
    </div>
    <div v-if="this.$store.state.loggedIn === true" class="navbar-end">
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
          <router-link :to="{ name: 'ProfileCalendar', params:{ userId: this.$store.state.User.Id, vbit: '1' } }" class="dropdown-item">Profile</router-link>
          <router-link :to="{ name: 'EditProfile' }" class="dropdown-item">Settings</router-link>
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
