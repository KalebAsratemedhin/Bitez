import { AuthPageLayout } from "@/components/layout";
import SigninForm from "@/components/SigninForm";


export default function SigninPage() {
  return (
    <AuthPageLayout
      title="Welcome back"
      subtitle="Sign in to your account to continue ordering and managing your deliveries."
    >
      <SigninForm />
    </AuthPageLayout>
  );
}
