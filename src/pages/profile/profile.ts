import { Component } from '@angular/core';
import { NavController, ModalController, PopoverController, ViewController, ToastController, NavParams, ActionSheetController, AlertController } from 'ionic-angular';
import { LoadProvider, LoginPage } from '../../providers/load/load';
import { EditProfile } from '../edit-profile/edit-profile';
import { Clipboard } from '@ionic-native/clipboard';
import { SocialSharing } from '@ionic-native/social-sharing';
import firebase from 'firebase';
import { Storage } from '@ionic/storage';
import { InAppPurchase } from '@ionic-native/in-app-purchase';
import { AppVersion } from '@ionic-native/app-version';
import { UserProfilePage } from '../userProfile/userProfile';
import { ManageGroupPage } from '../manageGroups/manageGroups';
import { AdMobFree } from '@ionic-native/admob-free';

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
    console.log(post);
    let postModal = this.modalCtrl.create(PostPage, {post: post});
    postModal.present();
  }

  showGroups = () => {
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
      <button ion-item (click)="createCode()">Create A Group</button>
      <button ion-item (click)="manageGroups()">Manage Groups</button>
      <button ion-item (click)="shareCode()">Share A Group Code</button>
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
    private modalCtrl: ModalController,
    public alertCtrl: AlertController
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

  createCode = () => {
    if (this.load.user_data.displayName !== '' && this.load.user_data.photoURL !== '') {
      let createGroupModal = this.modalCtrl.create(CreateGroupPage);
      createGroupModal.present();
    } else {
      alert("Please setup your profile first");
    }
    
  }

  manageGroups = () => {
    let manageGroupsModal = this.modalCtrl.create(ManageGroupPage);
    manageGroupsModal.present();
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
    let radioAlert = this.alertCtrl.create();
    radioAlert.setTitle('Pick Group');
    for (let i = 0; i < this.load.user_groups.length; i++) {
      this.load.user_groups[i].data.group_name = this.load.titleCase(this.load.user_groups[i].data.group_name);
      radioAlert.addInput({
        type: 'radio',
        label: this.load.user_groups[i].data.group_name,
        value: this.load.user_groups[i].data.group_code,
        checked: false
      });
    }
    radioAlert.addButton('Cancel');
    radioAlert.addButton({
      text: 'OK',
      handler: data => {
        let options = {};
        options = {
          message: "Check out the Family Reunion App! Don't forget to join my group using my Family Code: " + data + "\n",
          url: 'https://austinshunter.wixsite.com/mypeepsapp'
        }
        this.socialSharing.shareWithOptions(options);
        this.close();
      }
    });
    radioAlert.present();
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
  activeGroup = {
    data: {
      members: []
    }
  }
  constructor(
    public viewCtrl: ViewController,
    public navParams: NavParams,
    public load: LoadProvider,
    public modalCtrl: ModalController
   ) {
   }

   showConnection = (user) => {
     if (user.uid !== this.load.user.uid) {
       console.log(user);
      let userProfileModal = this.modalCtrl.create(UserProfilePage, {post: user});
      userProfileModal.present();
     }
   }

   changeGroup = () => {}

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
       if (response[0]) {
         let receipt = JSON.parse(response[0].receipt);
         if (receipt.purchaseState === 0) {
          this.load.user_data.role = 0;
          this.load.updateUserRole();
          let toast = this.toast.create({
           message: 'Ads Removed, Thank You!',
           duration: 2000,
           position: 'bottom'
          });
          toast.present();
         }
       }
       
     }).catch(error => console.log(error));
   }

   
}

@Component({
  selector: 'page-create-group',
  templateUrl: 'createGroup.html'
})
export class CreateGroupPage {

  data = {
    group_name: '',
    group_code: '',
    admin: this.load.user.uid,
    members: []
  }

  foundGroup = false;

  constructor(
    public viewCtrl: ViewController,
    public navParams: NavParams,
    public load: LoadProvider,
    public admob: AdMobFree
   ) {
   }

    ionViewWillLoad = async () => {}

    submit = async () => {
      if (!this.foundGroup) {
        if (this.data.group_name !== '' && this.data.group_code !== '') {
          this.data.members.push(this.load.user_data);
          this.data.group_name = this.data.group_name.toLowerCase();
          this.load.createGroup(this.data);
          this.load.db.collection('user-profiles').doc(this.load.user.uid).collection('groups').add({group_code: this.data.group_code});
          if (this.load.role === 1) {
            this.admob.interstitial.config({
              id: 'ca-app-pub-7853858495093513/4773247160',
              isTesting: false,
              autoShow: true
            });
            await this.admob.interstitial.prepare();
          }
          this.viewCtrl.dismiss();
        } else {
          alert("Group Name and Code is required");
        }
      } else {
        alert("Group Code Already Exists!");
      }
    }

    searchGroupName = async (ev) => {
      let foundGroup = await this.load.db.collection('groups').where("group_code", "==", ev.target.value).get();
      if (!foundGroup.empty) {
        this.foundGroup = true;
      } else {
        this.foundGroup = false;
      }
    }

   
}


