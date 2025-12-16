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
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { auth } from "@/utils/FirebaseInit"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { Eye, EyeClosed } from "lucide-react"
import { useState } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { toast } from "sonner"

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()
    const [showPassword, setShowPassword] = useState(false)


  const handleSignUp = async (e:React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password)
      const user = res.user
      if(auth.currentUser){
        toast("Your account has created")
        navigate("/login")
      }
      console.log("created user signup-form.tsx",user)
    }
    catch(error){
      console.log("Error while creating user account",error)
      toast("Error while creating user account")
    }
  }
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => handleSignUp(e)}>
          <FieldGroup>
            {/* <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input id="name" type="text" placeholder="John Doe" required />
            </Field> */}
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete=""
              />
              {/* <FieldDescription>
                We&apos;ll use this to contact you. We will not share your email
                with anyone else.
              </FieldDescription> */}
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
               <div className="flex items-center px-1 border-1 rounded-md ">
                  {/* <div className="flex"> */}
                    <Input id="password" type={`${showPassword ? 'text' : 'password'}`} required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-none  focus-visible:ring-0 focus-visible:ring-offset-0"
                    />  
                  {/* </div> */}
                  
                    <button type="button" onClick={()=>setShowPassword(prev => !prev)}>
                      {showPassword ? <Eye size={20} /> :<EyeClosed size={20}/>}
                    </button>
                  
                </div>
              <FieldDescription>
                Must be at least 8 characters long.
              </FieldDescription>
            </Field>
            {/* <Field>
              <FieldLabel htmlFor="confirm-password">
                Confirm Password
              </FieldLabel>
              <Input id="confirm-password" type="password" required />
              <FieldDescription>Please confirm your password.</FieldDescription>
            </Field> */}
            <FieldGroup>
              <Field>
                <Button type="submit">Create Account</Button>
                {/* <Button variant="outline" type="button">
                  Sign up with Google
                </Button> */}
                <FieldDescription className="px-6 text-center">
                  Already have an account? <Link to="/login" className="underline">Log in</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
