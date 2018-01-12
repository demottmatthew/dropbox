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
          Start Time: {{ itemStarttime ? itemStarttime : item.starttime  }}
        </div>
        <div class="content has-text-left" v-show="!this.displayMode">
          End Time: {{ itemEndtime ? itemEndtime : item.endtime  }}
        </div>
        <div class="content has-text-left" v-show="!this.displayMode">
          First Name: {{ itemFname ? itemFname : item.fname  }}
        </div>
        <div class="content has-text-left" v-show="!this.displayMode">
          Last Name: {{ itemLname ? itemLname : item.lname  }}
        </div>
        <div v-if="item.uid == this.$store.state.User.Id">
          <div class="has-text-left">
            <button class="button is-primary" @click="EditApp">Edit Appointment</button>
          </div>
        </div>
        <div v-else-if="profileID == ''">
          <div class="has-text-left">
            <button class="button is-primary" @click="ViewProfile">View Profile</button>
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
        itemID: this.item.id,
        itemTitle: '',
        itemDescription: '',
        itemDate: '',
        itemStarttime: '',
        itemEndtime: '',
        itemFname: '',
        itemLname: '',
        itemUID: this.item.uid,
        profileID: this.item.profileID
      }
    },
    computed: {
      CurrentItem: () => {
        return this.item
      }
    },
    methods: {
      EditApp () {
        this.$router.push({name: 'EditAppointment', params: {item: this.item}})
      },
      ViewProfile () {
        this.$router.push({name: 'ProfileCalendar', params: {userId: this.itemUID}})
      }
    }
  }
</script>
