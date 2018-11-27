import { Component } from '@angular/core';

import { ProfilePage } from '../profile/profile';
import { ChatPage } from '../chat/chat';
import { HomePage } from '../home/home';
import { LoadProvider } from '../../providers/load/load';

@Component({
  selector: 'page-tabs',
  templateUrl: 'tabs.html'
})
export class TabsPage {

  tab1Root = HomePage;
  tab2Root = ProfilePage;
  tab3Root = ChatPage;
  selectedIndex = this.load.selectedPage;
  constructor(
    private load: LoadProvider
  ) {}

  async ionViewWillLoad() {
    await this.load.loadInitialData();
  }
}
