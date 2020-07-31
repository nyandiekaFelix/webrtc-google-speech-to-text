<template>
  <b-container>
    <h4>User Administration</h4>
    <b-button @click="showModal">New User</b-button>
    <b-modal ref="modal" hide-footer title="Add a new user">
      <div class="d-block text-center">
        
        <b-form>
          <b-form-group
            id="input-group-1"
            label="Email address:"
            label-for="input-email"
          >
            <b-form-input
              id="input-email"
              v-model="newUser.email"
              type="email"
              required
              placeholder="Enter email"
            ></b-form-input>
          </b-form-group>

        <b-form-group id="input-group-2" label="Username:" label-for="input-username">
          <b-form-input
            id="input-username"
            type="text"
            v-model="newUser.username"
            required
            placeholder="Enter username:"
          ></b-form-input>
        </b-form-group>
        <b-form-group id="input-group-2" label="Password:" label-for="input-password">
          <b-form-input
            id="input-password"
            type="password"
            v-model="newUser.password"
            required
            placeholder="Enter password"
          ></b-form-input>
        </b-form-group>
    </b-form>
      </div>
      <b-button size="sm" class="mt-2" variant="danger" @click="hideModal">Cancel</b-button>
      <b-button size="sm" class="mt-2" variant="primary" @click="createUser">Save</b-button>
    </b-modal>

    <b-table
      :items="users"
      :fields="fields">
      <template v-slot:cell(actions)="row">
        <b-button size="sm" @click="deleteUser(row)" class="mr-1" variant="danger">
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
      ],
      newUser: {
        username: null,
        email: null,
        password: null
      }
    }
  },
  methods: {
    showModal() {
      this.$refs['modal'].show()
    },
    hideModal() {
      this.$refs['modal'].hide()
    },
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
          console.log('res', response)
          // this.users = response.data.users;
        })
        .catch(error => { this.error = error.message })
    },
    createUser() {
      this.$axios.post('/useradmin/users', { ...this.newUser })
        .then(response => {
          this.hideModal();
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
