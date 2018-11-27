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
    uid: ''
  };
  user_connections = [];
  connection_posts = [];
  numConnections = 0;
  numPosts = 0;
  user_posts = [];
  db = firebase.firestore();
  selectedPage = 1;
  products;
  role;

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
      uid: ''
    };
    this.user_connections = [];
    this.user_posts = [];
    this.connection_posts = [];
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
    this.db.collection('user-profiles').doc(this.user.uid).collection('connections').onSnapshot(async function(doc) {
      self.user_connections = [];
      await doc.forEach(element => {
        let user = element.data();
        user.key = element.id;
        self.user_connections.push(user);
      })
      self.numConnections = doc.size;
      self.configureConnectionsPosts();
    })
  }

  loadPosts = async () => {
    let self = this;
    console.log(this.user);
    this.db.collection('user-profiles').doc(this.user.uid).collection('posts').onSnapshot(function(doc) {
      self.user_posts = [];
      doc.forEach(element => {
        self.user_posts.push(element.data());
      });
      self.numPosts = doc.size;
    });
  }

  configureConnectionsPosts = async () => {
    this.connection_posts = [];

    if (this.user_connections.length > 0) {

      await this.user_connections.forEach(async connection => {
        let posts = await this.db.collection('user-profiles').doc(connection.uid).collection('posts').get();
        await posts.forEach(post => {
          let data = post.data();
          data.uid = connection.uid;
          this.connection_posts.push(data);
        });

        this.storage.set('home-posts', this.connection_posts);
        this.events.publish('posts:loaded');
      })

    } else {
      this.events.publish('posts:loaded');
    }
  }

  loadUser = async () => {
    let self = this;
    this.user_data = {
      info: '',
      token: this.token,
      displayName: '',
      photoURL: '',
      uid: ''
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

  async uploadPost(post) {
    this.db.collection('user-profiles').doc(this.user.uid).collection('posts').add(post);
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

  addUserAsConnection = async (user) => {
    let currentUser = {
      displayName: this.user.displayName,
      info: this.user_data.info,
      photoURL: this.user.photoURL,
      token: this.token,
      uid: this.user.uid
    }
    this.db.collection('user-profiles').doc(this.user.uid).collection('connections').add(user);
    this.db.collection('user-profiles').doc(user.uid).collection('connections').add(currentUser);
  }

  removeConnection = async (key, user) => {
    this.db.collection('user-profiles').doc(this.user.uid).collection('connections').doc(key).delete();

    let response = await this.isConnected(user.uid);
    await response.forEach(doc => {
      key = doc.id;
    });
    this.db.collection('user-profiles').doc(user.uid).collection('connections').doc(key).delete();
  }

  isConnected = async (uid) => {
    let connection = await this.db.collection('user-profiles').doc(uid).collection('connections').get();
    return connection
  }

  getKey = async (uid) => {
    
  }

  removePost = async (post) => {
    let foundPost = await this.db.collection('user-profiles').doc(this.user.uid).collection('posts').where("uuid", "==", post.uuid).get();
    foundPost.forEach(doc => {
      this.db.collection('user-profiles').doc(this.user.uid).collection('posts').doc(doc.id).delete();
      return;
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
        } else {
          let loginModal = this.modalCtrl.create(LoginPage);
          loginModal.present();
          loginModal.onDidDismiss(data => {
            this.loadHome();
            this.loadUser();
            this.loadPosts();
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
      })
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
