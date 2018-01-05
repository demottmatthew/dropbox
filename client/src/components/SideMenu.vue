<template>
  <div class="side-menu">
    <div class="search-input-container">
      <div class="field">
        <p class="control has-icons-left">
          <input class="input has-icon-left" type="text" placeholder="Search" v-model="searchText" @input="refreshSearchResults()">
          <span class="icon is-small is-left">
            <i class="material-icons">search</i>
          </span>
        </p>
      </div>
    </div>
    <hr>
    <div class="search-results-container" v-if="searchText.length > 0">
      <div class="search-results-message" v-if="searchedUsers.length == 0">
        No Results
      </div>
      <p v-show="searchedUsers.length > 0" class="label">Users</p>
      <ul class="search-results-users">
        <UserRow v-for="user in searchedUsers" :key="user.id" :user="user"></UserRow>
      </ul>
      <hr>
    </div>
    <div v-if="searchText.length === 0" class="information-container">
      <ul v-show="this.$store.state.followedUsers.length > 0" class="followed-users">
        <p class="label">Users</p>
        <UserRow v-for="user in this.$store.state.followedUsers" :key="user.id" :user="user"></UserRow>
      </ul>
    </div>
  </div>
</template>


<script>
  import UserRow from './UserRow.vue'
  export default {
    name: 'SideMenu',
    components: {
      'UserRow': UserRow
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

      this.$on(['selectedUser'], event => {
      })
    },
    methods: {
      loadUsers () {
        this.$http.get(`/api/user/following/${this.user.Id}`)
          .then(response => {
            if (response.data.success) {
              this.$store.commit('setFollowedUsers', response.data.following)
            }
          }, response => {
            console.log(response.data.message)
          })
      },
      refreshSearchResults () {
        this.$http.get(`/api/users/search?query=${this.searchText}&limit=4`)
          .then(response => {
            if (response.data.success) {
              this.searchedUsers = response.data.users
            }
          }, response => {
            console.log(response.data.message)
          })
      }
    }
  }
</script>
