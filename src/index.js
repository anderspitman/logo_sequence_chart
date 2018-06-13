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
  
  const container = d3.select('#root')
  const dim = container.node().getBoundingClientRect()

  const svg = container.append('svg')
    .attr('width', dim.width)
    .attr('height', dim.height)

  const barWidth = dim.width / data.length;

  const bases = svg.selectAll('.bar')
    .data(data)
    .enter()
    .append('g')
      .attr('class', 'bar')
      .attr('transform', (d, i) => {
        return svgTranslateString(i * barWidth, 0)
      })
    .selectAll('.base')
    .data((d) => d)
    .enter()
    .append('g')
      .attr('class', 'base')
      .attr('transform', (d) => {
        const offset =
          dim.height - (d.offset * dim.height);
        return svgTranslateString(0, offset);
      })

  bases.call(createLetters, barWidth, dim);
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
  selection
    .append('svg')
      .attr('viewBox', "0 0 100 100")
      .attr('width', (d) => barWidth)
      .attr('height', (d) => d.ratio * dim.height)
      .attr('preserveAspectRatio', 'none')
      .attr('y', (d) => -(d.ratio * dim.height))
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
