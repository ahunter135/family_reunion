import { Component } from '@angular/core';
import { NavController, ModalController, PopoverController, ViewController, ToastController, NavParams, ActionSheetController } from 'ionic-angular';
import { LoadProvider, LoginPage } from '../../providers/load/load';
import { EditProfile } from '../edit-profile/edit-profile';
import { Clipboard } from '@ionic-native/clipboard';
import { SocialSharing } from '@ionic-native/social-sharing';
import firebase from 'firebase';
import { Storage } from '@ionic/storage';
import { InAppPurchase } from '@ionic-native/in-app-purchase';
import { AppVersion } from '@ionic-native/app-version';

@Component({
  selector: 'page-profile',
  templateUrl: 'profile.html'
})
export class ProfilePage {
  profile_segment = 'grid';
  constructor(
    public navCtrl: NavController,
    public load: LoadProvider,
    public modalCtrl: ModalController,
    public popoverCtrl: PopoverController,
    public actionSheetCtrl: ActionSheetController
  ) {}
  
  ionViewDidLoad = () => {
    console.log(this.load.user_posts);
  }

  showOptions = (myEvent) => {
    let popover = this.popoverCtrl.create(PopoverPage);
    popover.present({
      ev: myEvent
    })
    popover.onDidDismiss(data => {
      if (data) {
        let loginModal = this.modalCtrl.create(LoginPage);
        //loginModal.present();
      }
    });
  }

  showEditModal() {
    const editModal = this.modalCtrl.create(EditProfile);
    editModal.present();
    editModal.onDidDismiss(data => {
      //this.chosenPicture = this.load.user.photoURL;
    });
  }

  showPostModal = (post) => {
    let postModal = this.modalCtrl.create(PostPage, {post: post});
    postModal.present();
  }

  showConnections = () => {
    let connectionModal = this.modalCtrl.create(ConnectionPage);
    connectionModal.present();
  }

  onHold(post) {
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Remove Post?',
      buttons: [
        {
          text: 'Yes',
          role: 'destructive',
          handler: () => {
            this.load.removePost(post);
          }
        },
        {
          text: 'No',
          role: 'cancel',
          handler: () => {}
        }
      ]
    });
    actionSheet.present();
  }

}

@Component({
  template: `
    <ion-list>
      <ion-list-header>Options</ion-list-header>
      <button ion-item (click)="copyCode()">Copy Family Code</button>
      <button ion-item (click)="shareCode()">Share Family Code</button>
      <button ion-item (click)="logout()">Logout</button>
    </ion-list>
  `
})
export class PopoverPage {
  constructor(
    public viewCtrl: ViewController,
    private clipboard: Clipboard,
    private load: LoadProvider,
    private socialSharing: SocialSharing,
    private toast: ToastController,
    private storage: Storage,
    private modalCtrl: ModalController
  ) {}

  close() {
    this.viewCtrl.dismiss();
  }

  copyCode = () => {
    this.clipboard.copy(this.load.user.uid);
    let toast = this.toast.create({
      message: 'Family Code Copied',
      duration: 2000,
      position: 'bottom',
      showCloseButton: true
    });
    toast.present();
    this.close();
  }

  logout = () => {
    let self = this;
    firebase.auth().signOut().then(function() {
      self.storage.remove('loggedIn');
      self.load.clearData();
      self.viewCtrl.dismiss(true);
    }).catch(function(error) {
    });
    
  }

  shareCode = () => {
    let options = {};
    options = {
      message: "Check out the Family Reunion App! Don't forget to add me using my Family Code: " + this.load.user.uid + "!\n",
      url: 'https://austinshunter.wixsite.com/mypeepsapp'
    }
    this.socialSharing.shareWithOptions(options);
    this.close();
  }
}

@Component({
  selector: 'page-post',
  templateUrl: 'post.html'
})
export class PostPage {
 post;
 constructor(
   public viewCtrl: ViewController,
   public navParams: NavParams
  ) {
    this.post = navParams.get('post');
  }

}

@Component({
  selector: 'page-connections',
  templateUrl: 'connections.html'
})
export class ConnectionPage {
  constructor(
    public viewCtrl: ViewController,
    public navParams: NavParams,
    public load: LoadProvider
   ) {
   }

   removeConnection = async (user) => {
     let response = await this.load.isConnected(this.load.user.uid);
     let key;
     await response.forEach(doc => {
      key = doc.id;
      return;
     });
     console.log(key);
     this.load.removeConnection(key, user);
   }
}

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html'
})
export class SettingsPage {

  appVersionNumber = '';

  constructor(
    public viewCtrl: ViewController,
    public navParams: NavParams,
    public load: LoadProvider,
    public iap: InAppPurchase,
    public toast: ToastController,
    private appVersion: AppVersion
   ) {
   }

   ionViewWillLoad = async () => {
     this.appVersionNumber = await this.appVersion.getVersionNumber();
   }

   removeAds = async () => {
     this.iap.buy('com.austinhunter.remove_ads').then(response => {
       this.load.user_data.role = 0;
       this.load.updateUserRole();
       let toast = this.toast.create({
        message: 'Ads Removed, Thank You!',
        duration: 2000,
        position: 'bottom'
      });
      toast.present();
     }).catch(error => alert(JSON.stringify(error.message)));
   }

   restore = () => {
     this.iap.restorePurchases().then(response => {
      this.load.user_data.role = 0;
       this.load.updateUserRole();
       let toast = this.toast.create({
        message: 'Ads Removed, Thank You!',
        duration: 2000,
        position: 'bottom'
      });
      toast.present();
     }).catch(error => console.log(error));
   }

   
}


