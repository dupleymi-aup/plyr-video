import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { User, Bell, Shield, Trash2, BarChart3 } from "lucide-react";

const settingsLinks = [
  { href: "/settings/profile", label: "Профиль", description: "Управление публичным профилем", icon: User },
  { href: "/settings/stats", label: "Статистика", description: "Просмотр вашей активности", icon: BarChart3 },
  { href: "/settings/notifications", label: "Уведомления", description: "Настройка уведомлений", icon: Bell },
  { href: "/settings/security", label: "Безопасность", description: "Пароль и настройки безопасности", icon: Shield },
];

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Настройки</h1>
        <p className="text-muted-foreground">Управление аккаунтом</p>
      </div>

      <div className="space-y-4">
        {settingsLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium">{link.label}</h3>
                    <p className="text-sm text-muted-foreground">{link.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="mt-8 border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Опасная зона</CardTitle>
          <CardDescription>
            Необратимые действия, влияющие на аккаунт
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Удалить аккаунт
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
