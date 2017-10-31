<template>
  <vue-clip :options="options" :on-added-file="addedFile">
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
          url: '/upload',
          paramName: 'file'
        },
        files: []
      }
    },

    methods: {
      addedFile (file) {
        console.log(file)
        const body = {
          file: btoa(file),
          filename: file.name,
          filesize: file.size
        }
        console.log(body.file)
        this.$http.post('/api/user/upload', body)
          .then(response => {
            if (response.data.success) {
              console.log('success')
              file.status = 'success'
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
