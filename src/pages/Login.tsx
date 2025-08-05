import React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Login = () => {
  const { toast } = useToast();
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      const success = await login(formData.email, formData.password);
      
      if (success) {
        toast({
          title: "წარმატება!",
          description: "შესვლა წარმატებით განხორციელდა",
        });
        
        // შესვლის შემდეგ გადავამისამართოთ დეშბორდზე
        navigate("/dashboard");
      } else {
        setError("არასწორი ელ-ფოსტა ან პაროლი. გთხოვთ სცადოთ ხელახლა.");
      }
    } catch (err) {
      setError("შესვლისას დაფიქსირდა შეცდომა. გთხოვთ სცადოთ მოგვიანებით.");
      console.error("Login error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto py-10 px-4 pt-24">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">შესვლა</CardTitle>
              <CardDescription className="text-center">
                შეიყვანეთ თქვენი მონაცემები სისტემაში შესასვლელად
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-1">სატესტო მონაცემები:</p>
                <p className="text-xs">მომხმარებელი: <span className="font-mono">test@example.com</span> / <span className="font-mono">password</span></p>
                <p className="text-xs">ადმინი: <span className="font-mono">admin@example.com</span> / <span className="font-mono">adminpass</span></p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    ელ-ფოსტა
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="თქვენი ელ-ფოსტის მისამართი"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    პაროლი
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="შეიყვანეთ პაროლი"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="flex items-center justify-end">
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    დაგავიწყდათ პაროლი?
                  </Link>
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "მიმდინარეობს..." : "შესვლა"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <div className="text-sm text-muted-foreground">
                არ გაქვთ ანგარიში?{" "}
                <Link to="/register" className="text-primary hover:underline">
                  რეგისტრაცია
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
