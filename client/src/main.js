// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import VueResource from 'vue-resource'
import App from './App'
import router from './router'
import store from './Vuex/states'
import VeeValidate from 'vee-validate'
import VueClip from 'vue-clip'

Vue.use(VeeValidate)
Vue.use(VueResource)
Vue.use(VueClip)
Vue.config.productionTip = false
window._ = require('lodash')

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: { App }
})
