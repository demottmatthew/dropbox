<template>
  <section>
  <section class="hero">
    <div class="hero-body">
      <div class="container">
        <div class="columns has-text-centered">
          <div class="column">
            <h1 class="title">
              What are you interested in?
            </h1>
            <h2 class="subtitle">
              Select one or more of the options below to get started.
            </h2>
          </div>
        </div>
      </div>
    </div>
  </section>
  <section class="section">
    <div class="container">
      <div class="columns is-mobile is-multiline">
        <div v-for="channel in channels" v-bind:key="channel.id" class="column is-one-quarter-desktop is-half-tablet is-full-mobile">
          <a class="box" v-on:click="toggleChannelSelection(channel)" v-bind:class="{ 'selected-tag': selectedChannels.includes(channel.CHANNEL_ID) }">
            <h3 class="title is-6">
              <i class="fa fa-tag" style="opacity: 0.4; margin-right: 5px;" aria-hidden="true"></i>
              <span>{{ channel.CHANNEL_NAME | capitalize}}</span>
            </h3>
          </a>
        </div>
      </div>
    </div>
  </section>
    <div class="container">
      <a class="button is-primary is-pulled-right" v-bind:disabled="selectedChannels.length < 1" v-on:click="submitChannels">Continue</a>
    </div>
</section>
</template>

<script>
  export default{
    name: 'Interests',
    data () {
      return {
        user: this.$store.state.User,
        channels: [],
        selectedChannels: []
      }
    },
    created () {
      this.loadChannels()
    },
    methods: {
      loadChannels () {
        this.$http.get('/api/channels/onboard')
          .then(response => {
            if (response.data.success) {
              this.channels = response.data.channels
            }
          }, response => {
          // Could not get any channels
          })
      },
      toggleChannelSelection (channel) {
        if (this.selectedChannels.includes(channel.CHANNEL_ID)) {
          var deleteIndex = this.selectedChannels.indexOf(channel.CHANNEL_ID)
          this.selectedChannels.splice(deleteIndex, 1)
        } else {
          this.selectedChannels.push(channel.CHANNEL_ID)
        }
      },
      submitChannels () {
        if (!this.canSubmitChannels()) return

        // Send the channels that the user selected to the server
        const body = {
          channels: this.selectedChannels
        }
        this.$http.post(`/api/user/${this.user.Id}/channels`, body)
          .then(response => {
            if (response.data.success) {
              this.$router.push({ name: 'Browse' })
            }
          }, response => {
          // channels could not be submitted
          })
      },
      canSubmitChannels () {
        if (this.selectedChannels.length >= 1) return true
      }
    },
    filters: {
      capitalize: function (value) {
        if (!value) return ''
        value = value.toString()
        return value.charAt(0).toUpperCase() + value.slice(1)
      }
    }
  }
</script>
<style scoped>
</style>
