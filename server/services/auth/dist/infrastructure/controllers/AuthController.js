export class AuthController {
    authUseCase;
    constructor(authUseCase) {
        this.authUseCase = authUseCase;
    }
    signup = async (req, res) => {
        try {
            const result = await this.authUseCase.signup(req.body);
            res.status(201).json(result);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    };
    signin = async (req, res) => {
        try {
            const result = await this.authUseCase.signin(req.body);
            res.json(result);
        }
        catch (e) {
            const message = e.message;
            console.warn("[Auth] signin failed:", message);
            res.status(401).json({ error: message });
        }
    };
    logout = async (req, res) => {
        try {
            const h = req.headers.authorization ?? req.headers.Authorization;
            const token = (typeof h === "string" ? h : "")?.split(" ")?.[1]?.trim();
            if (!token) {
                res.status(400).json({ error: "No token provided" });
                return;
            }
            const result = await this.authUseCase.logout({ token });
            res.json(result);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    };
    getCurrentUser = async (req, res) => {
        try {
            const user = await this.authUseCase.getCurrentUser({ userId: req.user.id });
            res.status(200).json(user);
        }
        catch (e) {
            res.status(400).json({ error: e.message });
        }
    };
    /** Internal: get minimal user by id for service-to-service (e.g. order/delivery enrichment). */
    getInternalUserById = async (req, res) => {
        try {
            const id = String(req.params.id ?? "").trim();
            if (!id) {
                res.status(400).json({ error: "User id required" });
                return;
            }
            const user = await this.authUseCase.getInternalUserById(id);
            if (!user) {
                res.status(404).json({ error: "User not found" });
                return;
            }
            res.status(200).json(user);
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    };
    updateProfile = async (req, res) => {
        try {
            const userId = req.user.id;
            const body = req.body;
            const user = await this.authUseCase.updateProfile(userId, {
                name: body.name,
                email: body.email,
                phoneNumber: body.phoneNumber,
                address: body.address,
            });
            res.status(200).json(user);
        }
        catch (e) {
            const message = e.message;
            if (message === "User not found")
                res.status(404).json({ error: message });
            else if (message === "Email already in use")
                res.status(400).json({ error: message });
            else
                res.status(400).json({ error: message });
        }
    };
}
