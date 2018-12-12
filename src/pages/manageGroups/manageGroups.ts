import { Component } from '@angular/core';
import { ViewController, NavParams, ModalController, ActionSheetController } from 'ionic-angular';
import { LoadProvider } from '../../providers/load/load';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { ImagePicker } from '@ionic-native/image-picker';
import { Crop } from '@ionic-native/crop';
import { File } from '@ionic-native/file';
import { UserProfilePage } from '../userProfile/userProfile';

@Component({
    selector: 'page-manage-groups',
    templateUrl: 'manageGroups.html'
  })
  export class ManageGroupPage {
  
    constructor(
      public viewCtrl: ViewController,
      public navParams: NavParams,
      public load: LoadProvider,
      public modalCtrl: ModalController
     ) {}
  
     ionViewWillLoad = async () => {
  
     }
  
     manageGroup = (group) => {
       let groupModal = this.modalCtrl.create(GroupPage, {group: group});
       groupModal.present();
     }
    
  }

  @Component({
    selector: 'page-group',
    templateUrl: 'group.html'
  })
  export class GroupPage {
    group;
    constructor(
      public viewCtrl: ViewController,
      public navParams: NavParams,
      public load: LoadProvider,
      public modalCtrl: ModalController,
      public camera: Camera,
      public imagePicker: ImagePicker,
      public crop: Crop,
      public file: File,
      public actionSheetCtrl: ActionSheetController
     ) {}
  
     ionViewWillLoad = async () => {
      this.group = this.navParams.get('group');
     }

     selectAvatar = () => {
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
              this.group.data.photoURL = null;
              options.sourceType = this.camera.PictureSourceType.SAVEDPHOTOALBUM;
              let imageData = await this.showCameraPhotoLibrary(options);
              let newImage = await this.crop.crop(imageData , {
                quality: 100,
                targetHeight: 1080,
                targetWidth: 1080
              });
              let newImageURL = await this.encodeImageUri(newImage);
              newImageURL = await this.load.uploadPostImage(newImageURL);
              this.group.data.photoURL = newImageURL;
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
        this.group.data.photoURL = null;
        let newImageURL = await this.encodeImageUri(imageData);
        newImageURL = await this.load.uploadPostImage(newImageURL);
        this.group.data.photoURL = newImageURL;  
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

    encodeImageUri = async (filePath) => {
      let fileName = filePath.split('/').pop();
      let path = filePath.substring(0, filePath.lastIndexOf("/") + 1);
      fileName = fileName.split('?');
  
      let base64string = await this.file.readAsDataURL(path, fileName[0]);
      base64string = base64string.split(',').pop();
  
      return base64string;
    }

    leaveGroup = () => {
      this.load.leaveGroup(this.group);
    }

    save = () => {
      console.log(this.group);
      this.load.updateGroupData(this.group);
      this.viewCtrl.dismiss();
    }

    showProfile = (user) => {
      if (user.uid !== this.load.user.uid) {
       let userProfileModal = this.modalCtrl.create(UserProfilePage, {post: user});
       userProfileModal.present();
      }
    }
    
  }