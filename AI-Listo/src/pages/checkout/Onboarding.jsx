const API_BASE = "https://ai-2-7ikc.onrender.com";

const [step, setStep] = useState(1);
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

const [form, setForm] = useState({
    businessType: "",
    leadSources: [],
    mainGoal: "",
});

useEffect(() => {
    const userId = localStorage.getItem("trialUserId");

    if (!userId) {
        navigate("/start-trial");
        return;
    }

    const checkUser = async () => {
    try {
        const res = await fetch(`${API_BASE}/api/auth/user/${userId}`);
        const data = await res.json();

        if (!data.success) {
            navigate("/start-trial");
            return;
        }

        if (data.user.onboardingCompleted) {
            navigate("/crm/dashboard");
        }

    } catch (err) {
            console.error("CHECK USER ERROR:", err);
            setError("Unable to load onboarding. Please refresh and try again.");
        }
    };

    checkUser();
}, [navigate]);

const toggleLeadSource = (source) => {
    setForm((prev) => {
    const exists = prev.leadSources.includes(source);

    return {
        ...prev,
        leadSources: exists
        ? prev.leadSources.filter((item) => item !== source)
        : [...prev.leadSources, source],
    };
    });
};

const canContinue = () => {
    if (step === 1) return !!form.businessType;
    if (step === 2) return true;
    if (step === 3) return !!form.mainGoal;
    return true;
};

const nextStep = () => {
    if (!canContinue()) {
        setError("Please make a selection to continue.");
        return;
    }

    setError("");
    setStep((prev) => Math.min(prev + 1, 4));
};

const skipLeadSources = () => {
    if (step === 2) {
        setForm((prev) => ({
        ...prev,
        leadSources: [],
        }));

        setStep(3);
    }
};

const handleFinish = async () => {
    const userId = localStorage.getItem("trialUserId");

    if (!userId) {
        navigate("/start-trial");
        return;
    }

    setLoading(true);
    setError("");

    try {
        const res = await fetch(`${API_BASE}/api/auth/save-onboarding`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            userId,
            ...form,
        }),
        });

        const data = await res.json();

        if (data.success) {
            localStorage.setItem("onboardingComplete", "true");
            navigate("/crm/dashboard");
        } else {
            setError(data.message || "Could not save onboarding.");
        }

    } catch (err) {
        console.error("SAVE ONBOARDING ERROR:", err);
        setError("Server error. Please try again.");
    } finally {
        setLoading(false);
    }
};