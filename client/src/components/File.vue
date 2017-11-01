<template>
  <div v-if="item || itemID" class="voting-item" v-bind:class="{ 'small': this.displayMode }">
    <div class="box">
      <div :class="[this.displayMode ? 'subtitle is-5':'title is-7']">
        <p class="has-text-left is-pulled-left">
          <a href="javascript:void(0);" @click="download(item)">file name: {{ itemName ? itemName : item.name}}</a>
        </p>
        <br>
        <hr style="margin: 20px -10px">
        <p class="content has-text-left" v-show="!this.displayMode">
          <a href="javascript:void(0);" @click="download(item)">file size: {{ itemSize ? itemSize : item.size  }}</a>
        </p>
        <p class="content has-text-left" v-show="!this.displayMode">
          <a href="javascript:void(0);" @click="download(item)">file: {{ itemFile ? itemFile : item.file  }}</a>
        </p>
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
    },
    methods: {
      download (item) {
        console.log('download')
        // let blob = new Blob(item.file, { type: 'application/pdf' } )
        // download(item.file, item.name)
      }
    }
  }
</script>
