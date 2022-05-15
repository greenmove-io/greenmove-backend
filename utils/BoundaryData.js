const axios = require('axios');
const turfHelpers = require('@turf/helpers');
const turfArea = require('@turf/area');

const {
  NOMINATIM_API_URL
} = require('../config');

export const searchBoundaryData = async (city) => {
  return new Promise((res, rej) => {
    axios.get(`${NOMINATIM_API_URL}/search.php`, {
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
    axios.get(`${NOMINATIM_API_URL}/details.php`, {
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

export const handleGreenspacePolygons = async (polygons) => {
  return new Promise(async (res, rej) => {
    let totalArea = 0;
    let parkTotalArea = 0;
    let parkCount = 0;

    polygons.map(p => {
      if(p.geometry.length > 4) {
        let geo = p['geometry'].map(obj => [obj.lat, obj.lon]);
        if(geo[0][0] !== geo[geo.length - 1][0] || geo[0][1] !== geo[geo.length - 1][1]) {
          let c = geo[0];
          geo.push(c)
        }

        let polygon = turfHelpers.polygon([geo]);
        let a = turfArea.default(polygon);
        totalArea += a;

        if(p.tags.leisure !== undefined) {
          if(p.tags.leisure == 'park')  {
            parkTotalArea += a;
            parkCount++;
          }
        }
      }
    });

    parkTotalArea = Math.round(parkTotalArea);

    res({ greenspace_area: totalArea, park_quantity: parkCount, park_area: parkTotalArea });
  });
}

const BoundaryData = async (city) => {
  let data = await searchBoundaryData(city);
  let selectedIndex = 0;
  for(let i=0; i < data.length; i++) {
    if(data[i].category == "boundary") {
      if(data[i].type == "political" || data[i].type == "administrative") {
        selectedIndex = i;
        break;
      }
    }
  }

  if(data[selectedIndex]["geojson"]["type"] == "Polygon" || data[selectedIndex]["geojson"]["type"] == "MultiPolygon") {
    let polygon;
    if(data[selectedIndex]["geojson"]["type"] == "MultiPolygon") {
      polygon = turfHelpers.multiPolygon(data[selectedIndex]["geojson"]["coordinates"])
    } else {
       polygon = turfHelpers.polygon(data[selectedIndex]["geojson"]["coordinates"])
    }

    let a = Math.round(turfArea.default(polygon));
    return { osm_id: data[selectedIndex]["osm_id"], geometry: data[selectedIndex]["geojson"], area: a, area_inaccurate: false };
  } else {
    let dn = await detailsBoundaryData("N", data[selectedIndex]["osm_id"], "place", 0);
    for(let i=0; i < dn["address"].length; i++) {
      if(dn["address"][i]["class"] == "boundary") {
        if(dn["address"][i]["type"] == "administrative" || data[i].type == "county") {
          selectedIndex = i;
          break;
        }
      }
    }

    let dr = await detailsBoundaryData("R", dn["address"][selectedIndex]["osm_id"], "boundary", 1);
    let polygon;
    if(dr["geometry"]["type"] == "MultiPolygon") {
      polygon = turfHelpers.multiPolygon(dr["geometry"]["coordinates"])
    } else {
       polygon = turfHelpers.polygon(dr["geometry"]["coordinates"])
    }
    let a = Math.round(turfArea.default(polygon));
    return { osm_id: dr["osm_id"], geometry: dr["geometry"], area: a, area_inaccurate: true };
  }

  return null;
}
export default BoundaryData;
