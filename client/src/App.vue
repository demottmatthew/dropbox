<template>
  <div id="app">
    <div v-cloak v-show="!$route.meta.hideNav">
      <navbar></navbar>
    </div>
    <div>
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import Navbar from './components/Navbar.vue'
export default {
  name: 'app',
  components: {
    'navbar': Navbar
  }
}
</script>

<style src="../styles/site.css"></style>
