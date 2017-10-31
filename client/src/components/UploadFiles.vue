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
            {{ file.name }}
            {{file.size}}
            {{file.status}}
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
        const body = {
          file: file,
          filename: file.name,
          filesize: file.size
        }
        this.$http.post('/api/user/upload', body)
          .then(response => {
            if (response.data.success) {
              console.log('success')
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
