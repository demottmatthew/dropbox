<template>
  <div class="hero is-fullheight">
    <div class="hero-body">
      <div class="container">
        <div class="columns is-left">
          <div class="column is-7 is-offset-1">
            <h4 class="title has-text-centered is-4">
              <img src="../assets/appointment.jpg" style="max-width: 20%">
            </h4>
            <div class="box">
              <h4 class="title has-text-centered is-4">Add Appointment</h4>
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
                  <input class="input" type="text" placeholder="Doctor's Appointment" v-model="title" />
                </div>
              </div>
              <div class="field">
                <label class="label">Description</label>
                <div class="control">
                  <input class="input" type="text" placeholder="Going to get my yearly checkup" v-model="description" @keydown.enter="add"/>
                </div>
              </div>
              <div class="field">

                <label class="label">Date</label>
                <div class="control">
                    <input class="input" type="text" placeholder="11-26-17" v-model="date" @keydown.enter="add"/>
                </div>
              </div>
              <div class="field">
                <label class="label">Start Time</label>
                <div class="control">
                  <input class="input" type="text" placeholder="12:30 PM" v-model="starttime" @keydown.enter="add"/>
                </div>
              </div>
              <div class="field">
                <label class="label">End Time</label>
                <div class="control">
                  <input class="input" type="text" placeholder="2:45 PM" v-model="endtime" @keydown.enter="add"/>
                </div>
              </div>
              <hr>
              <div class="control">
                <button class="button is-primary" @click="add">Add</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script>
  export default {
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
    methods: {
      add () {
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
          title: this.title,
          desc: this.description,
          date: year + '-' + month + '-' + day,
          starttime: stime,
          endtime: etime
        }
        this.$http.post('/api/add/appointment', body)
          .then(response => { // Success
            if (response.data.success) {
              this.successMessage = 'Appointment Added'
              this.$router.push({name: 'Calendar', params: {userId: '', vbit: '1'}})
            } else {
              this.failureMessage = response.data.message
            }
          }, response => { // Failure
            this.failureMessage = response.data.message
          })
      }
    }
  }
</script>

