import * as d3 from 'd3';
import { FastaParser } from './fasta_parser.js';

d3.text('data.fasta').then((text) => {
  run(text);
});

function run(text) {
  const parser = new FastaParser();
  const inData = parser.parse(text);

  const data = transformData(inData);

  console.log(data);
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
