<template>
  <vue-clip :options="options">
        <template slot="clip-uploader-action">
          <div>
            <div class="dz-message"><h2> Click or Drag and Drop files here upload </h2></div>
          </div>
        </template>

        <template slot="clip-uploader-body" scope="props">
          <div v-for="file in props.files">
            <img v-bind:src="file.dataUrl" />
            <br>
            file name: {{ file.name }}
            <br>
            file size:{{file.size}}
            <br>
            file status: {{file.status}}
          </div>
        </template>
  </vue-clip>
</template>

<script>
  export default {
    data: function () {
      return {
        options: {
          url: '/api/user/upload',
          paramName: 'file'
        }
        // files: []
      }
    },

    methods: {
      addedFile (file) {
        console.log(file)
        // console.log(body.file)
        const body = {
          file: new Buffer(file).toString('base64'),
          filename: file.name,
          filesize: file.size
        }
        console.log(body.file)
        this.$http.post('/api/user/upload', body)
          .then(response => {
            if (response.data.success) {
              console.log('success')
              console.log(response.data.file)
              file.status = 'added'
            }
          }, response => {
            console.log('fail')
            console.log(response.data.message)
          })
        // this.files.push(file)
      }
    }
  }
</script>
