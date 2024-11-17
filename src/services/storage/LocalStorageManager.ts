// export class LocalStorageManager {
//   public static readonly STORAGE_PREFIX = "password-manager-";

//   protected static async storeInStorageSync(
//     key: string,
//     value: string
//   ): Promise<void> {
//     try {
//       await Promise.resolve(
//         localStorage.setItem(this.STORAGE_PREFIX + key, value)
//       );
//     } catch (error) {
//       console.error(`Error storing key "${key}" in storage:`, error);
//     }
//   }

//   protected static async getFromStorageSync(
//     key: string
//   ): Promise<string | null> {
//     try {
//       return await Promise.resolve(
//         localStorage.getItem(this.STORAGE_PREFIX + key)
//       );
//     } catch (error) {
//       console.error(`Error retrieving key "${key}" from storage:`, error);
//       return null;
//     }
//   }

//   protected static async deleteFromStorageSync(key: string): Promise<void> {
//     try {
//       await Promise.resolve(localStorage.removeItem(this.STORAGE_PREFIX + key));
//     } catch (error) {
//       console.error(`Error deleting key "${key}" from storage:`, error);
//     }
//   }

//   public static async clearStorage(): Promise<void> {
//     try {
//       await Promise.resolve(localStorage.clear());
//     } catch (error) {
//       console.error("Error clearing storage:", error);
//     }
//   }
// }
