import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { FCM } from '@ionic-native/fcm';
import { TabsPage } from '../pages/tabs/tabs';
import { LoadProvider } from '../providers/load/load';
import { InAppPurchase } from '@ionic-native/in-app-purchase';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { BackgroundMode } from '@ionic-native/background-mode';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage:any = TabsPage;

  constructor(
    platform: Platform,
    statusBar: StatusBar,
    splashScreen: SplashScreen,
    public load: LoadProvider,
    fcm: FCM,
    private iap: InAppPurchase,
    private screenOrientation: ScreenOrientation,
    private backgroundMode: BackgroundMode
  ) {
    platform.ready().then(async () => {
      if (!this.backgroundMode.isEnabled()) this.backgroundMode.enable();

      let self = this;

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
