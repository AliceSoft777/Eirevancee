import ResetPasswordClient from "./ResetPasswordClient"

export const metadata = {
  title: "Reset Password | Celtic Tiles",
  description: "Set a new password for your Celtic Tiles account.",
}

export default function ResetPasswordPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <ResetPasswordClient />
    </div>
  )
}
