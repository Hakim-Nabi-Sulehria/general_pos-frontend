import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Building2, Shield, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/lib/api";

export default function SetupSuperadmin() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgCurrency, setOrgCurrency] = useState("PKR");
  const [orgTimezone, setOrgTimezone] = useState("UTC");
  const [bootstrapSecret, setBootstrapSecret] = useState("");

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["bootstrap-status"],
    queryFn: async () => {
      const res = await authApi.bootstrapStatus();
      return res.data as { superadminExists: boolean };
    },
  });

  useEffect(() => {
    if (status?.superadminExists) {
      navigate("/login", { replace: true });
    }
  }, [status, navigate]);

  const setupMutation = useMutation({
    mutationFn: () =>
      authApi.bootstrapSuperadmin(
        {
          name: name.trim(),
          email: email.trim(),
          password,
          orgName: orgName.trim(),
          orgEmail: orgEmail.trim() || undefined,
          orgAddress: orgAddress.trim(),
          orgPhone: orgPhone.trim() || undefined,
          orgCurrency: orgCurrency.trim() || undefined,
          orgTimezone: orgTimezone.trim() || undefined,
        },
        bootstrapSecret.trim() || undefined
      ),
    onSuccess: () => {
      toast({
        title: "Super admin created",
        description: "You can sign in with the email and password you set.",
      });
      navigate("/login", { replace: true });
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.message)
          ? err.response.data.message.join(", ")
          : null) ||
        "Setup failed";
      toast({ title: "Error", description: String(msg), variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !name ||
      !email ||
      password.length < 6 ||
      !orgName ||
      !orgAddress
    ) {
      toast({
        title: "Missing fields",
        description:
          "Fill super admin name, email, password (min 6 chars), organization name and address.",
        variant: "destructive",
      });
      return;
    }
    setupMutation.mutate();
  };

  if (statusLoading || status?.superadminExists) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg shadow-lg border-t-4 border-t-primary">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">One-time setup</CardTitle>
          </div>
          <CardDescription>
            Create the only <strong>SUPERADMIN</strong> account and your first
            organization. This page works only while no super admin exists.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <Alert>
              <Building2 className="h-4 w-4" />
              <AlertTitle>Organization</AlertTitle>
              <AlertDescription>
                Same fields as elsewhere: name, address, optional contact email /
                phone, currency and timezone defaults.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Organization name *</Label>
                <Input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="My Company"
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Organization email (optional, unique)</Label>
                <Input
                  type="email"
                  value={orgEmail}
                  onChange={(e) => setOrgEmail(e.target.value)}
                  placeholder="hq@company.com"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Organization address *</Label>
                <Input
                  value={orgAddress}
                  onChange={(e) => setOrgAddress(e.target.value)}
                  placeholder="Street, city, country"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Phone (optional)</Label>
                <Input
                  value={orgPhone}
                  onChange={(e) => setOrgPhone(e.target.value)}
                  placeholder="+92..."
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Input
                  value={orgCurrency}
                  onChange={(e) => setOrgCurrency(e.target.value)}
                  placeholder="PKR"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Timezone</Label>
                <Input
                  value={orgTimezone}
                  onChange={(e) => setOrgTimezone(e.target.value)}
                  placeholder="UTC"
                />
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <p className="text-sm font-medium">Super admin account</p>
              <div className="space-y-2">
                <Label>Full name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Super Admin"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Password * (min 6 characters)</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label>Bootstrap secret (optional)</Label>
                <Input
                  type="password"
                  value={bootstrapSecret}
                  onChange={(e) => setBootstrapSecret(e.target.value)}
                  placeholder="Only if server has AUTH_BOOTSTRAP_SECRET set"
                />
                <p className="text-xs text-muted-foreground">
                  If your API has <code className="text-xs">AUTH_BOOTSTRAP_SECRET</code>{" "}
                  in environment, paste the same value here (sent as header).
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button variant="ghost" asChild className="w-full sm:w-auto">
              <Link to="/login">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to login
              </Link>
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={setupMutation.isPending}
            >
              {setupMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create super admin"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
