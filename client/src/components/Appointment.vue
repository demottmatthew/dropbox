<template>
  <div class="hero is-fullheight">
    <div class="hero-body">
      <div class="container">
        <div class="columns is-vcentered">
          <div class="column is-8 is-offset-2">
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
                  <input class="input" type="text" placeholder="title" v-model="title" />
                </div>
              </div>
              <div class="field">
                <label class="label">Description</label>
                <div class="control">
                  <input class="input" type="text" placeholder="description" v-model="description" @keydown.enter="add"/>
                </div>
              </div>
              <div class="field">

                <label class="label">Date</label>
                <div class="control">
                    <input class="input" type="text" placeholder="date" v-model="date" @keydown.enter="add"/>
                </div>
              </div>
              <div class="field">
                <label class="label">Time</label>
                <div class="control">
                  <input class="input" type="text" placeholder="time" v-model="time" @keydown.enter="add"/>
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
        time: '',
        failureMessage: '',
        successMessage: ''
      }
    },
    methods: {
      add () {
        const year = '20' + this.date[this.date.length - 2] + this.date[this.date.length - 1]
        const month = this.date[0] + this.date[1]
        const day = this.date[3] + this.date[4]
        const end = this.time[this.time.length - 2] + this.time[this.time.length - 1]
        var index = 0
        var time = ''
        var hours = 0
        var minutes = ''
        const seconds = ':00'
        for (var i = 0; i < this.time.length; i++) {
          if (this.time[i] === ':') {
            index = i
          }
        }
        if (index === 1) {
          hours = this.time[0]
          minutes = this.time[1] + this.time[2] + this.time[3]
        } else {
          hours = this.time[0] + this.time[1]
          minutes = this.time[2] + this.time[3] + this.time[4]
        }
        if (end === 'pm' || end === 'PM') {
          hours = parseInt(hours) + 12
        } else if (end === 'am' || end === 'AM') {
        }
        time = hours + minutes + seconds
        const body = {
          title: this.title,
          desc: this.description,
          date: year + '-' + month + '-' + day,
          time: time
        }
        this.$http.post('/api/add/appointment', body)
          .then(response => { // Success
            if (response.data.success) {
              this.successMessage = 'Appointment Added'
              this.$router.push({name: 'Calendar'})
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

