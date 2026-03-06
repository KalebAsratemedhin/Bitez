export interface MenuItem {
    _id?: string;
    name: string;
    description: string;
    price: number;
    itemPicture: string;
}
  
export interface Menu {
    _id: string;
    menuName: string;
    restaurantId: string;
    menuItems: MenuItem[];
    createdAt?: Date;
    updatedAt?: Date;
}