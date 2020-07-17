const initialState = {
  currentUser: null,
  room: null,
  roomUsers: []
}

export const state = () => ({ ...initialState });

export const actions = {
  setCurrentUser({ commit }, user) {
    commit('SET_CURRENT_USER', user)
  },

  setRoom({ commit }, room) {
    commit('SET_ROOM', room)
  },

  updateRoomUsers({ commit }, users) {
    commit('UPDATE_ROOM_USERS', users)
  },

  resetRoomState({ commit }) {
    commit('RESET_ROOM_STATE')
  }
};

export const mutations = {
  SET_CURRENT_USER (state, user) {
    state.currentUser = user;
  },

  SET_ROOM (state, room) {
    state.room = room;
  },

  UPDATE_ROOM_USERS(state, users) {
    state.roomUsers = users;
  },
  
  RESET_ROOM_STATE(state) {
    state = initialState;
  },
}
