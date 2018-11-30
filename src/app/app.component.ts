import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { FCM } from '@ionic-native/fcm';
import firebase from 'firebase';
import { TabsPage } from '../pages/tabs/tabs';
import { Storage } from '@ionic/storage';
import { LoadProvider } from '../providers/load/load';
import { AdMobFree } from '@ionic-native/admob-free';
import { InAppPurchase } from '@ionic-native/in-app-purchase';
import { ScreenOrientation } from '@ionic-native/screen-orientation';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage:any = TabsPage;

  constructor(
    platform: Platform,
    statusBar: StatusBar,
    splashScreen: SplashScreen,
    private storage: Storage,
    public load: LoadProvider,
    fcm: FCM,
    private admob: AdMobFree,
    private iap: InAppPurchase,
    private screenOrientation: ScreenOrientation
  ) {
    platform.ready().then(async () => {
      let self = this;
      this.storage.remove('home-posts');
      this.load.products = await this.iap.getProducts(['com.austinhunter.remove_ads']).catch(error => console.log(error));
      this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT_PRIMARY);
      fcm.getToken().then(token => {
        self.load.token = token;
      });
      fcm.onNotification().subscribe(data => {
        if(data.wasTapped){
          console.log("Received in background");
        } else {
          console.log("Received in foreground");
        };
      });
      
      fcm.onTokenRefresh().subscribe(token => {
        self.load.token = token;
      });
      statusBar.styleDefault();

      splashScreen.hide();
    });
  }
}
