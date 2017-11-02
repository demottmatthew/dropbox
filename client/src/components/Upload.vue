<template>
    <div class="container">
      <!--UPLOAD-->
      <form enctype="multipart/form-data">
        <h1>Upload images</h1>
        <div class="dropbox">
          <input type="file" multiple :name="uploadFieldName" @change="fileadded($event.target.name, $event.target.files); fileCount = $event.target.files.length"
                 accept="all/*" class="input-file">
            Drag your file(s) here to begin<br> or click to browse
        </div>
      </form>
    </div>
</template>

<script>
  export default {
    data: function () {
      return {
        uploadedFiles: [],
        uploadError: null,
        currentStatus: null,
        uploadFieldName: ''
      }
    },
    methods: {
      fileadded (fieldName, fileList) {
        // handle file changes
        // const blob = new Blob(fileList[0], fileList[0].type)
        console.log(fileList[0])
        var formData = new FormData()
        formData.append('file', fileList[0])
        formData.append('name', fileList[0].name)
        formData.append('size', fileList[0].size)
        // ?filesPerPage=${this.filesPerPage}
        console.log(formData)
        console.log(formData.get('file'))
        this.$http.post(`/api/user/upload/${formData}`)
          .then(response => {
            if (response.data.success) {
              console.log('success')
              console.log(response.data.file)
            }
          }, response => {
            console.log('fail')
            console.log(response.data.message)
          })
      }
    }
  }

</script>
