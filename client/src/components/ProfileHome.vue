<template>
  <section class="section">
    <div class="columns is-12">
      <div class="column is-narrow">
        <aside class="menu box" style="width: 250px;">
          <p class="menu-label">Settings</p>
          <ul class="menu-list">
            <li>
              <router-link v-bind:class="{ 'is-active': $route.name == 'EditProfile' }" :to="{ name: 'EditProfile' }">Profile</router-link>
            </li>
            <li>
              <router-link v-bind:class="{ 'is-active': $route.name == 'ChangePassword' }" :to="{ name: 'ChangePassword' }">Password</router-link>
            </li>
            <li>
              <router-link v-bind:class="{ 'is-active': $route.name == 'ChangeEmail' }" :to="{ name: 'ChangeEmail' }">Email</router-link>
            </li>
          </ul>
        </aside>
      </div>
      <div class="column is-9">
        <router-view></router-view>
      </div>
    </div>
  </section>
</template>



<script>
  export default {
  }
</script>
