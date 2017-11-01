<template>
  <section class="section">
    <div class="columns">
      <div class="column is-narrow">
        <a class="button is-primary"  @click="displayFiles(1)">
          Load Files
        </a>
        <section class="section">
          <div v-if="files.length > 0">
            <div class="columns is-multiline">
              <div class="column is-one-quarter is-half-tablet is-12-mobile" v-for="file in files" :key="file.name">
                <File :item="file" />
              </div>
            </div>
            <nav class="pagination" v-show="totalFiles > filesPerPage" role="navigation" aria-label="pagination">
              <a class="pagination-previous" @click="previousPage()" :disabled="currentPage == 1">Previous</a>
              <a class="pagination-next" @click="nextPage()" :disabled="currentPage * filesPerPage >= totalFiles">Next page</a>
              <!-- <ul class="pagination-list">
                <li>
                  <a class="pagination-link is-current" aria-label="Page 1" aria-current="page">1</a>
                </li>
                <li>
                  <a class="pagination-link" aria-label="Goto page 2">2</a>
                </li>
                <li>
                  <a class="pagination-link" aria-label="Goto page 3">3</a>
                </li>
              </ul> -->
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
        this.$http.get(`/api/user/getfiles?filesPerPage=${this.filesPerPage}&page=${page}`)
          .then(response => {
            console.log(response)
            if (response.data.success) {
              response.body.files.forEach(function (el) {
                newFiles.push(new Classes.FileItem(el.filename, el.filesize, el.file))
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
