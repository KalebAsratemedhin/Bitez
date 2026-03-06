export interface UserReadModelItem {
  userId: string;
  name: string;
  email: string;
  phoneNumber?: string;
}

export interface IUserReadModelRepository {
  upsert(item: UserReadModelItem): Promise<void>;
  findById(userId: string): Promise<UserReadModelItem | null>;
}
