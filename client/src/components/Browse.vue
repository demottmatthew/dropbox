<template>
  <section class="section">
    <div class="columns">
      <div class="column is-narrow is-hidden-touch">
        <div class="box" style="padding: 0px;">
          <SideMenu class="aside"></SideMenu>
        </div>
      </div>
      <div class="container">
          <Appointment></Appointment>
      </div>
      <div class="column">
        <router-view></router-view>
      </div>
    </div>
  </section>
</template>

<script>
  import SideMenu from './SideMenu.vue'
  import Appointment from './Appointment.vue'
  export default {
    components: {
      'SideMenu': SideMenu,
      'Appointment': Appointment
    },
    data () {
      return {
        user: this.$store.state.User,
        searchText: '',
        users: this.$store.state.followedUsers,
        searchedUsers: []
      }
    },
    created () {
      this.loadUsers()
    },
    methods: {
      loadUsers () {
        this.$http.get(`/api/user/following/${this.user.Id}`)
          .then(response => {
            if (response.data.success) {
              this.$store.commit('setFollowedUsers', response.data.following)
            }
          }, response => {
            // Could not get any users
          })
      },
      refreshSearchResults () {
        this.$http.get(`/api/users/search?query=${this.searchText}&limit=4`)
          .then(response => {
            if (response.data.success) {
              this.searchedUsers = response.data.users
            }
          }, response => {
            // Could not get any users
          })
      }
    }
  }
</script>

