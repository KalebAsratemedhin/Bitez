export interface RestaurantOwner {
    _id: string;
    name?: string;
    email?: string;
    phoneNumber?: string;
}

export interface Restaurant {
    _id: string;
    name: string;
    location: string;
    ownerId: string | RestaurantOwner;
    status: string;
    menu?: unknown;
    logo?: string;
    latitude?: number;
    longitude?: number;
    deliveryAreaRadius?: number;
    createdAt?: Date;
    updatedAt?: Date;
    owner?: RestaurantOwner;
}

export interface PaginatedRestaurants {
    restaurants: Restaurant[];
    total: number;
}