const axios = require('axios');
const helpers = require('@turf/helpers');
const turf = require('@turf/area');

export const searchBoundaryData = async (city) => {
  return new Promise((res, rej) => {
    axios.get(`https://nominatim.openstreetmap.org/search.php`, {
      params: {
        q: `${city}+UK`,
        polygon_geojson: 1,
        format: 'jsonv2'
      }
    }).then(results => {
      return res(results.data);
    }).catch(err => {
      console.log(err);
      return rej(`Error with searching city boundaries: ${err.message}`);
    });
  });
}

export const detailsBoundaryData = async (osmtype, osmid, category, pg) => {
  return new Promise((res, rej) => {
    axios.get(`https://nominatim.openstreetmap.org/details.php`, {
      params: {
        osmtype: osmtype,
        osmid: osmid,
        class: category,
        addressdetails: 1,
        polygon_geojson: pg,
        hierarchy:0,
        group_hierarchy:1,
        format: 'json'
      }
    }).then(results => {
      return res(results.data);
    }).catch(err => {
      console.log(err);
      return rej(`Error with fetching boundary details: ${err.message}`);
    });
  });
}

const BoundaryData = async (city) => {
  let data = await searchBoundaryData(city);
  let selectedIndex = 0;
  for(let i=0; i < data.length; i++) {
    if(data[i].category == "boundary") {
      if(data[i].type == "political") {
        selectedIndex = i;
        break;
      } else if (data[i].type == "administrative") {
        selectedIndex = i;
        break;
      }
    }
  }

  if(data[selectedIndex]["geojson"]["type"] == "Polygon" || data[selectedIndex]["geojson"]["type"] == "MultiPolygon") {
    let polygon;
    if(data[selectedIndex]["geojson"]["type"] == "MultiPolygon") {
      polygon = helpers.multiPolygon(data[selectedIndex]["geojson"]["coordinates"])
    } else {
       polygon = helpers.polygon(data[selectedIndex]["geojson"]["coordinates"])
    }

    let a = turf.default(polygon);
    return { osm_id: data[selectedIndex]["osm_id"], geometry: data[selectedIndex]["geojson"], area: a, area_inaccurate: false };
  } else {
    let dn = await detailsBoundaryData("N", data[selectedIndex]["osm_id"], "place", 0);
    for(let i=0; i < dn["address"].length; i++) {
      if(dn["address"][i]["class"] == "boundary") {
        if(dn["address"][i]["type"] == "administrative") {
          selectedIndex = i;
          break;
        }
      }
    }

    let dr = await detailsBoundaryData("R", dn["address"][selectedIndex]["osm_id"], "boundary", 1);
    let polygon;
    if(dr["geometry"]["type"] == "MultiPolygon") {
      polygon = helpers.multiPolygon(dr["geometry"]["coordinates"])
    } else {
       polygon = helpers.polygon(dr["geometry"]["coordinates"])
    }
    let a = turf.default(polygon);
    return { osm_id: dr["osm_id"], geometry: dr["geometry"], area: a, area_inaccurate: true };
  }

  return null;
}
export default BoundaryData;
