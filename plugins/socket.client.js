import Vue from 'vue';
import VueSocketIO from 'vue-socket.io';
import socketioClient from 'socket.io-client';

const connection = socketioClient('https://tele.motocle2.com:8989', { secure: true });

export default function () {
 Vue.use(new VueSocketIO({
   debug: false,
   connection,
 }));
}
