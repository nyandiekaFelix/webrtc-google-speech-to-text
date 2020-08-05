import Vue from 'vue';
import VueSocketIO from 'vue-socket.io-extended';
import socketioClient from 'socket.io-client';

const url = process.env.NODE_ENV === 'production' ?
  'https://tele.motocle2.com:8989' :
  'http://localhost:8989';

const connection = socketioClient(url, { secure: true });

export default function () {
 Vue.use(VueSocketIO, connection);
}
