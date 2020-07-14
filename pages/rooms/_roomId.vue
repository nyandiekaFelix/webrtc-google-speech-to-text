<template>
  <div>Single Room</div>
</template>

<script>
import AuthMixin from '../../mixins/AuthMixin';

export default {
  data() {
    return { roomId: null }
  },
  mounted() {
    this.roomId = this.$route.params.roomId;
  }
}
</script>
