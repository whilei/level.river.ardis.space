// Load jQuery from NPM
import $ from 'jquery';
import * as d3 from 'd3';
import LineChart from './linechart';

window.jQuery = $;
window.$ = $;

console.log('hello from console world');

const today = new Date();

// query params of site allow for dynamic query and display using arbitrary start and end dates
const params = new URL(window.location.href).searchParams;
const beginDateStr = params.get('begin_date') || '1980-01-01';
const endDateStr = params.get('end_date') || `${today.getUTCFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${(today.getDate()).toString().padStart(2, '0')}`;

const beginDateDate = new Date(beginDateStr);
const endDateDate = new Date(endDateStr);

$('#begin-date').html(`${beginDateStr}`);
$('#end-date').html(`${endDateStr}`);

const dataOrigin = `https://waterdata.usgs.gov/nwis/dv?cb_62614=on&format=rdb&site_no=12436000&referred_module=sw&period=&begin_date=${beginDateStr}&end_date=${endDateStr}`;

function displayError(err) {
  $('#error-container').html(err.toString()).show();
}

function myColorizer(z) {
  const zN = +z;
  if (zN === today.getUTCFullYear()) return 'red';

  const interpolator = d3.scaleLinear()
    .domain([beginDateDate.getUTCFullYear() - 2, endDateDate.getUTCFullYear()]);

  return d3.interpolateBlues(interpolator(zN));
}

fetch(dataOrigin)
  .then((res) => {
    res.text()
      .then((txt) => {
        // split line delimited
        const data = txt.toString().split(/(?:\r\n|\r|\n)/g);

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

        // format data for d3
        for (let i = 0; i < data.length; i++) {
          const delimited = data[i].split(/\s/g);
          const level = delimited[3];
          if (typeof level === 'undefined' || level.isNaN || level <= 0) {
            data.splice(i, 1);
            continue;
          }

          const d = new Date(delimited[2]);
          const measurementYear = d.getUTCFullYear();
          d.setUTCFullYear(today.getUTCFullYear()); // reset the original date's year to current

          data[i] = {
            date: d,
            level: +level,
            measurementYear: `${measurementYear}`,
          };
        }

        const chart = LineChart(data, {
          x: (d) => d.date,
          y: (d) => d.level,
          z: (d) => d.measurementYear,
          yLabel: '↑ Water Level (ft)',
          width: window.innerWidth,
          height: window.innerHeight * 3 / 4,
          color: myColorizer,
        });

        $('#mydata').html(chart);
      })
      .catch(displayError);
  })
  .catch(displayError);
