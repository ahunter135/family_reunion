import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';

import { MyApp } from './app.component';

import { ProfilePage, PopoverPage, PostPage, ConnectionPage, SettingsPage } from '../pages/profile/profile';
import { ChatPage } from '../pages/chat/chat';
import { HomePage, AddPostPage } from '../pages/home/home';
import { TabsPage } from '../pages/tabs/tabs';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { IonicStorageModule } from '@ionic/storage';
import { Camera } from '@ionic-native/camera';
import { File } from '@ionic-native/file';
import { Crop } from '@ionic-native/crop';
import { Clipboard } from '@ionic-native/clipboard';
import { SocialSharing } from '@ionic-native/social-sharing';

import { LoadProvider, LoginPage, SignUpPage } from '../providers/load/load';

import firebase from 'firebase';
import { EditProfile } from '../pages/edit-profile/edit-profile';
import { FCM } from '@ionic-native/fcm';
import { ImagePicker } from '@ionic-native/image-picker';
import { SearchPage } from '../pages/search/search';
import { Toast } from '@ionic-native/toast';
import { PipesModule } from '../pipes/pipes.module';
import { LongPressModule } from 'ionic-long-press';
import { AdMobFree } from '@ionic-native/admob-free';
import { InAppPurchase } from '@ionic-native/in-app-purchase';

firebase.initializeApp({
  apiKey: "AIzaSyBPNa8q-OzZnjJIpdmyefFJ_HXSmmP3Rqo",
  authDomain: "family-reunion-15435.firebaseapp.com",
  databaseURL: "https://family-reunion-15435.firebaseio.com",
  projectId: "family-reunion-15435",
  storageBucket: "family-reunion-15435.appspot.com",
  messagingSenderId: "174075668194"
});

@NgModule({
  declarations: [
    MyApp,
    ProfilePage,
    ChatPage,
    HomePage,
    TabsPage,
    LoginPage,
    SignUpPage,
    EditProfile,
    AddPostPage,
    SearchPage,
    PopoverPage,
    PostPage,
    ConnectionPage,
    SettingsPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot(),
    PipesModule,
    LongPressModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    ProfilePage,
    ChatPage,
    HomePage,
    TabsPage,
    LoginPage,
    SignUpPage,
    EditProfile,
    AddPostPage,
    SearchPage,
    PopoverPage,
    PostPage,
    ConnectionPage,
    SettingsPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    LoadProvider,
    Camera,
    File,
    Crop,
    FCM,
    ImagePicker,
    Clipboard,
    SocialSharing,
    Toast,
    AdMobFree,
    InAppPurchase
  ]
})
export class AppModule {}
