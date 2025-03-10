import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/useAuth";
import { insertUserSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Extend the schema with validation rules
const formSchema = insertUserSchema.extend({
  password: z.string().min(6, {
    message: "Password must be at least 6 characters",
  }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function Register() {
  const { register: registerUser } = useAuth();
  const [location, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);
      await registerUser(values.username, values.password);
      toast({
        title: "Registration successful",
        description: "You can now play casino games!",
      });
      navigate("/");
    } catch (error) {
      console.error("Registration error:", error);
      // Error is handled by the useAuth hook
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md bg-secondary border-neutral-dark">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create an Account</CardTitle>
          <CardDescription className="text-center">
            Register to track your game statistics and save your progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter a username" 
                        {...field} 
                        className="bg-neutral-dark border-neutral-medium focus:border-accent-green" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Create a password" 
                        {...field} 
                        className="bg-neutral-dark border-neutral-medium focus:border-accent-green" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Confirm your password" 
                        {...field} 
                        className="bg-neutral-dark border-neutral-medium focus:border-accent-green" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full bg-accent-green hover:bg-opacity-80 text-black font-medium"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Register"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-neutral-light text-center">
            By registering, you agree to our 
            <Link href="/terms">
              <a className="text-accent-green hover:underline ml-1">Terms of Service</a>
            </Link>
            {" "}and{" "}
            <Link href="/privacy">
              <a className="text-accent-green hover:underline">Privacy Policy</a>
            </Link>
          </div>
          <div className="text-center">
            <span className="text-neutral-light">Already have an account?</span>
            {" "}
            <Link href="/login">
              <a className="text-accent-green hover:underline">Login</a>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
