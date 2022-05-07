import { roundTwoDecimal } from './functions';

export const handlePublicRoutes = async (publicRoutes) => {
  return new Promise(async (res, rej) => {
    let routeData = {
      walking_routes_quantity: 0,
      walking_routes_length: 0,
      cycling_routes_quantity: 0,
      cycling_routes_length: 0,
    }

    publicRoutes.map((route) => {
      if(route.tags.designation === 'public_footpath' || route.tags.highway === 'path' || route.tags.highway === 'track' || route.tags.highway === 'bridleway')  {
        routeData.walking_routes_quantity++;
        routeData.walking_routes_length += Number(route.tags.length);
      }

      if(route.tags.highway === 'yes' || route.tags.bicycle === 'designated') {
        routeData.cycling_routes_quantity++;
        routeData.cycling_routes_length += Number(route.tags.length);
      }
    });

    routeData.walking_routes_length = roundTwoDecimal(routeData.walking_routes_length);
    routeData.cycling_routes_length = roundTwoDecimal(routeData.cycling_routes_length);


    res(routeData);
  });
}
