import { Injectable } from '@angular/core';
import { LoadProvider } from '../load/load';
/*
  Generated class for the ChatProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class ChatProvider {
  db = null;
  users = null;
  chats = null;

  currentChatPairId;
  currentChatPartner;

  constructor(public load: LoadProvider) {
    this.chats = this.load.db.collection('chats');
  }

  addUser(payload) {
    return this.users.add(payload);
  }

  addChat(chat) {
    console.log(chat);
    return this.chats.add(chat);
  }

  createPairId(user1, user2) {
    let pairId;
    if (user1.uid < user2.uid) {
      pairId = `${user1.uid}|${user2.uid}`;
    } else {
      pairId = `${user2.uid}|${user1.uid}`;
    }

    return pairId;
  }

}
