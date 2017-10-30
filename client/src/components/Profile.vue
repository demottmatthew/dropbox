<template>
  <div>
    <div v-if="user">
      <section class="section">
        <div class="is-centered">
          <img v-bind:src="'https://secure.gravatar.com/avatar/' + this.emailHash+ '?s=96&d=identicon'" class="profile-image" />
          <h1 class="title is-4">{{ user.FirstName }} {{ user.LastName }}</h1>
          <h1 class="subtitle">@{{ user.UserName }}</h1>
          <div v-if="user.Id != this.$store.state.User.Id">
            <span v-if="following()">
              <a class="button is-primary"  @click="unfollow()">
                Unfollow
              </a>
            </span>
            <span v-else>
              <a class="button" @click="follow()">
                Follow
              </a>
            </span>
          </div>
          <div v-else>
            <router-link :to="{ name: 'EditProfile' }" class="button">
              Edit Profile
            </router-link>
          </div>
        </div>
      </section>
      <div class="tabs is-centered is-boxed">
        <ul>
          <li class="is-active">
            <a>
              <i class="fa fa-heart" style="margin-right: 5px;" aria-hidden="true"></i>
              <span>Likes</span>
            </a>
          </li>
          <li>
            <a disabled>
              <i class="fa fa-tag" style="margin-right: 5px;" aria-hidden="true"></i>
              <span>Channels</span>
            </a>
          </li>
          <li>
            <a>
              <i class="fa fa-user" style="margin-right: 5px;" aria-hidden="true"></i>
              <span>Following</span>
            </a>
          </li>
        </ul>
      </div>
      <section class="section">
        <div v-if="likedItems.length > 0">
          <div class="columns is-multiline">
            <div class="column is-one-quarter is-half-tablet is-12-mobile" v-for="item in likedItems" :key="item.ProductName">
              <VotingItem :item="item" />
            </div>
          </div>
          <nav class="pagination" v-show="totalProducts > numberPerPage" role="navigation" aria-label="pagination">
            <a class="pagination-previous" @click="previousPage()" :disabled="currentPage == 1">Previous</a>
            <a class="pagination-next" @click="nextPage()" :disabled="currentPage * numberPerPage >= totalProducts">Next page</a>
            <!-- <ul class="pagination-list">
              <li>
                <a class="pagination-link is-current" aria-label="Page 1" aria-current="page">1</a>
              </li>
              <li>
                <a class="pagination-link" aria-label="Goto page 2">2</a>
              </li>
              <li>
                <a class="pagination-link" aria-label="Goto page 3">3</a>
              </li>
            </ul> -->
          </nav>
        </div>
        <div v-else>
          <article class="message">
            <div class="message-body">
              No results found.
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>



<script>
  import EditProfile from './EditProfile'
  import VotingItem from './VotingItem.vue'
  var Classes = require('../TypeScriptFolder/Compliled/Classes').Classes
  var md5 = require('md5')

  export default {
    name: 'Profile',
    props: ['userId'],
    data () {
      return {
        user: undefined,
        likedItems: [],
        currentPage: 1,
        numberPerPage: 12,
        totalProducts: 0,
        emailHash: ''
      }
    },
    watch: {
      userId: function (newVal, oldVal) {
        this.loadUserInformation()
        this.loadLikedProducts(1)
      }
    },
    components: {
      'EditProfile': EditProfile,
      'VotingItem': VotingItem
    },
    created () {
      this.loadUserInformation()
      this.loadLikedProducts(1)
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
      loadLikedProducts (page) {
        // if (page === this.currentPage) return
        var userId = this.$route.params.userId
        this.currentPage = page
        var newLikedItems = []
        this.$http.get(`/api/user/likedproducts/${userId}?productsPer=${this.numberPerPage}&page=${page}`)
        .then(response => {
          console.log(response)
          if (response.data.success) {
            response.body.likedproducts.forEach(function (el) {
              newLikedItems.push(new Classes.Item(el.name, el.description, el.pictureUrl))
            }, this)
            this.likedItems = newLikedItems
            this.totalProducts = response.body.totalProducts
          }
        }, response => {
          console.log(`Failed to load products. userId=${userId}, page=${page}, numPerPage=${this.numPerPage}`)
        })
      },
      previousPage () {
        this.loadLikedProducts(this.currentPage - 1)
      },
      nextPage () {
        this.loadLikedProducts(this.currentPage + 1)
      },
      following () {
        var userId = this.user.Id
        var followedUsers = this.$store.state.followedUsers
        var following = followedUsers.some(function (element) {
          return element.id === userId
        })
        return following
      },
      follow () {
        this.$http.post(`/api/user/follow/${this.user.Id}`)
        .then(response => {
          if (response.data.success) {
            var user = {
              id: this.user.Id,
              username: this.user.UserName
            }
            this.$store.commit('addFollowedUser', user)
          }
        }, response => {
          console.log('Failed to follow')
        })
      },
      unfollow () {
        this.$http.post(`/api/user/unfollow/${this.user.Id}`)
        .then(response => {
          if (response.data.success) {
            this.$store.commit('removeFollowedUser', this.user.Id)
          }
        }, response => {
          console.log('Failed to unfollow')
        })
      },
      isAuthenticatedUser () {
      }
    }
  }
</script>
