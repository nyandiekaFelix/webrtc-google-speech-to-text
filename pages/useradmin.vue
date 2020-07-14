<template>
  <b-container>
    <h4>User Administration</h4>

    <b-table
      :items="users"
      :fields="fields">
      <template v-slot:cell(actions)="row">
        <b-button size="sm" @click="" class="mr-1" variant="danger">
          Delete User
        </b-button>
      </template>
    </b-table>
  </b-container>
</template>

<script>
import AuthMixin from '../mixins/AuthMixin';

export default {
  data() {
    return { 
      users: null, 
      error: null,
      fields: [
        { key: 'username', label: 'Username' },
        { key: 'email', label: 'Email' },
        { key: 'actions', label: 'Actions' }
      ] 
    }
  },
  methods: {
    getUsers() {
      this.$axios.get('/useradmin/users')
        .then(response => {
          console.log(response)
          this.users = response.data.users;
        })
        .catch(error => { this.error = error.message })
    },
    deleteUser(row) {
      console.log('row', row.item);
      
      this.$axios.delete(`/useradmin/${row.item.email}`)
        .then(response => {
          console.log(response)
          // this.users = response.data.users;
        })
        .catch(error => { this.error = error.message })
    },
    createUser() {
      this.$axios.post('/useradmin/users')
        .then(response => {
          console.log(response)
          // this.users = response.data.users;
        })
        .catch(error => { this.error = error.message })
    }
  },
  async mounted() {
    await this.getUsers()
  }
}
</script>
