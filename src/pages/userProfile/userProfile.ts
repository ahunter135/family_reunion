import { Component } from '@angular/core';
import { NavController, NavParams, ModalController, ViewController } from 'ionic-angular';
import { LoadProvider } from '../../providers/load/load';
import { PostPage } from '../profile/profile';
import moment from 'moment';

/**
 * Generated class for the ProfilepagePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-user-profile',
  templateUrl: 'userProfile.html',
})
export class UserProfilePage {
  profile_segment = 'grid';
  userProfile = {
    displayName: '',
    info: '',
    photoURL: ''
  }
  numPosts = 0;
  numConnections = 0;
  user_posts = [];
  post;
  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    private load: LoadProvider,
    public modalCtrl: ModalController,
    public viewCtrl: ViewController) {
      this.userProfile.photoURL = this.navParams.get('post').photoURL;
      this.post = this.navParams.get('post');
  }

  ionViewWillLoad = async () => {
    this.userProfile = await this.load.getUser(this.post);
    let data = await this.load.getUserPostsAndConnections(this.userProfile);
    this.numConnections = data.connections;
    this.user_posts = await data.posts.sort(function (a, b) {
      return moment.utc(b.timestamp).diff(moment.utc(a.timestamp));
    })
    
    this.numPosts = data.posts.length;
  }

  showPostModal = (post) => {
    console.log(post);
    let postModal = this.modalCtrl.create(PostPage, {post: post});
    postModal.present();
  }

}
