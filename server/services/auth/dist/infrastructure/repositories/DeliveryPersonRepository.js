import DeliveryPerson from "../persistence/models/deliveryPerson.js";
export class DeliveryPersonRepository {
    async create(data) {
        return DeliveryPerson.create(data);
    }
    async findByUserId(userId) {
        return DeliveryPerson.findOne({ userId }).lean();
    }
}
