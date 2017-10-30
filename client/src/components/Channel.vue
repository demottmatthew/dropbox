<template>
    <div class="columns is-multiline is-centered">
        <div class="column is-12">
          <span class="is-pulled-left" style="font-size: 1.4rem; color: black;">{{ this.channel.name }}</span>
          <span v-if="subscribed()" class="is-pulled-right">
            <a class="button is-primary"  @click="unsubscribe()">
              Unsubscribe
            </a>
          </span>
          <span v-else class="is-pulled-right">
            <a class="button" @click="subscribe()">
              Subscribe
            </a>
          </span>
        </div>
        <div class="column is-5">
           <voting-item :item ="this.currentItem" :channel="this.channel.id" />
        </div>
    </div>
</template>

<script>
  import VotingItem from './VotingItem.vue'

  export default {
    props: ['channelId'],
    data () {
      return {
        currentItem: undefined,
        channels: this.$store.state.channels,
        channel: {}
      }
    },
    watch: {
      channelId: function (newVal, oldVal) {
        this.loadChannelInformation()
      }
    },
    components: {
      'voting-item': VotingItem
    },
    created () {
      this.loadChannelInformation()
    },
    methods: {
      loadChannelInformation () {
        var channelId = this.$route.params.channelId
        this.$http.get(`/api/channels/${channelId}`)
        .then(response => {
          if (response.data.success) {
            this.channel = response.body.channel
          }
        }, response => {
          console.log('Failed to load channel information')
        })
      },
      subscribed () {
        // Returns a boolean indicating if the user is ubscribed to the current channel
        var channelId = this.channel.id
        var channels = this.$store.state.channels
        var subbed = channels.some(function (element) {
          return element.id === channelId
        })
        return subbed
      },
      subscribe () {
        this.$http.post(`/api/channels/subscribe/${this.channel.id}`)
        .then(response => {
          if (response.data.success) {
            this.$store.commit('addChannel', this.channel)
          }
        }, response => {
          console.log('Failed to subscribe')
        })
      },
      unsubscribe () {
        this.$http.post(`/api/channels/unsubscribe/${this.channel.id}`)
        .then(response => {
          if (response.data.success) {
            this.$store.commit('removeChannel', this.channel.id)
          }
        }, response => {
          console.log('Failed to unsubscribe')
        })
      }
    }
  }
</script>
