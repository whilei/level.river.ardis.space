import * as d3 from 'd3';

// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/multi-line-chart
export default function LineChart(data, {
  x = ([x]) => x, // given d in data, returns the (temporal) x-value
  y = ([, y]) => y, // given d in data, returns the (quantitative) y-value
  z = () => 1, // given d in data, returns the (categorical) z-value
  title, // given d in data, returns the title text
  defined, // for gaps in data
  curve = d3.curveLinear, // method of interpolation between points
  marginTop = 20, // top margin, in pixels
  marginRight = 30, // right margin, in pixels
  marginBottom = 30, // bottom margin, in pixels
  marginLeft = 40, // left margin, in pixels
  width = 640, // outer width, in pixels
  height = 400, // outer height, in pixels
  xType = d3.scaleUtc, // type of x-scale
  xDomain, // [xmin, xmax]
  xRange = [marginLeft, width - marginRight], // [left, right]
  yType = d3.scaleLinear, // type of y-scale
  yDomain, // [ymin, ymax]
  yRange = [height - marginBottom, marginTop], // [bottom, top]
  yFormat, // a format specifier string for the y-axis
  yLabel, // a label for the y-axis
  zDomain, // array of z-values
  color = 'currentColor', // stroke color of line, as a constant or a function of *z*
  strokeLinecap, // stroke line cap of line
  strokeLinejoin, // stroke line join of line
  strokeWidth = 1.5, // stroke width of line
  strokeOpacity, // stroke opacity of line
  mixBlendMode = 'multiply', // blend mode of lines
} = {}) {
  // Compute values.
  const X = d3.map(data, x);
  const Y = d3.map(data, y);
  const Z = d3.map(data, z);
  const O = d3.map(data, (d) => d);
  if (defined === undefined) defined = (d, i) => !isNaN(X[i]) && !isNaN(Y[i]);
  const D = d3.map(data, defined);

  // Compute default domains, and unique the z-domain.
  if (xDomain === undefined) xDomain = d3.extent(X);
  if (yDomain === undefined) {
    yDomain = [
      d3.min(Y, (d) => (typeof d === 'string' ? +d : d)),
      d3.max(Y, (d) => (typeof d === 'string' ? +d : d))];
  }
  if (zDomain === undefined) zDomain = Z;
  zDomain = new d3.InternSet(zDomain);
  console.log('zDomain', zDomain, typeof zDomain);

  // Omit any data not present in the z-domain.
  const I = d3.range(X.length).filter((i) => zDomain.has(Z[i]));

  // Construct scales and axes.
  const xScale = xType(xDomain, xRange);
  const yScale = yType(yDomain, yRange);
  const xAxis = d3.axisBottom(xScale).ticks(width / 80).tickSizeOuter(0);
  const yAxis = d3.axisLeft(yScale).ticks(height / 60, yFormat);

  // Compute titles.
  const T = title === undefined ? Z : title === null ? null : d3.map(data, title);

  // Construct a line generator.
  const line = d3.line()
    .defined((i) => D[i])
    .curve(curve)
    .x((i) => xScale(X[i]))
    .y((i) => yScale(Y[i]));

  const svg = d3.create('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])
    .attr('style', 'max-width: 100%; height: auto; height: intrinsic;')
    .style('-webkit-tap-highlight-color', 'transparent')
    .on('pointerenter', pointerentered)
    .on('pointermove', pointermoved)
    .on('pointerleave', pointerleft)
    .on('touchstart', (event) => event.preventDefault());

  svg.append('g')
    .attr('transform', `translate(0,${height - marginBottom})`)
    .call(xAxis);

  svg.append('g')
    .attr('transform', `translate(${marginLeft},0)`)
    .call(yAxis)
    .call((g) => g.select('.domain').remove())
    .call((g) => g.selectAll('.tick line').clone()
      .attr('x2', width - marginLeft - marginRight)
      .attr('stroke-opacity', 0.1))
    .call((g) => g.append('text')
      .attr('x', -marginLeft)
      .attr('y', 10)
      .attr('fill', 'currentColor')
      .attr('text-anchor', 'start')
      .text(yLabel));

  // Construct scales and axes.
  const path = svg.append('g')
    .attr('fill', 'none')
    .attr('stroke', typeof color === 'string' ? color : null)
    .attr('stroke-linecap', strokeLinecap)
    .attr('stroke-linejoin', strokeLinejoin)
    .attr('stroke-width', strokeWidth)
    .attr('stroke-opacity', strokeOpacity)
    .selectAll('path')
    .data(d3.group(I, (i) => Z[i]))
    .join('path')
    .style('mix-blend-mode', mixBlendMode)
    .attr('stroke', typeof color === 'function' ? ([z]) => color(z) : null)
    .attr('d', ([, I]) => line(I));

  const dot = svg.append('g')
    .attr('display', 'none');

  dot.append('circle')
    .attr('r', 2.5);

  dot.append('text')
    .attr('font-family', 'sans-serif')
    .attr('font-size', 10)
    .attr('text-anchor', 'middle')
    .attr('y', -8);

  const focused_year = svg.append('g')
    .attr('display', 'none');

  focused_year.append('text')
    .attr('font-family', 'sans-serif')
    .attr('font-size', 16)
    .attr('font-weight', 'bold')
    .attr('text-anchor', 'middle')
    .attr('fill', 'magenta')
    .attr('y', height - 40)
    .attr('x', width - 60);

  function pointermoved(event) {
    const [xm, ym] = d3.pointer(event);
    const i = d3.least(I, (i) => Math.hypot(xScale(X[i]) - xm, yScale(Y[i]) - ym)); // closest point
    path
      .style('stroke', ([z]) => (Z[i] === z ? "magenta" : null)) // s/null/"magenta"; s/#ddd/null
      .style('stroke-width', ([z]) => (Z[i] === z ? strokeWidth * 2 : strokeWidth))
      .filter(([z]) => Z[i] === z).raise();
    dot.attr('transform', `translate(${xScale(X[i])},${yScale(Y[i])})`);
    if (T) dot.select('text').text(T[i]);
    if (T) focused_year.select('text').text(T[i]);
    svg.property('value', O[i]).dispatch('input', { bubbles: true });
  }

  function pointerentered() {
    path.style('mix-blend-mode', null).style('stroke', null);
    dot.attr('display', null);
    focused_year.attr('display', null)
  }

  function pointerleft() {
    path.style('mix-blend-mode', 'multiply').style('stroke', null); // s/#ddd/null/ // .style('stroke-width', strokeWidth);
    dot.attr('display', 'none');
    focused_year.attr('display', 'none');
    svg.node().value = null;
    svg.dispatch('input', { bubbles: true });
  }

  return Object.assign(svg.node(), { value: null });
}
