import { Injectable, Component } from '@angular/core';
import { ModalController, ViewController, Events, LoadingController, AlertController, ToastController } from 'ionic-angular';

import { Storage } from '@ionic/storage';

import * as firebase from 'firebase';
import 'firebase/firestore';
import moment from 'moment';
import { UUID } from 'angular2-uuid';

@Injectable()
export class LoadProvider {
  user: any;
  token;
  user_data = {
    info: '',
    token: this.token,
    displayName: '',
    photoURL: '',
    uid: '',
    role: 1
  };
  user_connections = [];
  group_posts = [];
  numConnections = 0;
  numPosts = 0;
  user_posts = [];
  db = firebase.firestore();
  selectedPage = 1;
  products;
  role;
  user_chats = [];
  user_groups = [];
  activeGroup = null;
  numGroups;

  constructor(
    private storage: Storage,
    public modalCtrl: ModalController,
    public events: Events
  ) {
    
  }

  clearData = () => {
    this.user_data = {
      info: '',
      token: this.token,
      displayName: '',
      photoURL: '',
      uid: '',
      role: 0
    };
    this.user_connections = [];
    this.user_posts = [];
    this.group_posts = [];
  }

  getUser = async (user) => {
    let userProfile = await this.db.collection('user-profiles').doc(user.uid).get();
    return userProfile.data().data;
  }

  getUserPostsAndConnections = async (user) => {
    let posts = await this.db.collection('user-profiles').doc(user.uid).collection('posts').get();
    let connections = await this.db.collection('user-profiles').doc(user.uid).collection('connections').get();
    let data = {
      posts: [],
      connections: 0
    };
    await posts.forEach(async doc => {
      data.posts.push(doc.data());
    })
    await connections.forEach(async doc => {
      data.connections++;
    });

    return data;
  }

  loadHome = async () => {
    let self = this;
    this.db.collection('user-profiles').doc(this.user.uid).collection('groups').onSnapshot(async function(doc) {
      self.user_groups = [];
      self.numGroups = doc.size;
      await doc.forEach(element => {
        self.user_groups.push(element.data());
      })

      self.configureGroupPosts();
    })
  };

  getHome = async () => {
    let groups = await this.db.collection('user-profiles').doc(this.user.uid).collection('groups').get();
    this.user_groups = [];
    this.numGroups = groups.size;
    await groups.forEach(element => {
      this.user_groups.push(element.data());
    })
    this.configureGroupPosts();
  }

  loadPosts = async () => {
    let self = this;
    this.db.collection('user-profiles').doc(this.user.uid).collection('posts').onSnapshot(async function(doc) {
      self.user_posts = [];
      await doc.forEach(element => {
        let post = {
          data: element.data(),
          user_post_id: element.id
        }
        self.user_posts.push(post);
      });
      self.user_posts = await self.user_posts.sort(function (a, b) {
        return moment.utc(b.data.timestamp).diff(moment.utc(a.data.timestamp));
      })
      self.numPosts = doc.size;
    });
  }

  loadChats = async () => {
    let sentChats = [];
    let receivedChats = [];

    let sentRef = await this.db.collection('chats').where('sender.uid', '==', this.user.uid).get();
    for (let sentDoc of sentRef.docs) {
        sentChats.push(sentDoc.data());
    }
    let receivedRef= await this.db.collection('chats').where('receiver.uid', '==', this.user.uid).get();
    for (let receivedDoc of receivedRef.docs) {
      receivedChats.push(receivedDoc.data());
    }

    let allArray = [...sentChats, ...receivedChats];
    let unique_array = [];
    for(let i = 0;i < allArray.length; i++){
        if(unique_array.indexOf(allArray[i]) == -1){
            unique_array.push(allArray[i])
        }
    }

    unique_array.sort(function (a, b) {
      return moment.utc(b.time).diff(moment.utc(a.time));
    });

    this.user_chats = unique_array;
  }

  configureGroupPosts = async () => {
   let groups = this.user_groups;
   this.user_groups = [];
   groups.forEach(async group => {
     let foundGroup = await this.db.collection('groups').where("group_code", "==", group.group_code).get();
     foundGroup.forEach(async data => {
       let posts = await this.db.collection('groups').doc(data.id).collection('posts').get();
       let group_posts = [];
       posts.forEach(doc => {
         group_posts.push(doc.data());
       });
       let new_group = {
        data: data.data(),
        posts: group_posts,
        key: data.id
       }
       this.user_groups.push(new_group);
     });
   });
  }

  loadUser = async () => {
    let self = this;
    this.user_data = {
      info: '',
      token: this.token,
      displayName: '',
      photoURL: '',
      uid: '',
      role: 1
    };
    this.db.collection('user-profiles').doc(this.user.uid).onSnapshot(function(doc) {
      if (doc.data())
      {
        self.user_data = doc.data().data;
        self.role = doc.data().data.role;
      }
      else self.createUser();
    })
  }

  createUser = async () => {
    let self = this;
    this.db.collection('user-profiles').doc(this.user.uid).set({
      data: {
        token: this.token,
        role: 1
      }
    });
  }
  updateUserRole = () => {
    let self = this;
    this.db.collection('user-profiles').doc(this.user.uid).update({
      data: self.user_data
    });
  }

  createGroup = async (data) => {
    this.db.collection('groups').add(data);
  }

  addEvent = (event) => {
    this.db.collection('groups').doc(event.group.key).collection('events').add(event);
  }

  async uploadImage(file) {
    let today = moment().format('YYYYMMDD');
    let storageRef = firebase.storage().ref();
    let avatarImageRef = storageRef.child('avatar-images/'+this.user.uid + '/' + this.user.uid + '_' + today + '_avatar.jpg');
    await avatarImageRef.putString(file, 'base64')
    let url = await avatarImageRef.getDownloadURL();
    return url;
  }

  async uploadPostImage(file) {
    let uuid = UUID.UUID();
    let storageRef = firebase.storage().ref();
    let avatarImageRef = storageRef.child('post-images/'+this.user.uid + '/' + this.user.uid + '_' + uuid + '_post.jpg');
    await avatarImageRef.putString(file, 'base64');
    let url = await avatarImageRef.getDownloadURL();
    return url;
  }

  uploadPost = async (post) => {
    this.db.collection('user-profiles').doc(this.user.uid).collection('posts').add(post);
    let foundGroup = await this.db.collection('groups').where("group_code", "==", post.group).get();
    foundGroup.forEach(group => {
      this.db.collection('groups').doc(group.id).collection('posts').add(post);
      return;
    })
  }

  updateGroupData = (group) => {
    this.db.collection('groups').doc(group.key).update({
      group_code: group.data.group_code,
      group_name: group.data.group_name,
      photoURL: group.data.photoURL
    })
  }

  updateUserProfileInfo = async (displayName, photoURL) => {
    let self = this;
    
    firebase.auth().currentUser.updateProfile({
      displayName: displayName,
      photoURL: photoURL
    });

    this.db.collection('user-profiles').doc(this.user.uid).update({
      data: self.user_data
    })
  }

  joinGroup = (group) => {
    console.log(group);
    this.db.collection('groups').doc(group.key).update({
      members: group.data.members
    });
    this.db.collection('user-profiles').doc(this.user.uid).collection('groups').add({group_code: group.data.group_code});
  }

  leaveGroup = async (group) => {
    this.db.collection('groups').doc(group.key).update({
      members: group.data.members
    });
    let groups = await this.db.collection('user-profiles').doc(this.user.uid).collection('groups').get();
    groups.forEach(doc => {
      if (doc.data().group_code === group.data.group_code) {
        this.db.collection('user-profiles').doc(this.user.uid).collection('groups').doc(doc.id).delete();
        return;
      }
    })
  }

  isConnected = async (uid) => {
    let connection = await this.db.collection('user-profiles').doc(uid).collection('connections').get();
    return connection
  }

  getGroupData = async (group) => {
    let groups = await this.db.collection('groups').doc(group.key).get();
    let posts = await this.db.collection('groups').doc(group.key).collection('posts').get();
    let group_posts = [];
    await posts.forEach(doc => {
      group_posts.push(doc.data());
    });
    let new_group = {
      data: groups.data(),
      posts: group_posts,
      key: groups.id
    }
    
    return new_group;
  }

  removePost = async (post) => {
    this.db.collection('user-profiles').doc(this.user.uid).collection('posts').doc(post.user_post_id).delete();
    let foundGroup = await this.db.collection('groups').where("group_code", "==", post.data.group).get();
    foundGroup.forEach(async doc => {
      let groupRef = await this.db.collection('groups').doc(doc.id).collection('posts').where("uuid", "==", post.data.uuid).get();
      groupRef.forEach(ref => {
        this.db.collection('groups').doc(doc.id).collection('posts').doc(ref.id).delete();
        return;
      });
    });
  }
  
  loadInitialData= async () => {
    let loggedIn = await this.storage.get('loggedIn');
    if (loggedIn) {
      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          this.user = user;
          this.events.publish('user:loaded', this.user);
          this.loadHome();
          this.loadUser();
          this.loadPosts();
          this.loadChats();
        } else {
          let loginModal = this.modalCtrl.create(LoginPage);
          loginModal.present();
          loginModal.onDidDismiss(data => {
            this.loadHome();
            this.loadUser();
            this.loadPosts();
            this.loadChats();
          })
        }
      })
    } else {
      let loginModal = this.modalCtrl.create(LoginPage);
      loginModal.present();
      loginModal.onDidDismiss(data => {
        this.loadHome();
        this.loadUser();
        this.loadPosts();
        this.loadChats();
      })
    }
  }

  titleCase(str) {
    if (str) {
      var splitStr = str.toLowerCase().split(' ');
      for (var i = 0; i < splitStr.length; i++) {
          // You do not need to check if i is larger than splitStr length, as your for does that for you
          // Assign it back to the array
          splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
      }
      // Directly return the joined string
      return splitStr.join(' '); 
    }

 }

}

@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {
  userData = {
    email: '',
    password: ''
  }
 constructor(
   public viewCtrl: ViewController,
   private storage: Storage,
   public modalCtrl: ModalController,
   public loader: LoadingController,
   public load: LoadProvider,
   public alertCtrl: AlertController,
   public toast: ToastController
  ) {}
 
 async login() {
   let loader = this.loader.create({
      spinner: 'ios',
      content: 'Logging In',
      showBackdrop: true
   });
   try {
    loader.present();
    let result = await firebase.auth().signInWithEmailAndPassword(this.userData.email, this.userData.password);
    if (!result.emailVerified) {
      let prompt = this.alertCtrl.create({
        title: 'Verify Email Address',
        message: 'To continue, you will need to verify your email address. Check your spam folder if you can\'t find the email',
        buttons: [
          {
            text: 'Okay',
            handler: () => {}
          },
          {
            text: 'Resend',
            handler: () => {
              let user = firebase.auth().currentUser;
              user.sendEmailVerification();
              let toast = this.toast.create({
                message: 'Email Verification Sent',
                duration: 6000,
                position: 'bottom',
                showCloseButton: true
              });
              toast.present();
            }
          }
        ]
      });
      prompt.present();
      throw Error("Error");
    }
    this.load.user = result;
    loader.dismiss();
    await this.storage.set('loggedIn', true);
    this.dismiss(result);
  } catch (error) {
     console.log(error);
     loader.dismiss();
   }
 }

 showSignUpModal() {
  const modal = this.modalCtrl.create(SignUpPage);
  modal.present();
  modal.onDidDismiss(data => {
    if (data) {
      let toast = this.toast.create({
        message: 'Email Verification Sent',
        duration: 6000,
        position: 'bottom',
        showCloseButton: true
      });
      toast.present();
    }
  });
}

 onKey(event: any, state) { 
  if (state == 'user') {
    this.userData.email = event.target.value;
  } else if (state == 'pass') {
    this.userData.password = event.target.value;
  }
}

 dismiss(result) {
   this.viewCtrl.dismiss(result);
 }

}

@Component({
  selector: 'page-sign-up',
  templateUrl: 'sign-up.html'
})
export class SignUpPage {
  public user = {
    email: '',
    password: '',
    passwordConf: ''
  }
  disabled = false;
 constructor(
   public viewCtrl: ViewController,
   public load: LoadProvider
  ) {}

  async submit() {
    firebase.auth().createUserWithEmailAndPassword(this.user.email, this.user.password);
    let user = firebase.auth().currentUser;
    user.sendEmailVerification();
    this.viewCtrl.dismiss(true);
  }

  cancelModal() {
    this.viewCtrl.dismiss();
  }

  onKey(event: any, state) { 
    if (state == 'pass') {
      this.user.password = event.target.value;
    } else if (state == 'email') {
      this.user.email = event.target.value;
    } else {
      this.user.passwordConf = event.target.value;
    }
    if ((this.user.email.length > 0) && (this.user.password.length >= 6) && (this.user.passwordConf === this.user.password)) {
      this.disabled = false;
    }
  }

}
