<template>
  <div class="followed-users-container">
    <div class="control-container" style="margin-bottom:20px">
      <div class="field has-addons has-addons-right">
        <p class="control">
          <a class="button" v-bind:class="{ 'is-dark': layout === 'grid' }" @click="displayGrid()">
            <i class="material-icons">view_module</i>
          </a>
        </p>
        <p class="control">
          <a class="button" v-bind:class="{ 'is-dark': layout === 'list' }" @click="displayList()">
            <i class="material-icons">view_list</i>
          </a>
        </p>
      </div>
    </div>
    <div v-if="users.length > 0">
      <div v-if="layout === 'grid'" class="channels-grid">
        <div class="columns is-multiline">
          <div class="column is-one-quarter is-half-tablet is-12-mobile" v-for="user in users" :key="user.id">
            <div class='box' style='padding:0px;overflow:hidden;'>
              <UserRow :user="user" :shouldDisplayName="true"/>
            </div>
          </div>
        </div>
      </div>
      <div v-if="layout === 'list'" class="channels-list">
        <hr style="margin:0px;">
        <div class="columns is-multiline" style="margin-top:0px;">
          <div class="column is-12" v-for="user in users" :key="user.id" style="padding-top: 0px;padding-bottom:0px">
            <UserRow :user="user" :shouldDisplayName="true"/>
            <hr style="margin:0px;">
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      <article class="message">
        <div class="message-body">
          This user is not following anyone
        </div>
      </article>
    </div>
  </div>
</template>

<script>
  import UserRow from './UserRow'

  export default {
    name: 'FollowingUsers',
    props: {
      userId: {
        required: true
      }
    },
    data () {
      return {
        users: []
      }
    },
    computed: { layout () { return this.$store.state.layout } },
    watch: {
      userId: function (newVal, oldVal) {
        this.loadUsers()
      }
    },
    components: {
      'UserRow': UserRow
    },
    created () {
      this.loadUsers()
    },
    methods: {
      loadUsers () {
        var userId = this.$route.params.userId
        this.$http.get(`/api/user/following/${userId}`)
          .then(response => {
            if (response.data.success) {
              this.users = response.data.following
            }
          }, response => {
            // Could not get any users
          })
      },
      displayList () {
        this.$store.commit('changeLayout', 'list')
      },
      displayGrid () {
        this.$store.commit('changeLayout', 'grid')
      }
    }
  }
</script>

