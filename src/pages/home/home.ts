import { Component } from '@angular/core';
import { NavController, Events, ModalController, ActionSheetController, ViewController, LoadingController, AlertController } from 'ionic-angular';
import { LoadProvider } from '../../providers/load/load';
import { ImagePicker } from '@ionic-native/image-picker';
import { Crop } from '@ionic-native/crop';
import { File } from '@ionic-native/file';
import { Camera } from '@ionic-native/camera';
import moment from 'moment';
import { UUID } from 'angular2-uuid';
import { SearchPage } from '../search/search';
import { AdMobFree } from '@ionic-native/admob-free';
import { Storage } from '@ionic/storage';
import { UserProfilePage } from '../userProfile/userProfile';
import { Slides } from 'ionic-angular';
import { ViewChild } from '@angular/core';
import { SettingsPage } from '../profile/profile';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  @ViewChild(Slides) slides: Slides;
  disableSearch;
  loading = true;

  activeGroup = {
    posts: []
  }

  constructor(
    public navCtrl: NavController,
    public load: LoadProvider,
    public events: Events,
    public modalCtrl: ModalController,
    public loader: LoadingController,
    private admob: AdMobFree,
    public alertCtrl: AlertController
  ) {}

  ionViewWillLoad = async () => {
    let loader = this.loader.create({
      spinner: 'ios',
      content: 'Loading Content',
      showBackdrop: false,
      duration: 2000
    });
    loader.present();
    this.events.subscribe('user:loaded', user => {
      if (user.displayName !== undefined) this.disableSearch = false;
      else this.disableSearch = true;
    });
  }

  swipePage = (event) => {
    console.log("HI");
    if(event.direction === 1) { // Swipe Left
      this.navCtrl.parent.select(2);
    } 

    if(event.direction === 2) { // Swipe Right
      this.navCtrl.parent.select(0);
    }
  }

  setActive = (group) => {
    this.activeGroup = group;
    this.activeGroup.posts.sort(function (a, b) {
      return moment.utc(b.timestamp).diff(moment.utc(a.timestamp));
    });
  }

  showSearch = () => {
    if (this.load.user_data.displayName === null && this.load.user_data.photoURL === null) {
      let prompt = this.alertCtrl.create({
        title: 'Setup Profile',
        subTitle: 'You need to setup your profile before you can post anything!',
        buttons: ['OK']
      });
      prompt.present();
    } else {
      let searchModal = this.modalCtrl.create(SearchPage);
      searchModal.present();
      searchModal.onDidDismiss(data => {
        
      });
    }
  }

  showSettings = () => {
    let settingsModal = this.modalCtrl.create(SettingsPage);
    settingsModal.present();
  }

  submitPost = () => {
    if (this.load.user_data.displayName === null && this.load.user_data.photoURL === null) {
      let prompt = this.alertCtrl.create({
        title: 'Setup Profile',
        subTitle: 'You need to setup your profile before you can post anything!',
        buttons: ['OK']
      });
      prompt.present();
    } else {
      let postModal = this.modalCtrl.create(AddPostPage);
      postModal.present();
      postModal.onDidDismiss(async data => {
        if (data) {
          this.loading = true;

          let pendingPosts = data.pendingPosts;
          let post = data.post;
          for (let i = 0; i < pendingPosts.length; i++) {
            let data = await this.load.uploadPostImage(pendingPosts[i]);
            this.loading = false;
            post.post_imgs.push(data);
          }
          console.log(post);
          this.load.uploadPost(post);
          if (this.load.role === 1) {
            this.admob.interstitial.config({
              id: 'ca-app-pub-7853858495093513/4773247160',
              isTesting: false,
              autoShow: true
            });
            await this.admob.interstitial.prepare();
          }
        }
      });
    }
  }

  showProfile = (post) => {
    if (this.load.user.uid !== post.uid) {
      let profileModal = this.modalCtrl.create(UserProfilePage, {post: post});
      profileModal.present();
      profileModal.onDidDismiss(data => {
  
      })
    }
  }

  doRefresh = async (ev) => {
    if (this.activeGroup.posts.length !== 0) {
      this.activeGroup = await this.load.getGroupData(this.activeGroup);
      this.activeGroup.posts.sort(function (a, b) {
        return moment.utc(b.timestamp).diff(moment.utc(a.timestamp));
      });
    }
    this.load.getHome();
    ev.complete();
  }
}

@Component({
  selector: 'page-add-post',
  templateUrl: 'addPost.html'
})
export class AddPostPage {
 post = {
   uuid: UUID.UUID(),
   uid: this.load.user.uid,
   profile_img: this.load.user.photoURL,
   displayName: this.load.user.displayName,
   post_imgs: [],
   description: null,
   postedAt: moment().format("MMM Do YY, h:mm a"),
   timestamp: moment().format(),
   group: null
 }
 loading = true;
 numImages;
 pendingPosts = [];
 constructor(
   public actionSheetCtrl: ActionSheetController,
   public imagePicker: ImagePicker,
   public crop: Crop,
   public load: LoadProvider,
   public file: File,
   public camera: Camera,
   public viewCtrl: ViewController
  ) {}

 ionViewDidLoad = async () => {
    this.loading = true;
    this.showActionSheet();
 }

 showActionSheet = () => {
  let options = {
    targetHeight: 1080,
    targetWidth: 1080,
    quality: 100,
    destinationType: this.camera.DestinationType.FILE_URI,
    encodingType: this.camera.EncodingType.JPEG,
    sourceType: null,
    allowEdit: true,
    correctOrientation: true,
    cameraDirection: 1,
    saveToPhotoAlbum: false
  };
  const actionSheet = this.actionSheetCtrl.create({
    title: 'Image Source',
    buttons: [
      {
        text: 'Photo Library',
        handler: async () => {
          options.sourceType = this.camera.PictureSourceType.SAVEDPHOTOALBUM;
          let imageData = await this.showCameraPhotoLibrary(options);
          let newImage = await this.crop.crop(imageData , {
            quality: 100,
            targetHeight: 1080,
            targetWidth: 1080
          });
          let newImageURL = await this.encodeImageUri(newImage);
          this.pendingPosts.push(newImageURL);
          this.loading = false;
        }
      },
      {
        text: 'Camera',
        handler: () => {
          options.sourceType = this.camera.PictureSourceType.CAMERA;
          this.showCamera(options);
        }
      }
    ]
  });
  actionSheet.present();
 }

 showCamera = async (options) => {
  this.camera.getPicture(options).then(async (imageData) => {
    let newImageURL = await this.encodeImageUri(imageData);
    this.pendingPosts.push(newImageURL);

    this.loading = false;
  }).catch((err) => {
    this.viewCtrl.dismiss();
  })
}

showCameraPhotoLibrary = async (options) => {
  let imageData = await this.camera.getPicture(options).catch((err) => {
    this.viewCtrl.dismiss();
  });
  return imageData;
}

addAnother = async () => {
  this.showActionSheet();
}

 async encodeImageUri(filePath) {
  let fileName = filePath.split('/').pop();
  let path = filePath.substring(0, filePath.lastIndexOf("/") + 1);
  fileName = fileName.split('?');

  let base64string = await this.file.readAsDataURL(path, fileName[0]);
  base64string = base64string.split(',').pop();

  return base64string;
 };

 submit = async () => {
   if (this.post.group === null) {
     alert("Please select a group to post to!");
     return;
   } else if (this.load.user_data.displayName === null || this.load.user_data.photoURL === null) {
     alert("Please setup your profile before posting!");
     return;
   }
   this.viewCtrl.dismiss({pendingPosts: this.pendingPosts, post: this.post, numImages: this.numImages});
  }
 }
