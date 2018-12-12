import { Component } from '@angular/core';
import { NavController, NavParams, ModalController, ViewController, ToastController } from 'ionic-angular';
import moment from 'moment';
import { DatePicker } from '@ionic-native/date-picker';
import { LoadProvider } from '../../providers/load/load';

/**
 * Generated class for the EventsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-events',
  templateUrl: 'events.html',
})
export class EventsPage {
  activeGroup = null;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public modalCtrl: ModalController,
    public load: LoadProvider
    ) {
  }

  createEvent = () => {
    let createEventModal = this.modalCtrl.create(CreateEvent);
    createEventModal.present();
  }

}

@Component({
  selector: 'page-events',
  templateUrl: 'createEvent.html',
})
export class CreateEvent {
  activeGroup = null;
  event = {
    title: '',
    description: '',
    date: moment().format("DDD MMM D, YYYY"),
    start: null,
    end: null,
    createdAt: moment().format(),
    group: null
  }
  today = moment().get('year');
  limit = moment().get('year') + 10;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public modalCtrl: ModalController,
    public datePicker: DatePicker,
    public load: LoadProvider,
    public viewCtrl: ViewController,
    public toast: ToastController
    ) {
  }

  ionViewDidLoad = () => {

  }

  submit = () => {
    this.event.group = {
      key: this.activeGroup.key,
      code: this.activeGroup.data.group_code,
      name: this.activeGroup.data.group_name
    }
    this.load.addEvent(this.event);
    let toast = this.toast.create({
      message: 'Event Created',
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
    this.viewCtrl.dismiss();
  }

}
