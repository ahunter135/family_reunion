import { Component } from '@angular/core';
import { NavController, NavParams, ViewController, LoadingController, ActionSheetController } from 'ionic-angular';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { File } from '@ionic-native/file';
import { LoadProvider } from '../../providers/load/load';
import { Crop } from '@ionic-native/crop';
import { ImagePicker } from '@ionic-native/image-picker';

@Component({
  selector: 'page-edit-profile',
  templateUrl: 'edit-profile.html',
})
export class EditProfile {

  displayName: string;
  photoURL = this.load.user.photoURL;
  
  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams, 
    public viewCtrl: ViewController,
    public loadingCtrl: LoadingController,
    private camera: Camera, 
    private file: File,
    private load: LoadProvider,
    public crop: Crop,
    public actionSheetCtrl: ActionSheetController,
    public imagePicker: ImagePicker
  ) {}

  selectAvatar() {
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
            this.photoURL = null;
            options.sourceType = this.camera.PictureSourceType.SAVEDPHOTOALBUM;
            let imageData = await this.showCameraPhotoLibrary(options);
            let newImage = await this.crop.crop(imageData , {
              quality: 100,
              targetHeight: 1080,
              targetWidth: 1080
            });
            let newImageURL = await this.encodeImageUri(newImage);
            newImageURL = await this.load.uploadPostImage(newImageURL);
            this.photoURL = newImageURL;
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
      this.photoURL = null;
      let newImageURL = await this.encodeImageUri(imageData);
      newImageURL = await this.load.uploadPostImage(newImageURL);
      this.photoURL = newImageURL;  
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

  async encodeImageUri(filePath) {
    let fileName = filePath.split('/').pop();
    let path = filePath.substring(0, filePath.lastIndexOf("/") + 1);
    fileName = fileName.split('?');

    let base64string = await this.file.readAsDataURL(path, fileName[0]);
    base64string = base64string.split(',').pop();

    return base64string;
  };

  async saveProfile() {
    this.load.user_data.displayName = this.displayName.toLowerCase();
    this.load.user_data.photoURL = this.photoURL;
    this.load.user_data.token = this.load.token;
    this.load.user_data.uid = this.load.user.uid;
    this.load.updateUserProfileInfo(this.displayName.toLowerCase(), this.photoURL);
    this.dismiss();
  }

  dismiss() {
   this.viewCtrl.dismiss();
  }

}
