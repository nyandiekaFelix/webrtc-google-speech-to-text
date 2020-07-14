<template>
  <b-container>

  <b-card 
    :img-src="user.profileImage || 'https://placekitten.com/300/300'" 
    img-alt="Profile image" 
    img-left class="mb-3"
    v-if="!editting"
    >
      <b-card-text>
        <h6 class="mb-0">{{ user.username }}</h6>
        <b-button variant="primary" @click="toggleEditting">Edit Profile</b-button>
      </b-card-text>
  </b-card>
  <b-card v-if="editting">
  <b-form>
    <b-form-group
      id="input-group-1"
      label="Username:"
      label-for="input-email"
    >
      <b-form-input
        id="input-username"
        v-model="newUsername"
        type="text"
        required
        :placeholder="user.username || 'Enter username'"
      ></b-form-input>
    </b-form-group>

    <b-form-group id="input-group-2" label="Password:" label-for="input-password">
      <b-form-input
        id="input-password"
        type="password"
        v-model="newPassword"
        required
        placeholder="Enter password"
      ></b-form-input>
    </b-form-group>
 
    <b-button @click="toggleEditting" variant="danger">Cancel</b-button>
    <b-button @click="save" variant="primary">Submit</b-button>
  </b-form>
  </b-card>

  </b-container>
</template>
<script>
import AuthMixin from '../../mixins/AuthMixin';

export default {
  mixins: [AuthMixin],
  data() {
    return {
      newUsername: null,
      newPassword: null,
      editting: false,
    }
  },
  methods: {
    toggleEditting() { this.editting = !this.editting },
    save() {
      const payload = {};
      if(this.newUsername) payload.username = this.newUsername;
      if(this.newPassword) payload.password = this.newPassword;
 
      this.$axios.put(`/profile/${this.user.email}`, payload)
        .then(response => {
          console.log(response)
        })
    }
  },
  mounted() {
    console.log(this.$data)
  }
}
</script>
