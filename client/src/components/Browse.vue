<template>
  <section class="section">
    <div class="columns">
      <div class="column is-narrow">
        <section class="section">
          <div class="container">
          </div>
        </section>
      </div>
      <div class="column">
        <router-view></router-view>
      </div>
    </div>
  </section>
</template>

<script>
  export default {
    data () {
      return {
        user: this.$store.state.User,
        searchText: '',
        channels: this.$store.state.channels,
        users: this.$store.state.followedUsers
      }
    },
    methods: {
      upload () {
        this.$http.get(`/api/user/upload/${this.user.Id}`)
          .then(response => {
            if (response.data.success) {
              this.$store.commit('setFollowedUsers', response.data.following)
            }
          }, response => {
            // Could not get any channels
          })
      }
    }
  }
</script>
