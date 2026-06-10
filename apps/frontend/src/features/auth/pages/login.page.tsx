import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/hooks/auth.hook";
import { useSignIn } from "@/features/auth/hooks/sign-in.hook";
import { signInSchema } from "@/features/auth/schemas/auth.schema";
import type {
  SessionUser,
  SignInInput,
} from "@/features/auth/types/auth.types";
import { landingByRole, Routes } from "@/lib/constants/routes.constants";
import { resolveError } from "@/lib/errors/resolve-error";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Navigate, useLocation, useNavigate } from "react-router";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation("auth");
  const { isAuthenticated, isLoading, role } = useAuth();
  const signIn = useSignIn();

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  if (!isLoading && isAuthenticated && role) {
    return <Navigate to={landingByRole[role]} replace />;
  }

  const onSubmit = (values: SignInInput) => {
    signIn.mutate(values, {
      onSuccess: (user: SessionUser) => {
        const from = (location.state as { from?: string } | null)?.from;
        navigate(from ?? landingByRole[user.userRole] ?? Routes.home, {
          replace: true,
        });
      },
    });
  };

  return (
    <Card className="w-full max-w-sm border-border">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-semibold tracking-tight text-primary">
          {t("login.title")}
        </CardTitle>
        <CardDescription>{t("login.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
            noValidate
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("login.email.label")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder={t("login.email.placeholder")}
                      className="h-11"
                      {...field}
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
                  <FormLabel>{t("login.password.label")}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {signIn.isError && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {resolveError(signIn.error)}
              </p>
            )}
            <Button
              type="submit"
              className="h-11 w-full"
              disabled={signIn.isPending}
            >
              {signIn.isPending && <Loader2 className="animate-spin" />}
              {t("login.submit")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
