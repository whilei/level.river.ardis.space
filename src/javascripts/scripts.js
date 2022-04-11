// Load jQuery from NPM
import $ from 'jquery';

window.jQuery = $;
window.$ = $;

console.log('hello from console world');

$('h1').first().html('heeeelloooo worlllddd');

fetch('https://waterdata.usgs.gov/nwis/dv?cb_62614=on&format=rdb&site_no=12436000&referred_module=sw&period=&begin_date=1980-04-10&end_date=2022-04-10')
  .then((res) => {
    console.log('ok response from data source', res);
    res.text()
    .then((txt) => {
      console.log('data is text', txt);
      let data = txt.toString().split(/(?:\r\n|\r|\n)/g);
      console.log('data is', data.length, 'lines');

      // remove comments
      let lastCommentI = 0;
      for (let i = 0; i < data.length; i++) {
        if (data[i].indexOf('#') !== 0) {
          lastCommentI = i;
          break;
        }
      }
      data.splice(0, lastCommentI);

      // remove header rows
      data.splice(0, 2);

      console.log('cleaned data is', data.length, 'lines');

      let $mydata = $('#mydata');
      for (let d of data) {
        const delimited = d.split(/\s/g);
        // console.debug('d', d);
        const $p = $('<p>').html(`date: ${delimited[2]}, height: ${delimited[3]}`);
        $mydata.append($p);
      }
    })
    .catch((err) => {
      console.error('data failed to become text', err);
    });
  })
  .catch((err) => {
    console.error('failed to fetch data from source', err);
  });
