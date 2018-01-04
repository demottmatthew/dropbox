<template>
  <router-link class="user-row hover-container item-link user-row-link"
    v-bind:class="{ 'is-active': user.id == $route.params.userId }"
    v-on:click.native="select()"
    :to="{ name: 'profile', params:{ userId: user.id } }">
    <img class="profile-image" v-bind:src="`https://secure.gravatar.com/avatar/${user.emailHash}?s=32&d=identicon`"/>
    <div class="information-container">
      <span class="name" v-if="this.shouldDisplayName">{{ user.firstName }} {{ user.lastName}}</span>
      <span class="username">{{ user.username }}</span>
    </div>
    <div class="hover-content right">
      <p v-if="following()" class="control display-on-hover">
        <a class="button like-button" v-on:click.stop.prevent="unfollow">
          <span class="icon is-small">
            <i class="material-icons md-16">close</i>
          </span>
        </a>
      </p>
      <p v-else class="control">
        <a class="button like-button" v-on:click.stop.prevent="follow">
          <span class="icon is-small">
            <i class="material-icons md-16">add</i>
          </span>
        </a>
      </p>
    </div>
  </router-link>
</template>

<script>
  export default {
    name: 'UserRow',
    props: {
      user: {
        type: Object,
        required: true
      },
      shouldDisplayName: {
        type: Boolean,
        required: false,
        default: false
      }
    },
    methods: {
      select () {
        this.$parent.$emit('selectedUser')
      },
      following () {
        var userId = this.user.id
        var followedUsers = this.$store.state.followedUsers
        var following = followedUsers.some(function (element) {
          return element.id === userId
        })
        return following
      },
      follow () {
        this.$http.post(`/api/user/follow/${this.user.id}`)
          .then(response => {
            if (response.data.success) {
              var user = {
                id: this.user.id,
                username: this.user.username
              }
              this.$store.commit('addFollowedUser', user)
            }
          }, response => {
            console.log('Failed to follow')
          })
      },
      unfollow () {
        this.$http.post(`/api/user/unfollow/${this.user.id}`)
          .then(response => {
            if (response.data.success) {
              this.$store.commit('removeFollowedUser', this.user.id)
            }
          }, response => {
            console.log('Failed to unfollow')
          })
      }
    }
  }
</script>
