export class FastaParser {

  parse(text) {
    const lines = text.split('\n');

    let currentId = '';

    const records = [];

    for (let line of lines) {

      if (line.length === 0) {
        continue;
      }

      if (line.startsWith('>')) {
        currentId = line.slice(1);
        continue;
      }

      const record = {
        id: currentId,
        sequence: line,
      };

      records.push(record);
    }

    return records;
  }
}
