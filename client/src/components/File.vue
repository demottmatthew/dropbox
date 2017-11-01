<template>
  <div v-if="item || itemID" class="voting-item" v-bind:class="{ 'small': this.displayMode }">
    <div class="box">
      <p class="has-text-left is-pulled-left">
       file name: {{ itemName ? itemName : item.name}}
      </p>
      <hr style="margin: 20px -10px">
      <div class="content has-text-left" v-show="!this.displayMode">
        file size: {{ itemFile ? itemFile : item.size  }}
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
        itemName: '',
        itemSize: '',
        itemFile: '',
        itemID: ''
      }
    },
    computed: {
      CurrentItem: () => {
        return this.item
      }
    }
  }
</script>
