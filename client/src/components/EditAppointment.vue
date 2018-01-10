<template>
  <div class="column is-10">
    <div class="column is-12 columns is-multiline">
      <div class="column is-10 is-offset-2">
        <div class="box">
          <h1 class="title is-size-2.5 has-text-centered">Edit Appointment</h1>
          <article class="message is-danger" v-show="failureMessage">
            <div class="message-body">
              {{ failureMessage }}
            </div>
          </article>
          <article class="message is-success" v-show="successMessage">
            <div class="message-body">
              {{ successMessage }}
            </div>
          </article>
          <div class="field">
            <label class="label">Title</label>
            <div class="control">
              <input class="input" type="text" v-bind:placeholder="oldTitle" v-model="title" />
            </div>
          </div>
          <div class="field">
            <label class="label">Description</label>
            <div class="control">
              <input class="input" type="text" v-bind:placeholder="oldDescription" v-model="description" @keydown.enter="Update"/>
            </div>
          </div>
          <div class="field">
            <label class="label">Date</label>
            <div class="control">
              <input class="input" type="text" v-bind:placeholder="oldDate" v-model="date" @keydown.enter="Update"/>
            </div>
          </div>
          <div class="field">
            <label class="label">Start Time</label>
            <div class="control">
              <input class="input" type="text" v-bind:placeholder="oldStarttime" v-model="starttime" @keydown.enter="Update"/>
            </div>
          </div>
          <div class="field">
            <label class="label">End Time</label>
            <div class="control">
              <input class="input" type="text" v-bind:placeholder="oldEndtime" v-model="endtime" @keydown.enter="Update"/>
            </div>
          </div>
          <button class="button is-primary" @click="Update">Update Appointment</button>
          <router-link class="button is-pulled-right" :to="{ name: 'Calendar',  params:{ userId: '' }  }">Cancel</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'EditAppointment',
    props: ['appId'],
    data () {
      return {
        title: '',
        description: '',
        date: '',
        starttime: '',
        endtime: '',
        failureMessage: '',
        successMessage: ''
      }
    },
    created () {
      this.displayAppInfo(this.appId)
    },
    methods: {
      Update () {
        // Quit if any inputs are invalid
        if (this.title === '') {
          this.failureMessage = 'Title cannot be blank'
          return
        }
        if (this.description === '') {
          this.failureMessage = 'Description cannot be blank'
          return
        }
        if (this.date === '') {
          this.failureMessage = 'Date cannot be blank'
          return
        }
        if (this.starttime === '' || this.starttime.length < 7) {
          this.failureMessage = 'Start Time is not in the proper format'
          return
        }
        if (this.endtime === '' || this.endtime.length < 7) {
          this.failureMessage = 'End Time is not in the proper format'
          return
        }
        const year = '20' + this.date[this.date.length - 2] + this.date[this.date.length - 1]
        const month = this.date[0] + this.date[1]
        const day = this.date[3] + this.date[4]
        const startend = this.starttime[this.starttime.length - 2] + this.starttime[this.starttime.length - 1]
        const endend = this.endtime[this.endtime.length - 2] + this.endtime[this.endtime.length - 1]
        var index = 0
        var stime = ''
        var etime = ''
        var starthours = 0
        var endhours = 0
        var startminutes = ''
        var endminutes = ''
        const seconds = ':00'
        for (var i = 0; i < this.starttime.length; i++) {
          if (this.starttime[i] === ':') {
            index = i
          }
        }
        if (index === 1) {
          starthours = this.starttime[0]
          startminutes = this.starttime[1] + this.starttime[2] + this.starttime[3]
        } else {
          starthours = this.starttime[0] + this.starttime[1]
          startminutes = this.starttime[2] + this.starttime[3] + this.starttime[4]
        }
        if (startend === 'pm' || startend === 'PM') {
          if (parseInt(starthours) === 12) {

          } else {
            starthours = parseInt(starthours) + 12
          }
        } else if ((startend === 'am' || startend === 'AM') && parseInt(starthours) === 12) {
          starthours = parseInt(starthours) + 12
        }
        stime = starthours + startminutes + seconds
        for (i = 0; i < this.endtime.length; i++) {
          if (this.endtime[i] === ':') {
            index = i
          }
        }
        if (index === 1) {
          endhours = this.endtime[0]
          endminutes = this.endtime[1] + this.endtime[2] + this.endtime[3]
        } else {
          endhours = this.endtime[0] + this.endtime[1]
          endminutes = this.endtime[2] + this.endtime[3] + this.endtime[4]
        }
        if (endend === 'pm' || endend === 'PM') {
          if (parseInt(endhours) === 12) {

          } else {
            endhours = parseInt(endhours) + 12
          }
        } else if ((endend === 'am' || endend === 'AM') && parseInt(endhours) === 12) {
          endhours = parseInt(endhours) + 12
        }
        etime = endhours + endminutes + seconds
        if (endend === startend) {
          if (starthours === endhours && startminutes > endminutes) {
            this.failureMessage = 'Start Time cannot be after End Time'
            return
          } else if (starthours === 12) {
          } else if (starthours > endhours) {
            this.failureMessage = 'Start Time cannot be after End Time'
            return
          }
        } else if ((endend === 'AM' || endend === 'am') && (startend === 'PM' || startend === 'pm')) {
          this.failureMessage = 'Start Time cannot be after End Time'
          return
        }
        const body = {
          id: this.appId,
          title: this.title,
          desc: this.description,
          date: year + '-' + month + '-' + day,
          starttime: stime,
          endtime: etime
        }

        // Send a request to the api to update the user's information
        this.$http.post('/api/update/appointment', body)
          .then(response => { // Success
            if (response.data.success) {
              this.successMessage = 'Appointment Updated'
              this.$router.push({ name: 'Calendar', params: { userId: '' } })
            } else {
              this.failureMessage = response.data.message
            }
          }, response => { // Failure
            this.failureMessage = response.data.message
          })
      },
      displayAppInfo (aid) {
        this.$http.get(`/api/user/getappointment?appid=${aid}`)
          .then(response => {
            console.log(response)
            this.title = response.body.app.title
            this.description = response.body.app.description
            this.date = response.body.app.date
            this.starttime = response.body.app.starttime
            this.endtime = response.body.app.endtime
          }, response => {
            console.log(response)
          })
      }
    }
  }
</script>

