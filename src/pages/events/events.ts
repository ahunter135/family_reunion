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
  events = [];
  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public modalCtrl: ModalController,
    public load: LoadProvider
    ) {
  }

  changeGroup = () => {
    this.loadEvents();
  }

  createEvent = () => {
    if (this.load.user_data.displayName !== '' && this.load.user_data.photoURL !== '') {
      let createEventModal = this.modalCtrl.create(CreateEvent);
      createEventModal.present();
      createEventModal.onDidDismiss(data => {
        if (data) {
          this.loadEvents();
        }
      })
    } else {
      alert("Please setup your profile first");
    }
  }

  loadEvents = async () => {
    if (this.activeGroup !== null) {
      let events = await this.load.getGroupEvents(this.activeGroup);
      events.forEach(doc => {
        doc.start = moment(doc.start, "hh:mm").format("hh:mm a");
        if (doc.end) {
          doc.end = moment(doc.end, "hh:mm").format("hh:mm a");
        }
        doc.date = moment(doc.date, "YYYY-MM-DD").format("ddd MMM DD YY");
      })
      this.events = events;
    }
  }

  showEvent = (event) => {
    let eventModal = this.modalCtrl.create(EventPage, {event: event});
    eventModal.present();
  }

  refresh = async (ev) => {
    await this.loadEvents();
    ev.complete();
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
    date: null,
    start: null,
    end: null,
    createdAt: moment().format(),
    group: null,
    creator: this.load.user_data
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

  submit = () => {
    if (this.event.title !== '' && this.event.description !== '' && this.event.date !== null && this.event.start !== null && this.activeGroup !== null) {
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
      this.viewCtrl.dismiss(true);
    } else {
      alert("Please fill in all the required fields");
    }
    
  }

}

@Component({
  selector: 'page-event',
  templateUrl: 'eventPage.html'
})
export class EventPage {
  event;
  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public load: LoadProvider,
    public viewCtrl: ViewController
    ) {
      this.event = navParams.get('event');
    }
}
