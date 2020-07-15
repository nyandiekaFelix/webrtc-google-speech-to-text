<template>
  <div></div>
</template>

<script>

export default {
  data() {
    return {
      user: {},
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

    this.user = (user !== undefined) ? JSON.parse(user) : null;
    this.token = (token !== undefined) ? JSON.parse(token) : null;
  }
}
</script>

