<template>
  <section class="section">
    <div class="columns">
      <div class="column is-centered">
        <div class="search-input-container">
          <div class="field">
            <p class="control has-icons-left">
              <input class="input has-icon-left" type="text" placeholder="Search" v-model="searchText" @input="displayApps(1)">
              <span class="icon is-small is-left">
            <i class="material-icons">search</i>
          </span>
            </p>
          </div>
        </div>
        <div class="container is-vcentered">
          <section class="section">
            <div v-if="apps.length > 0">
              <div class="columns is-multiline">
                <div class="column is-one-quarter is-4 is-half-tablet is-12-mobile" v-for="app in apps" :key="app.name">
                  <AppointmentItem :item="app" />
                </div>
              </div>
              <nav class="pagination" v-show="totalApps > appsPerPage" role="navigation" aria-label="pagination">
                <a class="pagination-previous" @click="previousPage()" :disabled="currentPage == 1">Previous</a>
                <a class="pagination-next" @click="nextPage()" :disabled="currentPage * appsPerPage >= totalApps">Next page</a>
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
      <div class="column">
        <router-view></router-view>
      </div>
    </div>
  </section>
</template>

<script>
  import AppointmentItem from './AppointmentItem.vue'
  var Classes = require('../TypeScriptFolder/Compliled/Classes').Classes
  export default {
    name: 'Calendar',
    props: ['userId'],
    data () {
      return {
        apps: [],
        currentPage: 1,
        appsPerPage: 6,
        totalApps: 0,
        uid: this.$route.params.userId,
        searchText: ''
      }
    },
    components: {
      'AppointmentItem': AppointmentItem
    },
    watch: {
      userId (id) {
        console.log('new uid: ', id)
        this.uid = id
        this.displayApps(1)
      }
    },
    created () {
      this.displayApps(1)
    },
    methods: {
      displayApps (page) {
        const uid = this.uid
        this.currentPage = page
        var newApps = []
        this.$http.get(`/api/user/getappointments?appsPerPage=${this.appsPerPage}&page=${page}&searchText=${this.searchText}&uid=${uid}`)
          .then(response => {
            console.log(response)
            if (response.data.success) {
              response.body.apps.forEach(function (el) {
                newApps.push(new Classes.AppointmentItem(el.appid, el.title, el.description, el.date, el.starttime, el.endtime, el.fname, el.lname, el.userID, uid))
              }, this)
              this.apps = newApps
              this.totalApps = response.body.totalApps
            }
          }, response => {
            console.log(`Failed to load appointments. page=${page}, filesPerPage=${this.appsPerPage}`)
          })
      },
      previousPage () {
        this.displayApps(this.currentPage - 1)
      },
      nextPage () {
        this.displayApps(this.currentPage + 1)
      }
    }
  }
</script>
