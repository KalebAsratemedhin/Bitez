import { AuthPageLayout } from "@/components/layout";
import SignupForm from "@/components/SignupForm";


export default function SignupPage() {
  return (
    <AuthPageLayout
      title="Create your account"
      subtitle="Join Bitez to order from the best local restaurants and get food delivered to your door."
    >
      <SignupForm />
    </AuthPageLayout>
  );
}
