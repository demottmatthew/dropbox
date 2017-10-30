<template>
  <div v-if="item || itemID" class="voting-item" v-bind:class="{ 'small': this.displayMode }">
    <div class="box">
      <figure class="image is-square" style="margin: -10px; overflow: hidden; border-radius: 5px;">
          <img :src="itemImageURL ? itemImageURL : item.ImmageURL" alt="Placeholder image">
      </figure>
      <hr style="margin: 20px -20px">
      <div class="media">
        <div class="media-content">
          <div :class="[this.displayMode ? 'subtitle is-5':'title is-4']">
            <p class="has-text-left is-pulled-left">
              {{ itemName ? itemName : item.ProductName.substr(0, 50) + '...' }}
            </p>
          </div>
        </div>
      </div>
      <div class="content has-text-left" v-show="!this.displayMode">
        {{ itemDescription ? itemDescription : item.ProductDescription  }}
      </div>
    </div>
    <div v-show="!this.displayMode">
      <div class="has-text-centered">
        <div class="field has-addons is-grouped is-grouped-centered">
          <p class="control">
            <a class="button" v-on:click="previous" style="border-radius: 100px;">
              <span class="icon is-small">
                <i class="fa fa-angle-left"></i>
              </span>
              <span>Prev</span>
            </a>
          </p>
          <p class="control" style="margin-right: -1px;">
            <a class="button" v-on:click="dislike" style="border-bottom-left-radius: 100px; border-top-left-radius: 100px;">
              <span class="icon is-small">
                <i class="fa fa-thumbs-o-down"></i>
              </span>
              <span>Dislike</span>
            </a>
          </p>
          <p class="control">
            <a class="button" v-on:click="like" style="border-bottom-right-radius: 100px; border-top-right-radius: 100px;">
              <span class="icon is-small">
                <i class="fa fa-thumbs-o-up"></i>
              </span>
              <span>Like</span>
            </a>
          </p>
          <p class="control">
            <a class="button" v-on:click="next" style="border-radius: 100px;">
              <span>Next</span>
              <span class="icon is-small">
                <i class="fa fa-angle-right"></i>
              </span>
            </a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>


<script>
    // TOOO: This component should take in an id, and load the item based on the id.
    export default {
      props: ['item', 'channel'],
      data () {
        return {
          displayMode: this.$route.name === 'Profile' || this.$route.name === 'BrowseProfile',
          itemName: '',
          itemDescription: '',
          itemImageURL: '',
          itemID: ''
        }
      },
      computed: {
        CurrentItem: () => {
          return this.item
        }
      },
      watch: {
        channel () {
          this.next()
        }
      },
      methods: {
        previous () {
          console.log('clicked previous')
        },
        next () {
          this.$http.get(`/api/product/random?channelId=${this.channel}`)
            .then(response => { // Success
              if (response.data.success) {
                this.itemName = response.data.product.name.substring(0, 30)
                this.itemDescription = response.data.product.description.substring(0, 80) + '...'
                this.itemImageURL = response.data.product.pictureUrl
                this.itemID = response.data.product.id
              } else {
                this.failureMessage = response.data.message
              }
            }, response => { // Error
              console.log(response)
              this.failureMessage = response.data.message
            })
        },
        like () {
          this.$http.post(`/api/product/like/${this.itemID}`)
            .then(response => { // Success
              if (response.data.success) {
                this.failureMessage = response.data.message
                console.log('liked ' + this.itemName)
                this.next()
              }
            }, response => { // Error
              console.log(response)
              this.failureMessage = response.data.message
            })
        },
        dislike () {
          this.$http.post(`/api/product/dislike/${this.itemID}`)
            .then(response => { // Success
              if (response.data.success) {
                this.failureMessage = response.data.message
                console.log('disliked ' + this.itemName)
                this.next()
              }
            }, response => { // Error
              console.log(response)
              this.failureMessage = response.data.message
            })
        }
      },
      mounted () {
        this.next()
      }
    }
</script>
