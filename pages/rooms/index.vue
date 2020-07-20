<template>
  <b-container>
    <b-button size="lg" @click="goToRoom" variant="primary">Start a meeting</b-button>
  </b-container>
</template>

<script>

export default {
  data: () => ({
    
  }),
  methods: {
    generateRoomId() {
      return ("000000" + (Math.random()*Math.pow(36,6) << 0).toString(36)).slice(-6)
    },

    goToRoom() {
      const roomId = this.generateRoomId();

      this.$router.push({
        name: 'rooms-roomId',
        params: { roomId }
      })
      
    }
  },
  mounted() {

  }
}
</script>
