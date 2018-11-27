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
      this.photoURL = data;
    });
    /*
    const actionSheet = this.actionSheetCtrl.create({
      title: 'Image Source',
      buttons: [
        {
          text: 'Photo Library',
          handler: () => {
            let options = {
              maximumImagesCount: 1,
              width: 1080,
              height: 1080,
              quality: 100
            };
            this.imagePicker.getPictures(options).then(async (results) => {
              let newImage = await this.crop.crop(results[0], {
                quality: 100,
                targetHeight: 1080,
                targetWidth: 1080
              });
              let newImageURL = await this.encodeImageUri(newImage);
              let data = await this.load.uploadImage(newImageURL);
              this.photoURL = data;
            }, (err) => { });
          }
        },
        {
          text: 'Camera',
          handler: () => {
            this.showCamera(options);
          }
        }
      ]
    });
    actionSheet.present();
    */
  }

  showCamera(options) {
    this.camera.getPicture(options).then(async (imageData) => {
      let newImageURL = await this.encodeImageUri(imageData);
      let data = await this.load.uploadImage(newImageURL);
      this.photoURL = data;
    }).catch((err) => {
      console.log(err);
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
