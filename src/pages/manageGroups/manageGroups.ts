import { Component } from '@angular/core';
import { ViewController, NavParams, ModalController } from 'ionic-angular';
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
      public file: File
     ) {}
  
     ionViewWillLoad = async () => {
      this.group = this.navParams.get('group');
     }

     selectAvatar = () => {
      const options: CameraOptions = {
        quality: 100,
        destinationType: this.camera.DestinationType.FILE_URI,
        sourceType: 1,
        encodingType: this.camera.EncodingType.JPEG,
        mediaType: this.camera.MediaType.PICTURE,
        cameraDirection: 0,
        correctOrientation: false,
        targetHeight: 1080,
        targetWidth: 1080
      };
      let pickerOptions = {
        maximumImagesCount: 1,
        width: 1080,
        height: 1080,
        quality: 100
      };
      this.imagePicker.getPictures(pickerOptions).then(async (results) => {
        let newImage = await this.crop.crop(results[0], {
          quality: 100,
          targetHeight: 1080,
          targetWidth: 1080
        });
        let newImageURL = await this.encodeImageUri(newImage);
        let data = await this.load.uploadImage(newImageURL);
        this.group.data.photoURL = data;
      });
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
      this.load.updateGroupData(this.group)
    }

    showProfile = (user) => {
      if (user.uid !== this.load.user.uid) {
       let userProfileModal = this.modalCtrl.create(UserProfilePage, {post: user});
       userProfileModal.present();
      }
    }
    
  }