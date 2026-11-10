import catalogue from './dubai-restaurants.json';
import type { Restaurant } from '@/types/api';

export const restaurantFixtures: Restaurant[] = Object.entries(catalogue).flatMap(([area, location], areaIndex) =>
  location.restaurants.map((entry, restaurantIndex) => {
    const index = areaIndex * 4 + restaurantIndex + 1;
    const priceBeforePerPerson = entry.price * 1.25;
    return {
      id: `demo-dubai-${index}`,
      name: `Demo · ${entry.name}`,
      cuisine: entry.cuisine,
      categories: [entry.cuisine],
      description: 'Fictional restaurant for booking and matching tests.',
      formattedAddress: `${area}, Dubai, United Arab Emirates`,
      latitude: location.latitude + (restaurantIndex - 1.5) * 0.003,
      longitude: location.longitude + (restaurantIndex - 1.5) * 0.002,
      googleMapsUri: null,
      tags: entry.tags,
      menus: [2, 3, 4, 5, 6].map((partySize) => ({
        id: (100 + index) * 10 + partySize,
        partySize,
        discountPercentage: 20,
        priceBeforePerPerson,
        priceAfterPerPerson: entry.price,
        sections: {
          STARTERS: [{ name: 'Market vegetable starter', description: 'Shared starter for the table' }],
          MAINS: [{ name: `${entry.cuisine} chef’s selection`, description: 'Example set-menu main' }],
          DESSERTS: [{ name: 'Seasonal fruit', description: 'One serving per person' }],
          DRINKS: [{ name: 'Sparkling citrus water', description: 'One glass per person' }],
        },
      })),
    };
  }),
);
