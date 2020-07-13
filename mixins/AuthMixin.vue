<template>
  <div></div>
</template>

<script>

export default {
  data() {
    return {
      user: null,
      token: null,
    };
  },
  computed: {
    isLoggedIn() {
      return (this.user && this.token) ? true : false;
    }
  },

  methods: {
    //logout() {}
  },

  mounted() {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    this.user = user ? JSON.parse(user) : null;
    this.token = token ? JSON.parse(token) : null;
  }
}
</script>

