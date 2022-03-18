const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');

const ProcessNPTA = () => {
  const keep = ['ATCOCode', 'NaptanCode', 'NptgLocalityCode', 'LocalityName', 'Easting', 'Northing', 'Longitude', 'Latitude', 'AdministrativeAreaCode'];
  let KEPTDATA = [];

  console.log('Processing data...');
  csv.parseFile(path.resolve(__dirname, '../assets/hidden', 'NPTA.csv'), { headers: true, ignoreEmpty: true })
    .on('data', row => {
      // process.stdout.write(`\x1Bc\rATCO Code: ${row.ATCOCode}`);
      // console.log(row.ATCOCode);
      let acshort = row['ATCOCode'].slice(0, 3);
      let ACFound = KEPTDATA.find(e => e['ATCOCode'] === acshort);
      if(ACFound === undefined) {
        let data = {};
        data['ATCOCode'] = acshort;
        for(let i=1; i<keep.length;i++) {
          data[keep[i]] = row[keep[i]];
        }
        KEPTDATA.push(data);
      }
      // row.atcocode
    })
    .on('error', err => console.error(err))
    .on('end', rowCount => {
        console.log('Parsed: ', rowCount);
        // console.log(KEPTDATA);
        fs.writeFileSync(path.resolve(__dirname, '../assets/hidden', 'NPTA.json'), JSON.stringify(KEPTDATA, null, 2), 'utf-8');
    });
}
export default ProcessNPTA;
