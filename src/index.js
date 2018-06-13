import * as d3 from 'd3';
import { FastaParser } from './fasta_parser.js';

const colorMap = {
  'A': '#1fca23',
  'C': '#061ac8',
  'G': '#feb22b',
  'T': '#c90813',
};

//d3.text('data.fasta').then((text) => {
d3.text('sequenc_logo_data.fasta').then((text) => {
  run(text);
});

function run(text) {
  const parser = new FastaParser();
  const inData = parser.parse(text);

  const data = transformData(inData);

  console.log(data);

  doVis(data);
}

function doVis(data) {
  
  const root = d3.select('#root')
  const dim = root.node().getBoundingClientRect()

  const svg = root.append('svg')
    .attr('width', dim.width)
    .attr('height', dim.height)

  const sidePadding = 25;
  const bottomPadding = 45;
  const width = dim.width - (sidePadding * 2);
  //const width = dim.width;
  const height = dim.height;

  // add 5' and 3' text
  svg
    .append('text')
      .text("5'")
      .attr('x', 5)
      .attr('y', dim.height)
      .attr('font-size', 22)
      .attr('font-weight', 'bold')
      .attr('font-family', 'arial')

  svg
    .append('text')
      .text("3'")
      .attr('x', dim.width - 25)
      .attr('y', dim.height)
      .attr('font-size', 22)
      .attr('font-weight', 'bold')
      .attr('font-family', 'arial')

  const container = svg
    .append('g')
      .attr('class', 'container')
      .attr('transform', svgTranslateString(sidePadding, 0))

  const barWidth = width / data.length;
  const barHeight = height - bottomPadding;

  const columns = container.selectAll('.column')
    .data(data)
    .enter()
    .append('g')
      .attr('class', 'column')
      .attr('transform', (d, i) => {
        return svgTranslateString(i * barWidth, 0)
      })

  // add locus number text element
  const locusOffset = 25;
  columns
    .append('g')
    .attr('transform',
      svgTranslateString(barWidth / 2, height - locusOffset) +
        ' rotate(-90)')
    .append('text')
    .text((d, i) => i + 1)
    .attr('text-anchor', 'middle')
    .attr('font-size', 22)
    .attr('font-weight', 'bold')
    .attr('font-family', 'arial')
    .attr('y', 8)

  const bases = columns
    .selectAll('.base')
    .data((d) => d)
    .enter()
    .append('g')
      .attr('class', 'base')
      .attr('transform', (d) => {
        const offset =
          barHeight - (d.offset * barHeight);
        return svgTranslateString(0, offset);
      })

  const baseDim = { width, height: barHeight };

  bases.call(createLetters, barWidth, baseDim);
}

function createLetters(selection, barWidth, dim) {

  selection.each(function(datum) {
    const elem = d3.select(this);

    switch (datum.base) {

      case 'A':
        appendA(elem, barWidth, dim);
        break;
      case 'C':
        appendC(elem, barWidth, dim);
        break;
      case 'G':
        appendG(elem, barWidth, dim);
        break;
      case 'T':
        appendT(elem, barWidth, dim);
        break;
    }
  });
}

function appendLetter(selection, path, barWidth, dim) {

  const height = dim.height;

  selection
    .append('svg')
      .attr('viewBox', "0 0 100 100")
      .attr('width', (d) => barWidth)
      .attr('height', (d) => d.ratio * height)
      .attr('preserveAspectRatio', 'none')
      .attr('y', (d) => -(d.ratio * height))
    .append('path')
      .attr('d', path)
      .attr('fill', 'transparent')
      .attr('stroke', (d) => colorMap[d.base])
      .attr('stroke-width', 20)
}

function appendA(selection, barWidth, dim) {
  appendLetter(selection,
    'M10 110 L50 -5 L90 110 M25 75 L 75 75', barWidth, dim);
}

function appendC(selection, barWidth, dim) {
  appendLetter(selection,
    'M100 10 L10 10 L10 90 L100 90',
    barWidth, dim);
}

function appendG(selection, barWidth, dim) {
  appendLetter(selection,
    'M100 10 L10 10 L10 90 L90 90 L90 60 L60 60',
    barWidth, dim);
}

function appendT(selection, barWidth, dim) {
  appendLetter(selection,
    'M0 0 L100 0 M50 0 L 50 100', barWidth, dim);
}

function svgTranslateString(x, y) {
  return "translate(" + x + ", " + y + ")";
}

function transformData(inData) {

  const loci = [];

  for (let i = 0; i < inData.length; i++) {
    
    const record = inData[i];

    for (let j = 0; j < record.sequence.length; j++) {

      const base = record.sequence[j];

      if (loci[j] === undefined) {
        loci[j] = {
          counts: {},
          total: 0,
        };
      }

      const locus = loci[j];

      if (locus.counts[base] === undefined) {
        locus.counts[base] = 0;
      }

      locus.counts[base]++;
      locus.total++;
    }
  }

  const outLoci = [];
  for (let locus of loci) {
    const ratios = calculateRatios(locus);
    outLoci.push(ratios);
  }

  return outLoci;
}

function calculateRatios(locus) {

  const ratios = [];
  for (let base in locus.counts) {
    const count = locus.counts[base];
    const ratio = count / locus.total;
    ratios.push({
      base,
      ratio,
    });
  }
  
  // sort lexicographically by base
  ratios.sort((a, b) => {
    if (a.base < b.base) {
      return -1;
    }
    else if (a.base > b.base) {
      return 1;
    }
    else {
      return 0;
    }
  });

  // calculate display offsets
  let offset = 0;
  for (let ratio of ratios) {
    ratio.offset = offset;
    offset += ratio.ratio;
  }

  return ratios;
}
