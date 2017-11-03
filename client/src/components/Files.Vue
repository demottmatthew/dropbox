<template>
  <section class="section">
    <div class="columns">
      <div class="column is-narrow">
        <a class="button is-primary"  @click="displayFiles(1)">
          Load Files
        </a>
        <div class="container">
          <section class="section">
            <div v-if="files.length > 0">
              <div class="columns is-multiline">
                <div class="column is-one-quarter is-4 is-half-tablet is-12-mobile" v-for="file in files" :key="file.name">
                  <File :item="file" />
                </div>
              </div>
              <nav class="pagination" v-show="totalFiles > filesPerPage" role="navigation" aria-label="pagination">
                <a class="pagination-previous" @click="previousPage()" :disabled="currentPage == 1">Previous</a>
                <a class="pagination-next" @click="nextPage()" :disabled="currentPage * filesPerPage >= totalFiles">Next page</a>
              </nav>
            </div>
            <div v-else>
              <article class="message">
                <div class="message-body">
                  No results found.
                </div>
              </article>
            </div>
          </section>
        </div>
      </div>
      <div class="column">
        <router-view></router-view>
      </div>
    </div>
  </section>
</template>

<script>
  import File from './File.vue'
  var Classes = require('../TypeScriptFolder/Compliled/Classes').Classes
  export default {
    data () {
      return {
        files: [],
        currentPage: 1,
        filesPerPage: 12,
        totalFiles: 0
      }
    },
    components: {
      'File': File
    },
    methods: {
      displayFiles (page) {
        // if (page === this.currentPage) return
        this.currentPage = page
        var newFiles = []
        // var reader = new FileReader()
        // var buffer = new Buffer(8)
        // const fs = require('fs')
        this.$http.get(`/api/user/getfiles?filesPerPage=${this.filesPerPage}&page=${page}`)
          .then(response => {
            console.log(response)
            if (response.data.success) {
              response.body.files.forEach(function (el) {
                const nameArr = el.filename.split('.')
                console.log(el.file)
                console.log(Buffer.from(el.file, 'base64'))
                // console.log(atob(el.file).data)
                const blob = new Blob(Buffer.from(el.file, 'base64'), { type: `application/${nameArr[nameArr.length - 1]}` })
                // console.log(atob(el.file))
                console.log(blob)
                newFiles.push(new Classes.FileItem(el.filename, el.filesize, Buffer.from(el.file, 'base64')))
                // const link = document.createElement('a')
                // link.href = window.URL.createObjectURL(blob)
                // link.download = el.filename
                // link.click()
              }, this)
              this.files = newFiles
              this.totalFiles = response.body.totalFiles
            }
          }, response => {
            console.log(`Failed to load files. page=${page}, filesPerPage=${this.filesPerPage}`)
          })
      },
      previousPage () {
        this.displayFiles(this.currentPage - 1)
      },
      nextPage () {
        this.displayFiles(this.currentPage + 1)
      }
    }
  }
</script>
