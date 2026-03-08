import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Camera, Save, Lock } from 'lucide-react';

function getInitials(name: string) {
  return name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function Profile() {
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSaveProfile = () => {
    if (!name.trim() || !email.trim()) {
      toast.error('Nome e email são obrigatórios');
      return;
    }
    // Update user in localStorage
    try {
      const usersRaw = localStorage.getItem('finance_users');
      if (usersRaw && user) {
        const users = JSON.parse(usersRaw);
        const updated = users.map((u: any) =>
          u.id === user.id ? { ...u, name, email } : u
        );
        localStorage.setItem('finance_users', JSON.stringify(updated));
        // Update session
        const session = JSON.parse(localStorage.getItem('finance_session') || '{}');
        localStorage.setItem('finance_session', JSON.stringify({ ...session, name, email }));
      }
    } catch {}
    toast.success('Dados atualizados com sucesso!');
  };

  const handleChangePassword = () => {
    if (!currentPassword) {
      toast.error('Informe a senha atual');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    // Verify current password
    try {
      const passwords = JSON.parse(localStorage.getItem('finance_passwords') || '{}');
      if (user && passwords[user.email] !== currentPassword) {
        toast.error('Senha atual incorreta');
        return;
      }
      if (user) {
        passwords[user.email] = newPassword;
        localStorage.setItem('finance_passwords', JSON.stringify(passwords));
      }
    } catch {}
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    toast.success('Senha atualizada com sucesso!');
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>

      {/* Avatar Section */}
      <Card>
        <CardContent className="pt-6 flex flex-col items-center gap-4">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" placeholder="(00) 00000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input id="company" placeholder="Opcional" value={company} onChange={e => setCompany(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleSaveProfile} className="w-full sm:w-auto">
            <Save className="h-4 w-4 mr-2" />
            Salvar alterações
          </Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Alterar Senha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Senha atual</Label>
            <Input id="current-password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleChangePassword} variant="outline" className="w-full sm:w-auto">
            Atualizar senha
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
