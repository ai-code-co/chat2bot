import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/utils/FirebaseInit"
import { useState } from "react"
import { toast } from "sonner"
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeClosed } from "lucide-react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await signInWithEmailAndPassword(auth, email, password)
      const loggerInUser = res.user
      if (res.user) {
        toast("You are logged-in successfully")
        if (rememberMe) {
          localStorage.setItem("userId", auth.currentUser?.uid ?? "")
        } else {
          sessionStorage.setItem("userId", auth.currentUser?.uid ?? "")
        }

        setTimeout(() => {
          navigate("/chatbot")
        }, 300)
      }
      console.log("user logged-in successfully", loggerInUser)
    }
    catch (error) {
      console.log("Error in signing.", error)
      toast("Error in signing")
    }

  }
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => handleLogin(e)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <div className="flex items-center px-1 border-1 rounded-md ">
                  {/* <div className="flex"> */}
                  <Input id="password" type={`${showPassword ? 'text' : 'password'}`} required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-none  focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  {/* </div> */}

                  <button type="button" onClick={() => setShowPassword(prev => !prev)}>
                    {showPassword ? <Eye size={20} /> : <EyeClosed size={20} />}
                  </button>

                </div>
              </Field>

              <Field className="mt-0">
                <div className="flex justify-end gap-2">
                  <FieldLabel htmlFor="remember">Remember Me?</FieldLabel>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />

                </div>
              </Field>
              <Field>
                <Button type="submit">Login</Button>
                {/* <Button variant="outline" type="button">
                  Login with Google
                </Button> */}
                <FieldDescription className="text-center">
                  Don&apos;t have an account? <Link to="/signup" className="underline">Sign up</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
