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
      let profiles = await this.load.db.collection('groups').where("group_code", "==", val.toLowerCase()).get();
      profiles.forEach(doc => {
        let group = {
          key: doc.id,
          data: doc.data()
        };
        for (let i = 0; i < group.data.members.length; i++) {
          if (this.load.user.uid === group.data.members[i].uid) {
            this.connected = true;
            break;
          } else {
            this.connected = false;
          }
        }
        this.search_data.push(group);
      })
    }
  }

  joinGroup = async (group) => {
    group.data.members.push(this.load.user_data);
    this.load.joinGroup(group);
    this.viewCtrl.dismiss();
  }

  leaveGroup = (group) => {
    for (let i = 0; i < group.data.members.length; i++) {
      if (this.load.user.uid === group.data.members[i].uid) {
        group.data.members.splice(i, 1);
        break;
      } 
    }
    this.load.leaveGroup(group);
    this.viewCtrl.dismiss();
  }
}
