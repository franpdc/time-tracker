"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Verifique seu e-mail para confirmar o cadastro!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Login realizado com sucesso!");
        router.push("/");
        router.refresh();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Ocorreu um erro na autenticação";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,107,0,0.05),transparent_50%)] pointer-events-none" />
      
      <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-accent to-cyan-glow" />
        
        <CardHeader className="space-y-2 pt-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-accent shadow-[0_0_20px_rgba(255,107,0,0.3)]">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
              <path d="M4 2L12 8L4 14V2Z" fill="#0D0D0D" />
            </svg>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            {isSignUp ? "Criar conta" : "Bem-vindo de volta"}
          </CardTitle>
          <CardDescription className="text-muted-foreground/70">
            {isSignUp 
              ? "Comece a rastrear seu foco de forma profissional" 
              : "Acesse seus dados e continue sua jornada de produtividade"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-orange-accent transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-background/50 border-border/50 focus:border-orange-accent/50 focus:ring-orange-accent/20"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-orange-accent transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-background/50 border-border/50 focus:border-orange-accent/50 focus:ring-orange-accent/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-orange-accent transition-colors focus:outline-none"
                  aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-11 bg-orange-accent hover:bg-orange-accent/90 text-black font-semibold text-base transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(255,107,0,0.2)]" 
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                isSignUp ? "Criar Conta" : "Entrar"
              )}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col border-t border-border/30 bg-accent/20 pt-6 pb-8">
          <p className="text-sm text-muted-foreground">
            {isSignUp ? "Já tem uma conta?" : "Ainda não tem uma conta?"}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="ml-2 font-semibold text-orange-accent hover:underline focus:outline-none"
            >
              {isSignUp ? "Faça login" : "Cadastre-se"}
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
