import { Component, ViewChild } from '@angular/core';
import { NavController, ModalController, ViewController, Keyboard } from 'ionic-angular';
import { LoadProvider } from '../../providers/load/load';
import { ChatProvider } from '../../providers/chat/chat';
import moment from 'moment';

@Component({
  selector: 'page-chat',
  templateUrl: 'chat.html'
})
export class ChatPage {
  chats;
  userChats;
  constructor(
    public navCtrl: NavController,
    public modalCtrl: ModalController,
    public load: LoadProvider,
    public chat: ChatProvider
    ) {

  }

  ionViewWillEnter = () => {
    this.updateChats();
  }

  updateChats = () => {
    this.chats = [];
    this.userChats = [];
    
    for (let i = 0; i < this.load.user_chats.length; i++) {
      if (this.userChats.indexOf(this.load.user_chats[i].pair) === -1) {
        if (moment(this.load.user_chats[i].time).isValid()) this.load.user_chats[i].time = moment(this.load.user_chats[i].time).format("MMM Do YY, h:mm a");
        this.chats.push(this.load.user_chats[i]);
        this.userChats.push(this.load.user_chats[i].pair);
      }
    }
  }

  refresh = async (ev) => {
    await this.load.loadChats();
    this.updateChats();
    ev.complete();
  }

  isCurrentUser(senderID) {
    return senderID == this.load.user.uid;
  }

  goNewMessage = () => {
    let newMessageModal = this.modalCtrl.create(NewMessagePage);
    newMessageModal.present();
    newMessageModal.onDidDismiss(data => {
      if (data) {
        let chatModal = this.modalCtrl.create(ChatDetailPage);
        chatModal.present();
        chatModal.onDidDismiss(data => {

        });
      }
    });
  }

  goToMessage = (message) => {
    this.chat.currentChatPairId = message.pair;
    this.chat.currentChatPartner = (message.receiver.uid === this.load.user.uid ? message.sender : message.receiver);
    let chatModal = this.modalCtrl.create(ChatDetailPage);
    chatModal.present();
    chatModal.onDidDismiss(data => {

    });
  }

}

@Component({
  selector: 'page-new-message',
  templateUrl: 'newMessage.html'
})
export class NewMessagePage {

  constructor(
    public navCtrl: NavController,
    public viewCtrl: ViewController,
    public load: LoadProvider,
    public chat: ChatProvider
  ) {}

  sendMessage = (item) => {
    console.log(item);
    this.chat.currentChatPairId = this.chat.createPairId(this.load.user, item);
    this.chat.currentChatPartner = item;
    this.viewCtrl.dismiss(item);
  }

}

@Component({
  selector: 'page-chat-detail',
  templateUrl: 'chatDetail.html'
})
export class ChatDetailPage {
  chats = [];
  chatpartner = this.chat.currentChatPartner;
  chatuser = this.load.user;
  message;
  chatPayload;
  intervalScroll;

  @ViewChild("content") content: any;
  constructor(
    public viewCtrl: ViewController,
    public load: LoadProvider,
    public chat: ChatProvider,
    public keyboard: Keyboard
  ) {}

  ionViewWillLoad = () => {
    console.log(this.chat.currentChatPartner);
    let self = this;
    this.load.db.collection('chats').where("pair", "==", this.chat.currentChatPairId).onSnapshot(function(querySnapshot) {
      self.chats = [];
      querySnapshot.forEach(function(doc) {
        self.chats.push(doc.data());
      });
      self.content.scrollToBottom(300);
    });
  }

  dismiss = () => {
    this.viewCtrl.dismiss();
  }

  addChat = () => {
    let receiver = this.chatpartner;
    let sender = {
      displayName: this.load.user.displayName,
      photoURL: this.load.user_data.photoURL,
      email: this.load.user.email,
      token: this.load.token,
      uid: this.load.user.uid
    }

    if (this.message && this.message !== "") {
      this.chatPayload = {
        message: this.message, 
        sender: sender,
        receiver: receiver,
        pair: this.chat.currentChatPairId,
        time: moment().format()
      };
      this.message = "";
      this.chat.addChat(this.chatPayload);
    }
  }

  isChatPartner(senderID) {
    return senderID == this.chatpartner.uid;
  }

  checkKeyboard() {
    if (this.keyboard.isOpen()) {
      this.content.scrollToBottom(300);
    }
  }
}
