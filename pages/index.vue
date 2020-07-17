<template>
  <div class="container">
    <b-card align="left" v-if="showForm && !isLoggedIn">

    <b-form>
      <b-form-group
        id="input-group-1"
        label="Email address:"
        label-for="input-email"
      >
        <b-form-input
          id="input-email"
          v-model="email"
          type="email"
          required
          placeholder="Enter email"
        ></b-form-input>
      </b-form-group>

      <b-form-group id="input-group-2" label="Password:" label-for="input-password">
        <b-form-input
          id="input-password"
          type="password"
          v-model="password"
          required
          placeholder="Enter password"
        ></b-form-input>
      </b-form-group>

      <b-button @click="login" variant="primary">Submit</b-button>
    </b-form>
    </b-card>

    <b-jumbotron lead="Welcome to the video chat app" v-if="isLoggedIn">
      <b-button variant="primary">
        <nuxt-link to="/rooms" :style="{ color: '#fff' }">Rooms</nuxt-link>
      </b-button>
    </b-jumbotron>

  </div>
</template>

<script>
import AuthMixin from '../mixins/AuthMixin';

export default {
  mixins: [AuthMixin],
  data() {
    return {
      email: null,
      password: null,
      error: null,
      showForm: true
    };
  },
  computed: {},
  methods: {
    displayError(error) {
      this.error = error;
    },

    login() {
      this.$axios.post(
        '/auth/login', 
        { email: this.email, password: this.password })
        .then(response => {
          const { user, token } = response.data;
          
          this.user = user;
          this.token = token;
          
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('token', JSON.stringify(token));
          //this.resetFormData();
        })
        .catch(err => { this.displayError(err) });
    },

    resetFormData() {
      this.email = null;
      this.password = null;

      // clear form validation state
      this.showForm = false;
      this.$nextTick(() => {
        this.showForm = true;
      });
    }
  },
  async mounted() { 
  }
}
</script>

<style>
.container {
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.title {
  font-family: 'Quicksand', 'Source Sans Pro', -apple-system, BlinkMacSystemFont,
    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  display: block;
  font-weight: 300;
  font-size: 100px;
  color: #35495e;
  letter-spacing: 1px;
}

.subtitle {
  font-weight: 300;
  font-size: 42px;
  color: #526488;
  word-spacing: 5px;
  padding-bottom: 15px;
}

.links {
  padding-top: 15px;
}
</style>
