import { Pipe, PipeTransform } from '@angular/core';
import moment from 'moment';

/**
 * Generated class for the SortPostsPipe pipe.
 *
 * See https://angular.io/api/core/Pipe for more info on Angular Pipes.
 */
@Pipe({
  name: 'sortPosts',
})
export class SortPostsPipe implements PipeTransform {
  /**
   * Takes a value and makes it lowercase.
   */
  transform(value) {
    console.log(value);
    if (value.length > 0) {
      let index = value.length - 1;
      if (value[0].data || value[index].data) {
        if (value[0].data.postedAt < value[index].data.postedAt) return value.reverse();
      }
      else return value;
    }
  }
}
