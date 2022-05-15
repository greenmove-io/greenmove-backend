import { roundTwoDecimal } from './functions';

export const handlePublicRoutes = async (publicRoutes) => {
  return new Promise(async (res, rej) => {
    let routeData = {
      walking_routes_quantity: 0,
      walking_routes_length: 0,
      cycling_routes_quantity: 0,
      cycling_routes_length: 0,
    }

    for(let i = 0; i < publicRoutes.length; i++) {
      if(publicRoutes[i].tags.designation === 'public_footpath' || publicRoutes[i].tags.highway === 'path' || publicRoutes[i].tags.highway === 'track' || publicRoutes[i].tags.highway === 'bridleway')  {
        routeData.walking_routes_quantity++;
        routeData.walking_routes_length += Number(publicRoutes[i].tags.length);
      }

      if(publicRoutes[i].tags.highway === 'yes' || publicRoutes[i].tags.bicycle === 'designated') {
        routeData.cycling_routes_quantity++;
        routeData.cycling_routes_length += Number(publicRoutes[i].tags.length);
      }
    }

    routeData.walking_routes_length = roundTwoDecimal(routeData.walking_routes_length);
    routeData.cycling_routes_length = roundTwoDecimal(routeData.cycling_routes_length);


    res(routeData);
  });
}
