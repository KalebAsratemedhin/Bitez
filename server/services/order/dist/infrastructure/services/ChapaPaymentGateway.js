export class ChapaPaymentGateway {
    apiKey;
    baseUrl;
    constructor(apiKey, baseUrl = "https://api.chapa.co/v1/transaction/initialize") {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }
    async initializePayment(input) {
        const body = JSON.stringify({
            amount: input.amount,
            currency: "ETB",
            email: input.email,
            first_name: input.firstName,
            phone_number: input.phoneNumber,
            tx_ref: input.txRef,
            return_url: input.returnUrl,
            "customization[title]": "Order payment",
            "meta[hide_receipt]": "true",
        });
        const response = await fetch(this.baseUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                "Content-Type": "application/json",
            },
            body,
        });
        const result = (await response.json());
        if (result.status === "failed") {
            return {
                success: false,
                message: result.message ?? "Payment initialization failed",
            };
        }
        return {
            success: true,
            checkoutUrl: result.data?.checkout_url,
            message: result.message,
        };
    }
}
