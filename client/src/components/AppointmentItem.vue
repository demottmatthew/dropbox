<template>
  <div v-if="item || itemID" class="voting-item" v-bind:class="{ 'small': this.displayMode }">
    <div class="box">
      <div :class="[this.displayMode ? 'subtitle is-5':'title is-7']">
        <div class="content has-text-left" v-show="!this.displayMode">
          {{ itemTitle ? itemTitle : item.title  }}
        </div>
        <br>
        <hr style="margin: 20px -10px">
        <div class="content has-text-left" v-show="!this.displayMode">
          {{ itemDescription ? itemDescription : item.description  }}
        </div>
        <div class="content has-text-left" v-show="!this.displayMode">
          {{ itemDate ? itemDate : item.date  }}
        </div>
        <div class="content has-text-left" v-show="!this.displayMode">
          {{ itemTime ? itemTime : item.time  }}
        </div>
        <div class="content has-text-left" v-show="!this.displayMode">
          {{ itemUser ? itemUser : item.user  }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  // TOOO: This component should take in an id, and load the item based on the id.
  export default {
    props: ['item'],
    data () {
      return {
        displayMode: this.$route.name === 'BrowseProfile',
        itemTitle: '',
        itemDescription: '',
        itemDate: '',
        itemTime: '',
        itemUser: ''
      }
    },
    computed: {
      CurrentItem: () => {
        return this.item
      }
    },
    methods: {
      download (item) {
      }
    }
  }
</script>
