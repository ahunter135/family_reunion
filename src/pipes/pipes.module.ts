import { NgModule } from '@angular/core';
import { SortPostsPipe } from './sortposts/sortposts';
import { SortPipe } from './sort/sort';

@NgModule({
	declarations: [SortPostsPipe, SortPipe],
	imports: [],
	exports: [SortPostsPipe, SortPipe]
})
export class PipesModule {}
