import { Component } from '@angular/core';
import { NavController, Events, ModalController, ActionSheetController, ViewController, LoadingController } from 'ionic-angular';
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

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  disableSearch;
  loading = true;
  constructor(
    public navCtrl: NavController,
    public load: LoadProvider,
    public events: Events,
    public modalCtrl: ModalController,
    public loader: LoadingController,
    private admob: AdMobFree,
    private storage: Storage
  ) {}

  ionViewDidLoad = async () => {
    let loader = this.loader.create({
      spinner: 'ios',
      content: 'Loading Content',
      showBackdrop: false,
      duration: 100
    });
    loader.present();
    if (this.load.connection_posts.length === 0) {
      this.load.connection_posts = await this.storage.get('home-posts');
      if (this.load.connection_posts === null) this.load.connection_posts = [];
    }
    this.events.subscribe('user:loaded', user => {
      if (user.displayName !== undefined) this.disableSearch = false;
      else this.disableSearch = true;
    })
    this.events.subscribe('posts:loaded', posts => {
      this.load.connection_posts = this.load.connection_posts;
      this.storage.set('home-posts', this.load.connection_posts);
    })
  }

  showSearch = () => {
    let searchModal = this.modalCtrl.create(SearchPage);
    searchModal.present();
    searchModal.onDidDismiss(data => {
      
    });
  }

  submitPost = () => {
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

  showProfile = (post) => {
    let profileModal = this.modalCtrl.create(UserProfilePage, {post: post});
    profileModal.present();
    profileModal.onDidDismiss(data => {

    })
  }

  doRefresh = async (ev) => {
    await this.load.configureConnectionsPosts();
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
   profile_img: this.load.user.photoURL,
   displayName: this.load.user.displayName,
   post_imgs: [],
   description: null,
   postedAt: moment().format("MMM Do YY")
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
   public viewCtrl: ViewController,
   private admob: AdMobFree
  ) {}

 ionViewDidLoad = async () => {
  this.loading = true;
  let options = {
    maximumImagesCount: 5,
    width: 1080,
    height: 1080,
    quality: 100
  };
  let permission = await this.imagePicker.hasReadPermission();
  if (permission) {
    this.imagePicker.getPictures(options).then(async (results) => {
      if (results.length > 0) {
        /*
        let newImage = await this.crop.crop(results[0], {
          quality: 100,
          targetHeight: 1080,
          targetWidth: 1080
        });
        */
       this.numImages = results.length;
       for (let i = 0; i < results.length; i++) {
        let newImageURL = await this.encodeImageUri(results[i]);
        this.pendingPosts.push(newImageURL);
       }
       this.loading = false;
      } else this.viewCtrl.dismiss();
    }, (err) => {
      this.viewCtrl.dismiss();
    });
  } else {
    this.imagePicker.requestReadPermission();
    this.viewCtrl.dismiss();
  }
 }

 showCamera(options) {
  this.camera.getPicture(options).then(async (imageData) => {
    /*
    let newImage = await this.crop.crop(imageData, {
      quality: 100,
      targetHeight: 1080,
      targetWidth: 1080
    });
    */
    let newImageURL = await this.encodeImageUri(imageData);
    let data = await this.load.uploadPostImage(newImageURL);
    this.post.post_imgs = data;
  }).catch((err) => {
    this.viewCtrl.dismiss();
  })
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
   //SHOW LOADING
   this.viewCtrl.dismiss({pendingPosts: this.pendingPosts, post: this.post, numImages: this.numImages});
  }
 }
