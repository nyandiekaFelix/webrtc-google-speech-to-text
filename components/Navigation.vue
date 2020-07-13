<template>
  <b-navbar toggleable="lg" type="dark" variant="dark">
    <b-navbar-brand href="#">Video Chat</b-navbar-brand>

    <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

    <b-collapse id="nav-collapse" is-nav> 
      <b-navbar-nav class="ml-auto"> 
        <b-nav-item-dropdown right v-if="isLoggedIn">
          <template v-slot:button-content>
            <em>{{ user.username }}</em>
          </template>
          <b-dropdown-item>
            <nuxt-link to="/rooms">Rooms</nuxt-link>
          </b-dropdown-item>
          <b-dropdown-item>
            <nuxt-link to="/profile">Profile</nuxt-link>
          </b-dropdown-item>
          <b-dropdown-item href="#">Sign Out</b-dropdown-item>
        </b-nav-item-dropdown>
      </b-navbar-nav>
    </b-collapse>
  </b-navbar>
</template>

<script>
import AuthMixin from '../mixins/AuthMixin';

export default {
  mixins: [AuthMixin],
  data() {
    return {}
  },
  computed: {},

  methods: {},

  mounted() {}
}
</script>


