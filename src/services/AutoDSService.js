// // src/services/AutoDSService.js
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import DatabaseService from './DatabaseService';

// class AutoDSService {
//   constructor() {
//     this.baseUrl = 'https://platform-api.autods.com';
//     this.refreshToken = 'eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ.MEqHLa0D7V7RY3ILq84rQ8ierawePFFjJbddoQQPAT7mGm7-JscYeu-7E4TyHs1mYOdd3yKVErJs8G5nkMts4l9f9AwnfjeGDYE7Byv0RbpVllBwXgB6mzQyowsRH6WOe0FMSd1axn_mzeC7GpSJlqcincyWeeAFDkdydh9moFr1vdo7Wth6bl6chNqwnmy25m2PgZQT_T4Rbl7TYvsemQQKy71-7VU9kw_J1iecWUK8cl2HeW4ns6EwDmw9AgqcRbW2OY9glXP3mSe0Dx0izFNz5-94-bx_4fLuDUQlooFb1yO5HDTmhsUR9UF469ILrCjwGtbPvjvjP7Hod0SbZg.QZjtVDezMKzFnwk_.RzEkBEH0B6VzJpKG7wt1FqT7OcYVBj3bfHHd82ZaDRi17ZKYPtokPLODCy2EqqXEP9X6Zz24O4ggMItq2QAJhycqZYRkAJXYtdBmzEOzqIbWrXSYeN63u8p5_pmuBLEAMR05GcD7D8LZS52s8dY_LDsJh7N9EgeZLrxs82jTJhzRL6sIQHvFenEl0iOKC6TvNKzhMu2itPMiwcvNGeMO3-iOMZKsUeYEpxFMa0KjTulRzM2jjeYe4bXkmHyIogJ56vHg_uDGHVFZK5IhmRMrkSUL2q54-DSFhtgiyNtIfnT600P20yzp6JF2qCRdXE7J-9-xN2kDKPqx5NK_UCERxtZjn8TAGZbCn5kZvw9rdJXbBGlrdYZpZNcJtK9nz1zs1BVTk86d2vt_QrXzks08KgcwiHVCr5365Tm3nZEKRVO8wZS15NCMFQ1S8LTIfR3xreulQJ_27Os77Ex0EOUjdkdRccndGrsntu4BXQAscGt38ns74T6ksCIe-pHutYJZckEstmIPtPgJgtI2yXLOFMOAyHDC6nPzrsw-VFtfHXzIFpPOwduv1qScVrPNjclABXyOjkBM_erLpyF1phZQWXeElBtv7b6a-tupwNIZBK5dLDvFTwGdmEbnUM5d-OAJhx6VvDVDLavju2nJJoJJRsYH_yXwWtK9XFXAPLZ9O8ekv1omabI2GVxkd0TsFlFB83yvg-8bFT96K9ZOZecZaJhbTd0oEey-en5UGu5DaDGJ6Hw8SeQp_0PEFBnwfbNy1O3velp1l325kCGixplZUkPrci-O_fzDj3AUZtHeyJKOiv9XM6Rt9LTO9KUWCetW8OhFAOl8NuKAfT8jSiR4KxtQwmcmwy-__6Cp1zEBTVZj6qKrkFz_uPL6-xfLbmn6k91NQcuuxcEeM_olhzg01-ApWeL5MEoX6YxyxRdfGZL2loOzdsF0Hnww2hxnN-OqAfdnvdOUAmY76_G7Pzwe48sCQbji6uehkxgT5eNjqaxUeucjhjxOfqQTCLAP1BNF3AHm9fJMaaPcZW40_9sSQLzwpUscXB3aNf9Io5JlbpfpsQeBJm5X5d4qZTc8MswD0jHwU6h4Mn4_4HBpmS0Dv-eO7Hi9KbmFWfMcC6RcFxenUyhhXXZo6vk-mY6iBDwGjftaFld2TX7j66Y2VNNlI736cky7Z7QUwcw_TzyWaQsMxHf6g4UEO5Y_xNvtIo19FUoheHVDfNKF2ImkohHC.JSQqsmyQ_3V1ZZMiVBY4rg';
//     this.storeId = 493001;
//     this.accessToken = null;
//     this.tokenExpiry = null;
//   }

//   // Get access token using refresh token
//   async getAccessToken() {
//     try {
//       // Check if we have a valid cached token
//       const cachedToken = await AsyncStorage.getItem('autods_access_token');
//       const cachedExpiry = await AsyncStorage.getItem('autods_token_expiry');
      
//       if (cachedToken && cachedExpiry && new Date().getTime() < parseInt(cachedExpiry)) {
//         this.accessToken = cachedToken;
//         return this.accessToken;
//       }

//       // Get new token using refresh token
//       const response = await fetch('https://auth.autods.com/oauth2/token', {
//         method: 'POST',
//         headers: {
//           'cache-control': 'no-cache',
//           'content-type': 'application/x-www-form-urlencoded'
//         },
//         body: `grant_type=refresh_token&client_id=49ctfpocq0qgdnsg1qv2u432tk&refresh_token=${this.refreshToken}`
//       });

//       const tokenData = await response.json();
//       this.accessToken = tokenData.id_token;
      
//       // Cache token for 1 hour (tokens usually expire in 1 hour)
//       const expiryTime = new Date().getTime() + (60 * 60 * 1000);
//       await AsyncStorage.setItem('autods_access_token', this.accessToken);
//       await AsyncStorage.setItem('autods_token_expiry', expiryTime.toString());
      
//       return this.accessToken;
//     } catch (error) {
//       console.error('Error getting AutoDS access token:', error);
//       throw error;
//     }
//   }

//   // Fetch products from AutoDS API
//   async fetchProducts(limit = 500, offset = 0) {
//     try {
//       const token = await this.getAccessToken();
      
//       const body = {
//         "filters": [{
//           "name": "variations.active_buy_item.site_id",
//           "value_list": ["39"],
//           "op": "in",
//           "value_type": "list_int"
//         }],
//         "product_status": 2,
//         "limit": limit,
//         "offset": offset
//       };

//       const response = await fetch(`${this.baseUrl}/products/${this.storeId}/list/`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'content-type': 'application/json'
//         },
//         body: JSON.stringify(body)
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
//       return data.results || [];
//     } catch (error) {
//       console.error('Error fetching AutoDS products:', error);
//       throw error;
//     }
//   }

//   // Fetch all products (handles pagination)
//   async fetchAllProducts() {
//     try {
//       let allProducts = [];
//       let offset = 0;
//       let hasMore = true;

//       while (hasMore) {
//         console.log(`Fetching products with offset: ${offset}`);
//         const products = await this.fetchProducts(500, offset);
        
//         if (products.length > 0) {
//           allProducts = [...allProducts, ...products];
//           offset += 500;
          
//           // If we got less than 500 products, we've reached the end
//           hasMore = products.length === 500;
//         } else {
//           hasMore = false;
//         }
//       }

//       console.log(`Fetched ${allProducts.length} products from AutoDS`);
//       return allProducts;
//     } catch (error) {
//       console.error('Error fetching all AutoDS products:', error);
//       throw error;
//     }
//   }

//   // Transform AutoDS product to our database format
//   transformProduct(autodsProduct) {
//     const variation = autodsProduct.variations?.[0];
//     if (!variation) return null;

//     // Extract images from the AutoDS product
//     const images = autodsProduct.images?.map(img => img.url) || [];
    
//     // Create tags from AutoDS tags
//     const tags = autodsProduct.tags || [];

//     return {
//       name: autodsProduct.title || 'Untitled Product',
//       description: autodsProduct.description || '',
//       price: variation.price || 0,
//       original_price: variation.active_buy_item?.price || variation.price || 0,
//       category_id: this.getCategoryIdFromTags(tags),
//       images: images,
//       stock: variation.quantity || 0,
//       sku: variation.sku || autodsProduct.sku,
//       brand: variation.active_buy_item?.manufacturer || 'Unknown',
//       is_featured: Math.random() > 0.8, // 20% chance to be featured
//       is_on_sale: variation.price < (variation.active_buy_item?.price || variation.price),
//       tags: tags,
//       autods_id: autodsProduct.id,
//       rating: Math.random() * 2 + 3, // Random rating between 3-5
//       reviews_count: Math.floor(Math.random() * 100) + 1
//     };
//   }

//   // Map AutoDS tags to category IDs (you can customize this mapping)
//   getCategoryIdFromTags(tags) {
//     if (!tags || tags.length === 0) return 1; // Default to Technology

//     const tagString = tags.join(' ').toLowerCase();
    
//     if (tagString.includes('watch') || tagString.includes('phone') || tagString.includes('electronic')) {
//       return 1; // Technology
//     }
//     if (tagString.includes('fashion') || tagString.includes('clothing') || tagString.includes('apparel')) {
//       return 2; // Fashion
//     }
//     if (tagString.includes('sport') || tagString.includes('fitness') || tagString.includes('outdoor')) {
//       return 3; // Sports
//     }
//     if (tagString.includes('home') || tagString.includes('kitchen') || tagString.includes('household')) {
//       return 4; // Supermarket
//     }
    
//     return 1; // Default to Technology
//   }

//   // Sync products from AutoDS to local database
//   async syncProducts() {
//     try {
//       console.log('Starting AutoDS product sync...');
      
//       const autodsProducts = await this.fetchAllProducts();
//       let syncedCount = 0;
//       let errorCount = 0;

//       for (const autodsProduct of autodsProducts) {
//         try {
//           const transformedProduct = this.transformProduct(autodsProduct);
          
//           if (transformedProduct) {
//             // Check if product already exists
//             const existingProduct = await DatabaseService.db?.getFirstAsync(
//               'SELECT id FROM products WHERE autods_id = ?',
//               [autodsProduct.id]
//             );

//             if (existingProduct) {
//               // Update existing product
//               await DatabaseService.db?.runAsync(`
//                 UPDATE products SET 
//                   name = ?, description = ?, price = ?, original_price = ?, 
//                   images = ?, stock = ?, brand = ?, is_on_sale = ?, 
//                   tags = ?, updated_at = CURRENT_TIMESTAMP
//                 WHERE autods_id = ?
//               `, [
//                 transformedProduct.name,
//                 transformedProduct.description,
//                 transformedProduct.price,
//                 transformedProduct.original_price,
//                 JSON.stringify(transformedProduct.images),
//                 transformedProduct.stock,
//                 transformedProduct.brand,
//                 transformedProduct.is_on_sale ? 1 : 0,
//                 JSON.stringify(transformedProduct.tags),
//                 autodsProduct.id
//               ]);
//             } else {
//               // Create new product
//               await DatabaseService.createProduct(transformedProduct);
//             }
            
//             syncedCount++;
//           }
//         } catch (error) {
//           console.error(`Error syncing product ${autodsProduct.id}:`, error);
//           errorCount++;
//         }
//       }

//       console.log(`Sync completed: ${syncedCount} products synced, ${errorCount} errors`);
      
//       // Clear cache to force reload of products
//       await DatabaseService.clearCache();
      
//       return {
//         success: true,
//         syncedCount,
//         errorCount,
//         totalFetched: autodsProducts.length
//       };
//     } catch (error) {
//       console.error('Error syncing AutoDS products:', error);
//       return {
//         success: false,
//         error: error.message
//       };
//     }
//   }

//   // Schedule periodic sync (call this on app startup)
//   async scheduleSync() {
//     try {
//       const lastSync = await AsyncStorage.getItem('autods_last_sync');
//       const now = new Date().getTime();
//       const sixHours = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

//       // Sync if never synced before or if 6 hours have passed
//       if (!lastSync || (now - parseInt(lastSync)) > sixHours) {
//         console.log('Triggering scheduled AutoDS sync...');
//         const result = await this.syncProducts();
        
//         if (result.success) {
//           await AsyncStorage.setItem('autods_last_sync', now.toString());
//         }
        
//         return result;
//       } else {
//         console.log('AutoDS sync not needed yet');
//         return { success: true, message: 'Sync not needed' };
//       }
//     } catch (error) {
//       console.error('Error in scheduled sync:', error);
//       return { success: false, error: error.message };
//     }
//   }

//   // Manual sync trigger (for pull-to-refresh or manual sync button)
//   async forceSyncProducts() {
//     try {
//       const result = await this.syncProducts();
      
//       if (result.success) {
//         const now = new Date().getTime();
//         await AsyncStorage.setItem('autods_last_sync', now.toString());
//       }
      
//       return result;
//     } catch (error) {
//       console.error('Error in force sync:', error);
//       return { success: false, error: error.message };
//     }
//   }

//   // Get sync status
//   async getSyncStatus() {
//     try {
//       const lastSync = await AsyncStorage.getItem('autods_last_sync');
//       return {
//         lastSyncTime: lastSync ? new Date(parseInt(lastSync)) : null,
//         needsSync: !lastSync || (new Date().getTime() - parseInt(lastSync)) > (6 * 60 * 60 * 1000)
//       };
//     } catch (error) {
//       console.error('Error getting sync status:', error);
//       return { lastSyncTime: null, needsSync: true };
//     }
//   }
// }

// export default new AutoDSService();

// src/services/AutoDSService.js
import DatabaseService from './DatabaseService';

class AutoDSService {
  constructor() {
    this.refreshToken = 'eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ.MEqHLa0D7V7RY3ILq84rQ8ierawePFFjJbddoQQPAT7mGm7-JscYeu-7E4TyHs1mYOdd3yKVErJs8G5nkMts4l9f9AwnfjeGDYE7Byv0RbpVllBwXgB6mzQyowsRH6WOe0FMSd1axn_mzeC7GpSJlqcincyWeeAFDkdydh9moFr1vdo7Wth6bl6chNqwnmy25m2PgZQT_T4Rbl7TYvsemQQKy71-7VU9kw_J1iecWUK8cl2HeW4ns6EwDmw9AgqcRbW2OY9glXP3mSe0Dx0izFNz5-94-bx_4fLuDUQlooFb1yO5HDTmhsUR9UF469ILrCjwGtbPvjvjP7Hod0SbZg.QZjtVDezMKzFnwk_.RzEkBEH0B6VzJpKG7wt1FqT7OcYVBj3bfHHd82ZaDRi17ZKYPtokPLODCy2EqqXEP9X6Zz24O4ggMItq2QAJhycqZYRkAJXYtdBmzEOzqIbWrXSYeN63u8p5_pmuBLEAMR05GcD7D8LZS52s8dY_LDsJh7N9EgeZLrxs82jTJhzRL6sIQHvFenEl0iOKC6TvNKzhMu2itPMiwcvNGeMO3-iOMZKsUeYEpxFMa0KjTulRzM2jjeYe4bXkmHyIogJ56vHg_uDGHVFZK5IhmRMrkSUL2q54-DSFhtgiyNtIfnT600P20yzp6JF2qCRdXE7J-9-xN2kDKPqx5NK_UCERxtZjn8TAGZbCn5kZvw9rdJXbBGlrdYZpZNcJtK9nz1zs1BVTk86d2vt_QrXzks08KgcwiHVCr5365Tm3nZEKRVO8wZS15NCMFQ1S8LTIfR3xreulQJ_27Os77Ex0EOUjdkdRccndGrsntu4BXQAscGt38ns74T6ksCIe-pHutYJZckEstmIPtPgJgtI2yXLOFMOAyHDC6nPzrsw-VFtfHXzIFpPOwduv1qScVrPNjclABXyOjkBM_erLpyF1phZQWXeElBtv7b6a-tupwNIZBK5dLDvFTwGdmEbnUM5d-OAJhx6VvDVDLavju2nJJoJJRsYH_yXwWtK9XFXAPLZ9O8ekv1omabI2GVxkd0TsFlFB83yvg-8bFT96K9ZOZecZaJhbTd0oEey-en5UGu5DaDGJ6Hw8SeQp_0PEFBnwfbNy1O3velp1l325kCGixplZUkPrci-O_fzDj3AUZtHeyJKOiv9XM6Rt9LTO9KUWCetW8OhFAOl8NuKAfT8jSiR4KxtQwmcmwy-__6Cp1zEBTVZj6qKrkFz_uPL6-xfLbmn6k91NQcuuxcEeM_olhzg01-ApWeL5MEoX6YxyxRdfGZL2loOzdsF0Hnww2hxnN-OqAfdnvdOUAmY76_G7Pzwe48sCQbji6uehkxgT5eNjqaxUeucjhjxOfqQTCLAP1BNF3AHm9fJMaaPcZW40_9sSQLzwpUscXB3aNf9Io5JlbpfpsQeBJm5X5d4qZTc8MswD0jHwU6h4Mn4_4HBpmS0Dv-eO7Hi9KbmFWfMcC6RcFxenUyhhXXZo6vk-mY6iBDwGjftaFld2TX7j66Y2VNNlI736cky7Z7QUwcw_TzyWaQsMxHf6g4UEO5Y_xNvtIo19FUoheHVDfNKF2ImkohHC.JSQqsmyQ_3V1ZZMiVBY4rg';
    this.baseUrl = 'https://platform-api.autods.com';
    this.storeId = '493001'; // Your store ID
  }

   async getAccessToken() {
    try {
      const response = await fetch('https://auth.autods.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'cache-control': 'no-cache'
        },
        body: new URLSearchParams({
          'grant_type': 'refresh_token',
          'client_id': '49ctfpocq0qgdnsg1qv2u432tk',
          'refresh_token': this.refreshToken
        })
      });
      
      const data = await response.json();
      return data.id_token;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  mapAutodsToLocal(autodsProduct) {
    const variation = autodsProduct.variations?.[0];
    if (!variation) return null;

    return {
      name: autodsProduct.title,
      description: autodsProduct.description?.replace(/<[^>]*>/g, '') || '',
      price: variation.price,
      original_price: variation.active_buy_item?.price || variation.price,
      category_id: 1, // Default to Technology
      images: this.extractImages(autodsProduct.images),
      stock: variation.quantity || 0,
      sku: variation.sku,
      brand: variation.active_buy_item?.manufacturer || 'Unknown',
      is_featured: Math.random() > 0.8,
      is_on_sale: variation.price < (variation.active_buy_item?.price || variation.price),
      autods_id: autodsProduct.id,
      tags: autodsProduct.tags || []
    };
  }

  extractImages(images) {
    return (images || [])
      .sort((a, b) => a.index - b.index)
      .map(img => img.url)
      .slice(0, 5);
  }
}

export default new AutoDSService();