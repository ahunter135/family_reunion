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
        doc.data.start = moment(doc.data.start, "hh:mm").format("hh:mm a");
        if (doc.data.end) {
          doc.data.end = moment(doc.data.end, "hh:mm").format("hh:mm a");
        }
        doc.data.date = moment(doc.data.date, "YYYY-MM-DD").format("ddd MMM DD YY");
      });
      console.log(events);
      this.events = events;
    }
  }

  editEvent = (event) => {
    let editEventModal = this.modalCtrl.create(EditEvent, {event: event});
    editEventModal.present();
  }

  showEvent = (event) => {
    let eventModal = this.modalCtrl.create(EventPage, {event: event});
    eventModal.present();
    eventModal.onDidDismiss(data => {
      if (data) {
        this.loadEvents();
      }
    })
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
  activeGroup;
  attenders = [];
  found = false;
  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public load: LoadProvider,
    public viewCtrl: ViewController
    ) {
      this.event = navParams.get('event');
    }

    ionViewWillLoad = async () => {
      this.loadMembers();
    }

    loadMembers = async () => {
      let members = await this.load.getAttenders(this.event);
      console.log(this.attenders);
      members.forEach(doc => {
        let member = {
          data: doc.data(),
          key: doc.id
        };
        if (doc.data().uid === this.load.user_data.uid) this.found = true;
        this.attenders.push(member);
      })
    }

    interested = () => {
      if (!this.found) {
        this.load.isInterested(this.event);
        this.loadMembers();
      }
    }

    delete = () => {
      this.load.deleteEvent(this.event);
      this.viewCtrl.dismiss(true);
    }
}

@Component({
  selector: 'page-event',
  templateUrl: 'editEvent.html'
})
export class EditEvent {
  event;
  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public load: LoadProvider,
    public viewCtrl: ViewController
    ) {
      this.event = navParams.get('event');
      this.event.start = moment(this.event.start);
      this.event.end = moment(this.event.end);
      this.event.date = moment(this.event.date);
      console.log(this.event);
    }
}
