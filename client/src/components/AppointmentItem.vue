<template>
  <div v-if="item" class="voting-item" v-bind:class="{ 'small': this.displayMode }">
    <div class="box">
      <div :class="[this.displayMode ? 'subtitle is-5':'title is-5']">
        <div class="content has-text-left" v-show="!this.displayMode">
          Title: {{ itemTitle ? itemTitle : item.title  }}
        </div>
      </div>
        <hr style="margin: 20px -10px">
        <div class="content has-text-left" v-show="!this.displayMode">
          Description: {{ itemDescription ? itemDescription : item.description  }}
        </div>
        <div class="content has-text-left" v-show="!this.displayMode">
          Date: {{ itemDate ? itemDate : item.date  }}
        </div>
        <div class="content has-text-left" v-show="!this.displayMode">
          Start Time: {{ itemTime ? itemTime : item.starttime  }}
        </div>
        <div class="content has-text-left" v-show="!this.displayMode">
          End Time: {{ itemTime ? itemTime : item.endtime  }}
        </div>
        <div class="content has-text-left" v-show="!this.displayMode">
          First Name: {{ itemFname ? itemFname : item.fname  }}
        </div>
        <div class="content has-text-left" v-show="!this.displayMode">
          Last Name: {{ itemLname ? itemLname : item.lname  }}
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
        itemFname: '',
        itemLname: ''
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
