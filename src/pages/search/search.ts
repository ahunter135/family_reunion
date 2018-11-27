import { Component } from '@angular/core';
import { NavController, NavParams, ModalController, ViewController } from 'ionic-angular';
import firebase from 'firebase';
import { LoadProvider } from '../../providers/load/load';

@Component({
  selector: 'page-search',
  templateUrl: 'search.html',
})
export class SearchPage {
  search_data = [];
  connected = false;
  connectionKey;
  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams, 
    public modalCtrl: ModalController,
    public load: LoadProvider,
    public viewCtrl: ViewController
    ) {
  }

  // Get search items from input with your API
  getItems = async (ev: any) => {
    
    this.search_data = [];

    // set val to the value of the searchbar
    const val = ev.target.value;

    // if the value is an empty string don't filter the items
    if (val && val.trim() != '') {
      let profiles = await this.load.db.collection('user-profiles').doc(val).get();
      let response = await this.load.isConnected(this.load.user.uid);
      response.forEach(value => {
        if (value.data().uid === profiles.data().data.uid) {
          this.connectionKey = value.id;
          this.connected = true;
          return;
        }
      })
      if (profiles.data().data.uid !== this.load.user.uid) this.search_data.push(profiles.data().data);
    }
  }

  addAsConnection = async (user) => {
    this.load.addUserAsConnection(user);
    this.viewCtrl.dismiss();
  }

  removeConnection = async (user) => {
    this.load.removeConnection(this.connectionKey, user);
    this.viewCtrl.dismiss();
  }
}
